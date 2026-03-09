FROM pytorch/pytorch:2.5.1-cuda12.1-cudnn9-runtime

WORKDIR /app

COPY requirements.txt /app/requirements.txt
RUN pip install --no-cache-dir -r /app/requirements.txt

COPY *.py /app/

ENV HOST=0.0.0.0 \
    PORT=9001 \
    QWEN_MODEL_ID=Qwen/Qwen3-VL-8B-Instruct \
    QWEN_TORCH_DTYPE=bfloat16 \
    QWEN_DEVICE_MAP=auto \
    QWEN_ATTN_IMPLEMENTATION=sdpa \
    QWEN_MAX_NEW_TOKENS=256 \
    QWEN_MIN_SCORE=0.3

CMD ["uvicorn", "app:app", "--host", "0.0.0.0", "--port", "9001"]
