import unittest

from model import QwenDetector


class QwenDetectorParsingTest(unittest.TestCase):
    def test_extract_json_payload_accepts_list(self):
        payload = QwenDetector._extract_json_payload(
            '```json\n[{"bbox_2d": [1, 2, 3, 4], "label": "person"}]\n```'
        )
        self.assertIsInstance(payload, list)
        self.assertEqual(payload[0]["label"], "person")

    def test_parse_output_accepts_qwen_grounding_style(self):
        detector = object.__new__(QwenDetector)
        allowed = QwenDetector._build_allowed_label_lookup(["person", "dog"])
        text = '[{"bbox_2d": [10, 20, 30, 40], "label": "people"}]'

        detections = detector._parse_output(text, (100, 100), allowed, 0.2, 10)

        self.assertEqual(
            detections,
            [{"label": "person", "score": 1.0, "bbox": [10.0, 20.0, 30.0, 40.0]}],
        )

    def test_parse_output_accepts_legacy_schema(self):
        detector = object.__new__(QwenDetector)
        allowed = QwenDetector._build_allowed_label_lookup(["car"])
        text = '{"detections": [{"bbox": [5, 6, 40, 50], "label": "car", "score": 0.9}]}'

        detections = detector._parse_output(text, (100, 100), allowed, 0.2, 10)

        self.assertEqual(
            detections,
            [{"label": "car", "score": 0.9, "bbox": [5.0, 6.0, 40.0, 50.0]}],
        )

    def test_parse_output_repairs_missing_comma_between_fields(self):
        detector = object.__new__(QwenDetector)
        allowed = QwenDetector._build_allowed_label_lookup(["person"])
        text = (
            '[{"bbox_2d": [10, 20, 30, 40]\n'
            '  "label": "person",\n'
            '  "score": 0.8}]'
        )

        detections = detector._parse_output(text, (100, 100), allowed, 0.2, 10)

        self.assertEqual(
            detections,
            [{"label": "person", "score": 0.8, "bbox": [10.0, 20.0, 30.0, 40.0]}],
        )

    def test_parse_output_salvages_detection_when_json_remains_invalid(self):
        detector = object.__new__(QwenDetector)
        allowed = QwenDetector._build_allowed_label_lookup(["person"])
        text = (
            '[{"bbox_2d": [10, 20, 30, 40]\n'
            '  "label": "person"\n'
            '  "score": 0.8,}]'
        )

        detections = detector._parse_output(text, (100, 100), allowed, 0.2, 10)

        self.assertEqual(
            detections,
            [{"label": "person", "score": 0.8, "bbox": [10.0, 20.0, 30.0, 40.0]}],
        )

    def test_parse_output_keeps_chinese_labels(self):
        detector = object.__new__(QwenDetector)
        allowed = QwenDetector._build_allowed_label_lookup(["厨余垃圾"])
        text = '[{"bbox_2d": [1, 2, 30, 40], "label": "厨余垃圾", "score": 0.9}]'

        detections = detector._parse_output(text, (100, 100), allowed, 0.2, 10)

        self.assertEqual(
            detections,
            [{"label": "厨余垃圾", "score": 0.9, "bbox": [1.0, 2.0, 30.0, 40.0]}],
        )


if __name__ == "__main__":
    unittest.main()