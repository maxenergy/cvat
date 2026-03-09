from dataclasses import asdict, dataclass
from datetime import UTC, datetime
import io
import json
from pathlib import Path
import uuid

from fastapi import HTTPException
from PIL import Image


@dataclass
class UploadRecord:
    upload_id: str
    filename: str | None
    content_type: str | None
    width: int
    height: int
    size_bytes: int
    storage_format: str
    created_at: str


class UploadStorage:
    def __init__(self, base_dir: Path):
        self.base_dir = base_dir
        self.base_dir.mkdir(parents=True, exist_ok=True)

    def image_path(self, upload_id: str) -> Path:
        return self.base_dir / f"{upload_id}.png"

    def metadata_path(self, upload_id: str) -> Path:
        return self.base_dir / f"{upload_id}.json"

    def save_image_bytes(
        self,
        image_bytes: bytes,
        *,
        filename: str | None,
        content_type: str | None,
    ) -> dict:
        image = self._decode_image_bytes(image_bytes)
        upload_id = uuid.uuid4().hex
        image.save(self.image_path(upload_id), format="PNG")
        record = UploadRecord(
            upload_id=upload_id,
            filename=filename,
            content_type=content_type,
            width=image.width,
            height=image.height,
            size_bytes=len(image_bytes),
            storage_format="png",
            created_at=datetime.now(UTC).isoformat(),
        )
        self.metadata_path(upload_id).write_text(
            json.dumps(asdict(record), ensure_ascii=False, indent=2), encoding="utf-8"
        )
        return asdict(record)

    def load_image(self, upload_id: str):
        path = self.image_path(upload_id)
        if not path.exists():
            raise HTTPException(status_code=404, detail="upload not found")
        return Image.open(path).convert("RGB")

    @staticmethod
    def _decode_image_bytes(image_bytes: bytes):
        try:
            return Image.open(io.BytesIO(image_bytes)).convert("RGB")
        except Exception as exc:  # noqa: BLE001
            raise HTTPException(status_code=400, detail="invalid uploaded image") from exc