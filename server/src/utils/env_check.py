import os
from typing import Any

from colorama import Fore, Style
from colorama import init as colorama_init

colorama_init(autoreset=True)


def mask_value(value: Any, visible: int = 3) -> str:
    """
    Mask sensitive environment values (from .env), leaving a few visible characters.
    """
    if not isinstance(value, str):
        value = str(value)
    if len(value) <= visible * 2:
        return "*" * len(value)
    return f"{value[:visible]}...{value[-visible:]}"


def print_env_summary(settings_obj):
    """
    Print a color-coded summary of environment values loaded by a Pydantic Settings object.

    ✅ Green  → Loaded from .env / environment variable
    ⚠️ Yellow → Default value used but env key exists
    ❌ Red    → Default value used and no env key found
    """

    print("\n🧩 Environment Summary:")

    for field_name, field_info in settings_obj.model_fields.items():
        value = getattr(settings_obj, field_name)
        env_present = os.getenv(field_name) is not None
        from_env = field_name in settings_obj.__pydantic_fields_set__
        src = "ENV" if from_env else "DEFAULT"

        # Mask secrets for env-loaded values
        display_value = mask_value(value) if from_env else str(value)

        # Determine color/icon
        if from_env:
            icon, color = "✅", Fore.GREEN
        elif env_present:
            icon, color = "⚠️", Fore.YELLOW
        else:
            icon, color = "❌", Fore.RED

        # Always cast to string to avoid NoneType formatting issues
        field_str = str(field_name)
        val_str = str(display_value)

        print(f"{color}{icon} {field_str:<25} = {val_str:<25} ({src}){Style.RESET_ALL}")
