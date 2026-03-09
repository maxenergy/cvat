from pydantic import BaseModel, Field


class DetectRequest(BaseModel):
    image_base64: str
    labels: list[str] = Field(default_factory=list)
    threshold: float | None = None
    prompt_template: str | None = None
    max_detections: int = 100
    require_json: bool = True


class AnnotateRequest(BaseModel):
    upload_id: str | None = None
    image_base64: str | None = None
    labels: list[str] = Field(default_factory=list)
    threshold: float | None = None
    prompt_template: str | None = None
    max_detections: int = 100
    frame: int = 0


class UploadResponse(BaseModel):
    upload_id: str
    filename: str | None = None
    content_type: str | None = None
    width: int
    height: int
    size_bytes: int
    storage_format: str = "png"
    created_at: str