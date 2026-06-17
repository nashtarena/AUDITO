from loguru import logger
import sys

logger.remove()
logger.add(sys.stderr, format="{time} {level} {message}", level="INFO")
logger.add("logs/audito.log", rotation="10 MB", retention="7 days", level="DEBUG")
