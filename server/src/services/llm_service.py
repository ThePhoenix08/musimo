import logging
import json

from google import genai
from google.genai import types

from src.core.settings import CONSTANTS

from typing import Final, Literal
summaryType = Literal["emotion", "instrument", "features"]

logger = logging.getLogger(__name__)


EMOTION_PROMPT: Final[str] = """
You are an expert music emotion analyst.

Analyze GEMS-9 emotion data and generate a concise, human-readable emotional interpretation of the track.

Write like a thoughtful music critic: emotionally intelligent, musically aware, slightly artistic, but grounded in the data.

Style:
- concise and UI-friendly
- subtle rather than dramatic
- emotionally intelligent
- natural, not robotic

Guidelines:
- interpret emotional balance, coexistence, contrast, and progression naturally
- use both static and dynamic emotion data
- describe consistency when emotions remain stable
- avoid exaggerated storytelling or poetic metaphors
- never restate raw scores mechanically
- never mention AI, models, predictions, or confidence
- never output markdown
- return valid JSON only

Emotion tags:
- modern, aesthetic, emotionally descriptive
- avoid generic adjectives
Examples:
"ethereal", "floating warmth", "midnight nostalgia", "weightless", "soul-soothing"

GEMS-9 labels:
Wonder, Transcendence, Tenderness, Nostalgia, Peacefulness, Power, Joyful Activation, Tension, Sadness

Additional guidance:
- generate 5-10 emotion_tags
- generate 3-6 segment_comments using meaningful timestamp ranges
- identify emotional highlights and transitions
- keep creative interpretations grounded in the emotional profile
- mention calmness/stability when Peacefulness dominates and Tension is low
- mention bittersweetness when Nostalgia and Sadness coexist
- mention subtle uplift when Joyful Activation rises
- keep intensity values in the original 0.0-1.0 scale
"""


EMOTION_SCHEMA: Final[types.Schema] = genai.types.Schema(
    type=genai.types.Type.OBJECT,
    required=[
        "overall_summary",
        "emotion_tags",
        "emotion_palette",
        "segment_comments",
        "emotional_highlights",
        "atmosphere",
        "mix_feedback",
    ],
    properties={
        "overall_summary": genai.types.Schema(
            type=genai.types.Type.OBJECT,
            required=[
                "title",
                "summary",
                "dominant_emotions",
                "emotional_arc",
                "listener_impression",
            ],
            properties={
                "title": genai.types.Schema(
                    type=genai.types.Type.STRING,
                ),
                "summary": genai.types.Schema(
                    type=genai.types.Type.STRING,
                ),
                "dominant_emotions": genai.types.Schema(
                    type=genai.types.Type.ARRAY,
                    items=genai.types.Schema(
                        type=genai.types.Type.OBJECT,
                        required=["emotion", "intensity", "comment"],
                        properties={
                            "emotion": genai.types.Schema(
                                type=genai.types.Type.STRING,
                            ),
                            "intensity": genai.types.Schema(
                                type=genai.types.Type.NUMBER,
                            ),
                            "comment": genai.types.Schema(
                                type=genai.types.Type.STRING,
                            ),
                        },
                    ),
                ),
                "emotional_arc": genai.types.Schema(
                    type=genai.types.Type.STRING,
                ),
                "listener_impression": genai.types.Schema(
                    type=genai.types.Type.STRING,
                ),
            },
        ),
        "emotion_tags": genai.types.Schema(
            type=genai.types.Type.ARRAY,
            items=genai.types.Schema(
                type=genai.types.Type.STRING,
            ),
        ),
        "emotion_palette": genai.types.Schema(
            type=genai.types.Type.OBJECT,
            required=[
                "primary_mood",
                "secondary_moods",
                "energy_profile",
                "emotional_complexity",
            ],
            properties={
                "primary_mood": genai.types.Schema(
                    type=genai.types.Type.STRING,
                ),
                "secondary_moods": genai.types.Schema(
                    type=genai.types.Type.ARRAY,
                    items=genai.types.Schema(
                        type=genai.types.Type.STRING,
                    ),
                ),
                "energy_profile": genai.types.Schema(
                    type=genai.types.Type.STRING,
                    enum=["low", "medium", "high", "dynamic"],
                ),
                "emotional_complexity": genai.types.Schema(
                    type=genai.types.Type.STRING,
                    enum=["simple", "layered", "evolving", "highly dynamic"],
                ),
            },
        ),
        "segment_comments": genai.types.Schema(
            type=genai.types.Type.ARRAY,
            items=genai.types.Schema(
                type=genai.types.Type.OBJECT,
                required=["start_time", "end_time", "title", "message"],
                properties={
                    "start_time": genai.types.Schema(
                        type=genai.types.Type.NUMBER,
                    ),
                    "end_time": genai.types.Schema(
                        type=genai.types.Type.NUMBER,
                    ),
                    "title": genai.types.Schema(
                        type=genai.types.Type.STRING,
                    ),
                    "message": genai.types.Schema(
                        type=genai.types.Type.STRING,
                    ),
                },
            ),
        ),
        "emotional_highlights": genai.types.Schema(
            type=genai.types.Type.ARRAY,
            items=genai.types.Schema(
                type=genai.types.Type.OBJECT,
                required=["title", "timestamp", "description"],
                properties={
                    "title": genai.types.Schema(
                        type=genai.types.Type.STRING,
                    ),
                    "timestamp": genai.types.Schema(
                        type=genai.types.Type.NUMBER,
                    ),
                    "description": genai.types.Schema(
                        type=genai.types.Type.STRING,
                    ),
                },
            ),
        ),
        "atmosphere": genai.types.Schema(
            type=genai.types.Type.OBJECT,
            required=[
                "scene",
                "time_of_day",
                "weather_feel",
            ],
            properties={
                "scene": genai.types.Schema(
                    type=genai.types.Type.STRING,
                ),
                "time_of_day": genai.types.Schema(
                    type=genai.types.Type.STRING,
                ),
                "weather_feel": genai.types.Schema(
                    type=genai.types.Type.STRING,
                ),
            },
        ),
        "mix_feedback": genai.types.Schema(
            type=genai.types.Type.OBJECT,
            required=["emotional_consistency", "dynamic_feel", "memorability"],
            properties={
                "emotional_consistency": genai.types.Schema(
                    type=genai.types.Type.STRING,
                ),
                "dynamic_feel": genai.types.Schema(
                    type=genai.types.Type.STRING,
                ),
                "memorability": genai.types.Schema(
                    type=genai.types.Type.STRING,
                ),
            },
        ),
    }
)

INSTRUMENT_PROMPT: Final[str] = """
You are an expert music producer and instrumentalist analyst.

Analyze instrument detection data and generate a concise, human-readable interpretation of the track's instrumental composition.

Write like a thoughtful music producer: technically aware, musically articulate, slightly evocative, but grounded in the data.

Style:
- concise and UI-friendly
- musically intelligent, not robotic
- producer-minded — mention texture, role, blend, and arrangement instincts
- never mention AI, models, predictions, confidence scores, or thresholds
- never output markdown
- return valid JSON only

Instrument tags:
- modern, descriptive, arrangement-focused
- avoid generic adjectives like "nice" or "good"
Examples:
"brass-forward", "rhythm-driven", "wind ensemble", "solo spotlight", "dense harmonic texture", "sparse and airy"

Guidelines:
- interpret the instrument combination as an arrangement choice
- describe what role each confirmed instrument likely plays (lead, harmony, rhythm, texture)
- comment on how the instruments complement or contrast each other
- identify the sonic character of the ensemble (e.g. jazz combo, orchestral section, indie band)
- note any surprising or interesting instrument combinations
- generate 5-8 instrument_tags describing the overall sonic character
- generate 3-5 arrangement_notes: specific musical observations about the detected combination
- describe the likely genre or context this instrument combination suggests
- keep intensity/confidence values in original 0.0–1.0 scale
"""

INSTRUMENT_SCHEMA: Final[types.Schema] = genai.types.Schema(
    type=genai.types.Type.OBJECT,
    required=[
        "overall_summary",
        "instrument_tags",
        "sonic_palette",
        "arrangement_notes",
        "instrument_roles",
        "mix_feedback",
        "listener_impression",
    ],
    properties={
        "overall_summary": genai.types.Schema(
            type=genai.types.Type.OBJECT,
            required=["title", "summary", "ensemble_character", "genre_context"],
            properties={
                "title": genai.types.Schema(type=genai.types.Type.STRING),
                "summary": genai.types.Schema(type=genai.types.Type.STRING),
                "ensemble_character": genai.types.Schema(type=genai.types.Type.STRING),
                "genre_context": genai.types.Schema(type=genai.types.Type.STRING),
            },
        ),
        "instrument_tags": genai.types.Schema(
            type=genai.types.Type.ARRAY,
            items=genai.types.Schema(type=genai.types.Type.STRING),
        ),
        "sonic_palette": genai.types.Schema(
            type=genai.types.Type.OBJECT,
            required=["primary_texture", "secondary_textures", "energy_profile", "arrangement_complexity"],
            properties={
                "primary_texture": genai.types.Schema(type=genai.types.Type.STRING),
                "secondary_textures": genai.types.Schema(
                    type=genai.types.Type.ARRAY,
                    items=genai.types.Schema(type=genai.types.Type.STRING),
                ),
                "energy_profile": genai.types.Schema(
                    type=genai.types.Type.STRING,
                    enum=["low", "medium", "high", "dynamic"],
                ),
                "arrangement_complexity": genai.types.Schema(
                    type=genai.types.Type.STRING,
                    enum=["sparse", "moderate", "layered", "dense"],
                ),
            },
        ),
        "arrangement_notes": genai.types.Schema(
            type=genai.types.Type.ARRAY,
            items=genai.types.Schema(
                type=genai.types.Type.OBJECT,
                required=["title", "message"],
                properties={
                    "title": genai.types.Schema(type=genai.types.Type.STRING),
                    "message": genai.types.Schema(type=genai.types.Type.STRING),
                },
            ),
        ),
        "instrument_roles": genai.types.Schema(
            type=genai.types.Type.ARRAY,
            items=genai.types.Schema(
                type=genai.types.Type.OBJECT,
                required=["instrument", "role", "confidence", "comment"],
                properties={
                    "instrument": genai.types.Schema(type=genai.types.Type.STRING),
                    "role": genai.types.Schema(
                        type=genai.types.Type.STRING,
                        enum=["lead", "harmony", "rhythm", "texture", "bass", "accent"],
                    ),
                    "confidence": genai.types.Schema(type=genai.types.Type.NUMBER),
                    "comment": genai.types.Schema(type=genai.types.Type.STRING),
                },
            ),
        ),
        "mix_feedback": genai.types.Schema(
            type=genai.types.Type.OBJECT,
            required=["tonal_balance", "arrangement_suggestion", "sonic_strength"],
            properties={
                "tonal_balance": genai.types.Schema(type=genai.types.Type.STRING),
                "arrangement_suggestion": genai.types.Schema(type=genai.types.Type.STRING),
                "sonic_strength": genai.types.Schema(type=genai.types.Type.STRING),
            },
        ),
        "listener_impression": genai.types.Schema(type=genai.types.Type.STRING),
    },
)

class LLMSummaryService:


    SAFETY_SETTINGS: Final[list[types.SafetySetting]] = [
        types.SafetySetting(
            category="HARM_CATEGORY_HARASSMENT",
            threshold="BLOCK_LOW_AND_ABOVE",  # Block most
        ),
        types.SafetySetting(
            category="HARM_CATEGORY_HATE_SPEECH",
            threshold="BLOCK_LOW_AND_ABOVE",  # Block most
        ),
        types.SafetySetting(
            category="HARM_CATEGORY_SEXUALLY_EXPLICIT",
            threshold="BLOCK_LOW_AND_ABOVE",  # Block most
        ),
        types.SafetySetting(
            category="HARM_CATEGORY_DANGEROUS_CONTENT",
            threshold="BLOCK_LOW_AND_ABOVE",  # Block most
        ),
    ]

    def __init__(
        self,
        api_key: str | None = CONSTANTS.LLM_SUMMARY_GEMINI_API_KEY.get_secret_value(),
        model: str | None = "gemini-3-flash-preview"
    ):
        self.api_key = api_key
        if not self.api_key:
            raise ValueError("GEMINI API KEY not found")
        
        self.model = model
        self.client = genai.Client(api_key=self.api_key)

        self.prompts: Final[dict[summaryType, str]] = {
            "emotion": EMOTION_PROMPT,
            "instrument": INSTRUMENT_PROMPT,
            # "features": FEATURES_PROMPT
        }

        self.schemas: Final[dict[summaryType, types.Schema]] = {
            "emotion": EMOTION_SCHEMA,
            "instrument": INSTRUMENT_SCHEMA,
            # "features": FEATURES_SCHEMA
        }


    def generate(
        self,
        summary_type: summaryType,
        data: str,
        thinking_level: Literal["MINIMAL", "LOW", "MEDIUM", "HIGH"] = "LOW"
    ):
        if summary_type not in self.prompts:
            raise ValueError(f"Unsupported summary type: {summary_type}")
        
        prompt = self.prompts[summary_type]
        schema = self.schemas[summary_type]

        contents = [
            types.Content(
                role="user",
                parts=[
                    types.Part.from_text(
                        text=f"{prompt}\n\nDATA:\n{data}"
                    ),
                ],
            ),
        ]

        config = types.GenerateContentConfig(
            thinking_config=types.ThinkingConfig(
                thinking_level=thinking_level,
            ),
            safety_settings=self.SAFETY_SETTINGS,
            tools=[],
            response_mime_type="application/json",
            response_schema=schema,
        )

        try:
            response = self.client.models.generate_content(
                model=self.model,
                contents=contents,
                config=config,
            )

            logger.debug(
                "LLM Summary (%s) response:\n%s",
                summary_type,
                response.text,
            )

            return json.loads(response.text)

        except Exception as e:
            logger.exception(
                "Failed generating LLM summary (%s)\nError: (%s)",
                summary_type,
                str(e)
            )
            raise

