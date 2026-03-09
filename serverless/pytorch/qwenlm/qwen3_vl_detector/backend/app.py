from fastapi import FastAPI, HTTPException, Request
import annotation_service
from schemas import AnnotateRequest, DetectRequest, UploadResponse


app = FastAPI(title="Qwen-VL detector backend")


@app.get("/healthz")
def healthz():
    return {"ok": True}


@app.post("/detect")
def detect(req: DetectRequest):
    if not req.labels:
        raise HTTPException(status_code=400, detail="labels must not be empty")

    image = annotation_service.decode_image(req.image_base64)
    result = annotation_service.annotate_image(
        image,
        labels=req.labels,
        threshold=req.threshold,
        prompt_template=req.prompt_template,
        max_detections=req.max_detections,
        frame=0,
    )
    return {
        "detections": result["detections"],
        "width": result["width"],
        "height": result["height"],
    }


@app.post("/api/upload", response_model=UploadResponse)
async def upload_image(request: Request):
    content_type = annotation_service.validate_upload_content_type(
        request.headers.get("content-type")
    )
    image_bytes = await request.body()
    if not image_bytes:
        raise HTTPException(status_code=400, detail="uploaded file is empty")

    return annotation_service.UPLOAD_STORAGE.save_image_bytes(
        image_bytes,
        filename=request.headers.get("x-filename"),
        content_type=content_type,
    )


@app.post("/api/annotate")
def annotate(req: AnnotateRequest):
    if not req.upload_id and not req.image_base64:
        raise HTTPException(status_code=400, detail="upload_id or image_base64 is required")
    if req.upload_id and req.image_base64:
        raise HTTPException(status_code=400, detail="upload_id and image_base64 are mutually exclusive")

    image = (
        annotation_service.UPLOAD_STORAGE.load_image(req.upload_id)
        if req.upload_id
        else annotation_service.decode_image(req.image_base64)
    )
    return annotation_service.annotate_image(
        image,
        labels=req.labels,
        threshold=req.threshold,
        prompt_template=req.prompt_template,
        max_detections=req.max_detections,
        frame=req.frame,
    )
