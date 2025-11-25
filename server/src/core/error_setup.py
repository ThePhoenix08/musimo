import pretty_errors
from pathlib import Path

# Root dir of your server (the folder where you run uvicorn main:app)
PROJECT_ROOT = Path(__file__).resolve().parents[1]

def setup_error_beautifier(enable=True):
    if not enable:
        return  # Use default Python tracebacks

    pretty_errors.configure(
        separator_character="─",
        filename_display=pretty_errors.FILENAME_EXTENDED,  # relative to CWD
        line_number_first=True,
        lines_before=2,
        lines_after=2,
        display_link=True,
        code_color='  ' + pretty_errors.YELLOW,
        line_color=pretty_errors.RED + '> ' + pretty_errors.WHITE,
        display_locals=False,
        truncate_code=True,
        truncate_locals=True,
        top_first=False,
        inner_exception_separator=True,
        inner_exception_message = pretty_errors.MAGENTA + "\n During handling of the above exception, another exception occurred:\n"
    )

    # Trim paths to be relative to your server root
    def trim_path(path):
        try:
            return str(Path(path).relative_to(PROJECT_ROOT))
        except Exception:
            return path

    pretty_errors.replace_filename = trim_path
