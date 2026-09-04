import sys
import logging

class CustomFormatter(logging.Formatter):
    """
    Custom log formatter for clear console output in MediAssist backend services.
    Format: [TIMESTAMP] [LOGGER_NAME] [LEVEL] Message
    """
    def format(self, record: logging.LogRecord) -> str:
        timestamp = self.formatTime(record, "%Y-%m-%d %H:%M:%S")
        logger_name = record.name.replace("mediassist.", "").upper()
        level_name = record.levelname
        msg = record.getMessage()

        if record.exc_info:
            if not record.exc_text:
                record.exc_text = self.formatException(record.exc_info)
        if record.exc_text:
            if not msg.endswith('\n'):
                msg = msg + '\n'
            msg = msg + record.exc_text

        return f"[{timestamp}] [{logger_name}] [{level_name}] {msg}"

def setup_logging(level: str = "INFO"):
    """
    Sets up the global logging configuration for MediAssist 2.0 backend.
    Ensures clear stdout logging for uvicorn and all service modules.
    """
    numeric_level = getattr(logging, level.upper(), logging.INFO)

    root_logger = logging.getLogger()
    root_logger.setLevel(numeric_level)

    # Remove existing handlers to avoid duplicate log outputs
    for handler in root_logger.handlers[:]:
        root_logger.removeHandler(handler)

    console_handler = logging.StreamHandler(sys.stdout)
    console_handler.setLevel(numeric_level)
    console_handler.setFormatter(CustomFormatter())

    root_logger.addHandler(console_handler)

    # Enable detailed logging for mediassist app loggers
    mediassist_logger = logging.getLogger("mediassist")
    mediassist_logger.setLevel(numeric_level)

def get_logger(service_name: str) -> logging.Logger:
    """
    Helper function to retrieve a named logger for a specific service or feature.
    """
    name = f"mediassist.{service_name}"
    return logging.getLogger(name)
