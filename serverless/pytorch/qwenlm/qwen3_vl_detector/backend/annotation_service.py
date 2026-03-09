from functools import lru_cache
import base64
import io
import os
from pathlib import Path

from fastapi import HTTPException
from PIL import Image

from model import create_detector
from storage import UploadStorage


UPLOAD_STORAGE = UploadStorage(
    Path(os.environ.get("CVAT_ANNOTATION_UPLOAD_DIR", "/tmp/cvat-auto-annotation-uploads"))
)


@lru_cache(maxsize=1)
def get_detector():
    return create_detector()


def decode_image(image_base64: str):
    try:
        image_bytes = base64.b64decode(image_base64)
        return Image.open(io.BytesIO(image_bytes)).convert("RGB")
    except Exception as exc:  # noqa: BLE001
        raise HTTPException(status_code=400, detail="invalid image payload") from exc


def normalize_content_type(content_type: str | None) -> str | None:
    if not content_type:
        return None
    return content_type.split(";", 1)[0].strip().lower() or None


def validate_upload_content_type(content_type: str | None):
    normalized = normalize_content_type(content_type)
    if normalized and normalized != "application/octet-stream" and not normalized.startswith("image/"):
        raise HTTPException(status_code=415, detail="unsupported upload content type")
    return normalized


def to_cvat_shapes(detections, *, frame: int = 0):
    shapes = []
    for detection in detections:
        shapes.append(
            {
                "type": "rectangle",
                "label": detection["label"],
                "points": detection["bbox"],
                "frame": frame,
                "source": "auto",
                "occluded": False,
                "outside": False,
                "z_order": 0,
                "rotation": 0,
                "attributes": [],
                "confidence": float(detection.get("score", 1.0)),
            }
        )
    return shapes


def annotate_image(image, *, labels, threshold, prompt_template, max_detections, frame):
    detector = get_detector()
    try:
        detections = detector.detect(
            image=image,
            labels=labels,
            threshold=threshold,
            prompt_template=prompt_template,
            max_detections=max_detections,
        )
    except ValueError as exc:
        raise HTTPException(status_code=502, detail=f"invalid model output: {exc}") from exc
    except RuntimeError as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc
    except Exception as exc:  # noqa: BLE001
        raise HTTPException(status_code=500, detail=f"backend inference failed: {exc}") from exc

    return {
        "detections": detections,
        "width": image.width,
        "height": image.height,
        "cvat": {
            "version": 0,
            "tags": [],
            "tracks": [],
            "shapes": to_cvat_shapes(detections, frame=frame),
        },
    }