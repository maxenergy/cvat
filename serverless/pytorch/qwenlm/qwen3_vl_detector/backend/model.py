import json
import os
import re
import tempfile
from dataclasses import dataclass

import torch
from transformers import AutoProcessor, Qwen3VLForConditionalGeneration


@dataclass
class ModelConfig:
    model_id: str
    torch_dtype: str
    device_map: str
    attn_implementation: str
    max_new_tokens: int
    min_score: float

    @classmethod
    def from_env(cls):
        return cls(
            model_id=os.environ.get("QWEN_MODEL_ID", "Qwen/Qwen3-VL-8B-Instruct"),
            torch_dtype=os.environ.get("QWEN_TORCH_DTYPE", "bfloat16"),
            device_map=os.environ.get("QWEN_DEVICE_MAP", "auto"),
            attn_implementation=os.environ.get("QWEN_ATTN_IMPLEMENTATION", "sdpa"),
            max_new_tokens=int(os.environ.get("QWEN_MAX_NEW_TOKENS", "512")),
            min_score=float(os.environ.get("QWEN_MIN_SCORE", "0.3")),
        )


class QwenDetector:
    def __init__(self):
        self.cfg = ModelConfig.from_env()
        self.processor = AutoProcessor.from_pretrained(self.cfg.model_id)
        self.model, self.input_device = self._load_model()
        self.model.eval()

    def _load_model(self):
        load_kwargs = {
            "dtype": self._resolve_dtype(self.cfg.torch_dtype),
            "attn_implementation": self.cfg.attn_implementation,
        }

        if self._should_force_single_gpu_load():
            model = Qwen3VLForConditionalGeneration.from_pretrained(
                self.cfg.model_id,
                device_map={"": 0},
                **load_kwargs,
            )
            return model, torch.device("cuda")

        model = Qwen3VLForConditionalGeneration.from_pretrained(
            self.cfg.model_id,
            device_map=self.cfg.device_map,
            **load_kwargs,
        )
        return model, self._resolve_input_device(model)

    def _should_force_single_gpu_load(self):
        return (
            self.cfg.device_map.strip().lower() == "auto"
            and torch.cuda.is_available()
            and torch.cuda.device_count() == 1
        )

    @staticmethod
    def _resolve_input_device(model):
        device = getattr(model, "device", None)
        if device is not None:
            return device
        return torch.device("cuda" if torch.cuda.is_available() else "cpu")

    @staticmethod
    def _resolve_dtype(name):
        mapping = {
            "float16": torch.float16,
            "fp16": torch.float16,
            "bfloat16": torch.bfloat16,
            "bf16": torch.bfloat16,
            "float32": torch.float32,
            "fp32": torch.float32,
        }
        return mapping.get(name.lower(), torch.bfloat16)

    def detect(self, image, labels, threshold=None, prompt_template=None, max_detections=100):
        threshold = self.cfg.min_score if threshold is None else float(threshold)
        allowed_labels = self._build_allowed_label_lookup(labels)
        prompt = self._build_prompt(
            image=image,
            labels=labels,
            threshold=threshold,
            prompt_template=prompt_template,
            max_detections=max_detections,
        )
        output_text = self._generate(image, prompt)
        return self._parse_output(
            output_text,
            image.size,
            allowed_labels,
            threshold,
            max_detections,
        )

    def _build_prompt(self, image, labels, threshold, prompt_template, max_detections):
        width, height = image.size
        system = prompt_template or (
            "Detect the requested categories in the image and return a JSON array only."
        )
        schema = [
            {
                "bbox_2d": [0, 0, 10, 10],
                "label": labels[0] if labels else "person",
                "score": 0.95,
            }
        ]
        return (
            f"{system}\n"
            f"Image size: width={width}, height={height}.\n"
            f"Allowed labels: {json.dumps(labels, ensure_ascii=False)}\n"
            f"Only include objects whose confidence is at least {threshold}.\n"
            f"Return at most {max_detections} detections.\n"
            f"Output JSON array only in this style: {json.dumps(schema, ensure_ascii=False)}\n"
            "Use absolute pixel xyxy coordinates relative to the original image. "
            "Each detection must use exactly one allowed label. "
            "If you would normally use a synonym or plural form, map it to the closest allowed label. "
            "If nothing is found, return []."
        )

    def _generate(self, image, prompt):
        with tempfile.NamedTemporaryFile(suffix=".png") as temp_file:
            image.save(temp_file.name)
            messages = [
                {
                    "role": "user",
                    "content": [
                        {"type": "image", "path": temp_file.name},
                        {"type": "text", "text": prompt},
                    ],
                }
            ]
            inputs = self.processor.apply_chat_template(
                messages,
                add_generation_prompt=True,
                tokenize=True,
                return_dict=True,
                return_tensors="pt",
            ).to(self.input_device)

            generated_ids = self.model.generate(**inputs, max_new_tokens=self.cfg.max_new_tokens)
            trimmed_ids = [
                out_ids[len(in_ids) :] for in_ids, out_ids in zip(inputs.input_ids, generated_ids)
            ]
            decoded = self.processor.batch_decode(
                trimmed_ids,
                skip_special_tokens=True,
                clean_up_tokenization_spaces=False,
            )
        return decoded[0] if decoded else ""

    def _parse_output(self, text, image_size, allowed_labels, min_score, max_detections):
        payload = self._extract_json_payload(text)
        detections = []
        width, height = image_size

        if isinstance(payload, list):
            items = payload
        elif isinstance(payload, dict):
            items = payload.get("detections", [])
            if not items and {"label", "bbox_2d"}.issubset(payload.keys()):
                items = [payload]
            elif not items and {"label", "bbox"}.issubset(payload.keys()):
                items = [payload]
        else:
            items = []

        for item in items:
            normalized = self._normalize_detection(item, width, height, allowed_labels, min_score)
            if normalized is not None:
                detections.append(normalized)
            if len(detections) >= max_detections:
                break
        return detections

    @staticmethod
    def _extract_json_payload(text):
        fenced = re.search(r"```json\s*(\[.*?\]|\{.*?\})\s*```", text, flags=re.S)
        if fenced:
            return QwenDetector._load_json_payload(fenced.group(1))

        starts = [(text.find("["), "[", "]"), (text.find("{"), "{", "}")]
        starts = [(idx, left, right) for idx, left, right in starts if idx != -1]
        if not starts:
            raise ValueError("model output did not contain JSON")

        start, left, right = min(starts, key=lambda item: item[0])
        end = text.rfind(right)
        if end == -1 or end <= start:
            raise ValueError("model output did not contain complete JSON")

        return QwenDetector._load_json_payload(text[start : end + 1])

    @staticmethod
    def _load_json_payload(candidate):
        try:
            return json.loads(candidate)
        except json.JSONDecodeError as exc:
            repaired = QwenDetector._repair_json(candidate)
            if repaired != candidate:
                try:
                    return json.loads(repaired)
                except json.JSONDecodeError:
                    pass

            salvaged = QwenDetector._salvage_detections(candidate)
            if salvaged:
                return salvaged

            raise ValueError(f"invalid model output: {exc}") from exc

    @staticmethod
    def _repair_json(candidate):
        repaired = candidate.strip()
        repaired = repaired.replace("“", '"').replace("”", '"').replace("’", "'")
        repaired = re.sub(r"([\]\}0-9\"])(\s*)(?=\"[^\"]+\"\s*:)", r"\1,\2", repaired)
        repaired = re.sub(r"([\]\}0-9\"])(\s*)(?=\{)", r"\1,\2", repaired)
        repaired = re.sub(r"([\}\]0-9\"])(\s*)(?=\[)", r"\1,\2", repaired)
        repaired = re.sub(r",\s*([\]}])", r"\1", repaired)
        return repaired

    @staticmethod
    def _salvage_detections(candidate):
        items = []
        for block in re.findall(r"\{[^{}]*\}", candidate, flags=re.S):
            label_match = re.search(r'"label"\s*:\s*"([^\"]+)"', block)
            bbox_match = re.search(r'"(?:bbox_2d|bbox|box)"\s*:\s*\[([^\]]+)\]', block)
            if not label_match or not bbox_match:
                continue

            coords = re.findall(r"-?[0-9]+(?:\.[0-9]+)?", bbox_match.group(1))
            if len(coords) < 4:
                continue

            score_match = re.search(
                r'"(?:score|confidence)"\s*:\s*(-?[0-9]+(?:\.[0-9]+)?)', block
            )
            item = {
                "label": label_match.group(1),
                "bbox_2d": [float(value) for value in coords[:4]],
            }
            if score_match:
                item["score"] = float(score_match.group(1))
            items.append(item)

        return items

    @staticmethod
    def _build_allowed_label_lookup(labels):
        return {QwenDetector._normalize_label_name(label): label for label in labels}

    @staticmethod
    def _normalize_label_name(label):
        cleaned = re.sub(r"\s+", " ", str(label).strip().lower())
        cleaned = re.sub(r"^[^\w]+|[^\w]+$", "", cleaned, flags=re.UNICODE)
        if cleaned.startswith("a "):
            cleaned = cleaned[2:]
        elif cleaned.startswith("an "):
            cleaned = cleaned[3:]
        elif cleaned.startswith("the "):
            cleaned = cleaned[4:]
        return cleaned

    @staticmethod
    def _canonicalize_label(label, allowed_labels):
        normalized = QwenDetector._normalize_label_name(label)
        if normalized in allowed_labels:
            return allowed_labels[normalized]

        aliases = {
            "people": "person",
            "persons": "person",
            "human": "person",
            "man": "person",
            "woman": "person",
            "pedestrian": "person",
            "bike": "bicycle",
            "bikes": "bicycle",
            "bicyclist": "bicycle",
            "motorbike": "motorcycle",
            "motorbikes": "motorcycle",
            "motorcyclist": "motorcycle",
            "motorcyclists": "motorcycle",
            "buses": "bus",
            "cars": "car",
            "trucks": "truck",
            "dogs": "dog",
            "cats": "cat",
            "chairs": "chair",
            "seats": "chair",
            "bottles": "bottle",
        }
        alias = aliases.get(normalized)
        if alias and alias in allowed_labels:
            return allowed_labels[alias]

        if normalized.endswith("s") and normalized[:-1] in allowed_labels:
            return allowed_labels[normalized[:-1]]

        return None

    @staticmethod
    def _normalize_detection(item, width, height, allowed_labels, min_score):
        if not isinstance(item, dict):
            return None

        label = QwenDetector._canonicalize_label(item.get("label", ""), allowed_labels)
        if label is None:
            return None

        bbox = item.get("bbox_2d", item.get("bbox", item.get("box")))
        if not isinstance(bbox, list) or len(bbox) != 4:
            return None

        try:
            x1, y1, x2, y2 = [float(v) for v in bbox]
            score = float(item.get("score", item.get("confidence", 1.0)))
        except (TypeError, ValueError):
            return None

        if score < min_score:
            return None

        x1 = max(0.0, min(float(width), x1))
        y1 = max(0.0, min(float(height), y1))
        x2 = max(0.0, min(float(width), x2))
        y2 = max(0.0, min(float(height), y2))
        if x2 <= x1 or y2 <= y1:
            return None

        return {"label": label, "score": score, "bbox": [x1, y1, x2, y2]}


class Detectron2Detector:
    def __init__(self):
        try:
            from detectron2.data.datasets.builtin_meta import COCO_CATEGORIES
            from detectron2.data.detection_utils import convert_PIL_to_numpy
            from detectron2.engine.defaults import DefaultPredictor
            from detectron2.model_zoo import get_config
        except ImportError as exc:
            raise RuntimeError(
                "detectron2 backend requested, but detectron2 is not installed"
            ) from exc

        confidence_threshold = float(os.environ.get("DETECTRON2_SCORE_THRESHOLD", "0.5"))
        config_name = os.environ.get(
            "DETECTRON2_CONFIG", "COCO-Detection/retinanet_R_101_FPN_3x.yaml"
        )
        weights = os.environ.get("DETECTRON2_WEIGHTS")

        cfg = get_config(config_name)
        cfg.MODEL.DEVICE = "cuda" if torch.cuda.is_available() else "cpu"
        cfg.MODEL.RETINANET.SCORE_THRESH_TEST = confidence_threshold
        cfg.MODEL.ROI_HEADS.SCORE_THRESH_TEST = confidence_threshold
        cfg.MODEL.PANOPTIC_FPN.COMBINE.INSTANCES_CONFIDENCE_THRESH = confidence_threshold
        if weights:
            cfg.MODEL.WEIGHTS = weights
        cfg.freeze()

        self._predictor = DefaultPredictor(cfg)
        self._convert_pil_to_numpy = convert_PIL_to_numpy
        self._categories = COCO_CATEGORIES
        self._confidence_threshold = confidence_threshold

    def detect(self, image, labels=None, threshold=None, prompt_template=None, max_detections=100):
        del prompt_template
        min_score = self._confidence_threshold if threshold is None else float(threshold)
        allowed_labels = {str(label).strip() for label in (labels or []) if str(label).strip()}
        predictions = self._predictor(self._convert_pil_to_numpy(image, format="BGR"))

        instances = predictions["instances"]
        detections = []
        for box, score, class_id in zip(
            instances.pred_boxes, instances.scores, instances.pred_classes
        ):
            label = self._categories[int(class_id)]["name"]
            score = float(score)
            if score < min_score:
                continue
            if allowed_labels and label not in allowed_labels:
                continue

            detections.append({"label": label, "score": score, "bbox": box.tolist()})
            if len(detections) >= max_detections:
                break

        return detections


def create_detector():
    backend = os.environ.get("CVAT_DETECTOR_BACKEND", "qwen").strip().lower()
    if backend == "qwen":
        return QwenDetector()
    if backend == "detectron2":
        return Detectron2Detector()

    raise RuntimeError(f"unsupported detector backend: {backend}")
