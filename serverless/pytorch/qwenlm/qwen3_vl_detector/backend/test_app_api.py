import base64
import io
from pathlib import Path
import tempfile
import unittest
from unittest.mock import patch
import asyncio

from fastapi import HTTPException
from PIL import Image

import app as backend_app
from storage import UploadStorage


class FakeDetector:
    def detect(self, image, labels, threshold=None, prompt_template=None, max_detections=100):
        del image, threshold, prompt_template, max_detections
        return [{"label": labels[0] if labels else "person", "score": 0.91, "bbox": [1, 2, 30, 40]}]


class FakeRequest:
    def __init__(self, body, headers=None):
        self._body = body
        self.headers = headers or {}

    async def body(self):
        return self._body


class BackendApiTest(unittest.TestCase):
    def setUp(self):
        self.temp_dir = tempfile.TemporaryDirectory()
        backend_app.annotation_service.UPLOAD_STORAGE = UploadStorage(Path(self.temp_dir.name))
        backend_app.annotation_service.get_detector.cache_clear()

    def tearDown(self):
        backend_app.annotation_service.get_detector.cache_clear()
        self.temp_dir.cleanup()

    @staticmethod
    def _png_bytes():
        image = Image.new("RGB", (64, 48), color="white")
        buffer = io.BytesIO()
        image.save(buffer, format="PNG")
        return buffer.getvalue()

    def test_upload_image(self):
        payload = asyncio.run(
            backend_app.upload_image(
                FakeRequest(
                    self._png_bytes(),
                    headers={"content-type": "image/png", "x-filename": "sample.png"},
                )
            )
        )
        self.assertEqual(payload["filename"], "sample.png")
        self.assertEqual(payload["width"], 64)
        self.assertEqual(payload["content_type"], "image/png")
        self.assertIn("created_at", payload)
        self.assertTrue(
            (backend_app.annotation_service.UPLOAD_STORAGE.base_dir / f'{payload["upload_id"]}.png').exists()
        )
        self.assertTrue(
            (backend_app.annotation_service.UPLOAD_STORAGE.base_dir / f'{payload["upload_id"]}.json').exists()
        )

    def test_upload_image_rejects_non_image_content_type(self):
        with self.assertRaises(HTTPException) as context:
            asyncio.run(
                backend_app.upload_image(
                    FakeRequest(b"not-an-image", headers={"content-type": "text/plain"})
                )
            )

        self.assertEqual(context.exception.status_code, 415)

    def test_annotate_with_upload_id_returns_cvat_shapes(self):
        upload_response = asyncio.run(backend_app.upload_image(FakeRequest(self._png_bytes())))
        upload_id = upload_response["upload_id"]

        with patch.object(backend_app.annotation_service, "get_detector", return_value=FakeDetector()):
            payload = backend_app.annotate(
                backend_app.AnnotateRequest(upload_id=upload_id, labels=["car"], frame=3)
            )
        self.assertEqual(payload["width"], 64)
        self.assertEqual(payload["cvat"]["shapes"][0]["label"], "car")
        self.assertEqual(payload["cvat"]["shapes"][0]["frame"], 3)
        self.assertEqual(payload["cvat"]["shapes"][0]["points"], [1, 2, 30, 40])

    def test_annotate_with_image_base64_returns_cvat_shapes(self):
        image_base64 = base64.b64encode(self._png_bytes()).decode("utf-8")

        with patch.object(backend_app.annotation_service, "get_detector", return_value=FakeDetector()):
            payload = backend_app.annotate(
                backend_app.AnnotateRequest(image_base64=image_base64, labels=["person"])
            )
        self.assertEqual(payload["detections"][0]["label"], "person")
        self.assertEqual(payload["cvat"]["shapes"][0]["type"], "rectangle")


if __name__ == "__main__":
    unittest.main()