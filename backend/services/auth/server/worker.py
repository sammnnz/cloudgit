from typing import Any, Dict
from uvicorn_worker import UvicornWorker as _UvicornWorker


class UvicornWorker(_UvicornWorker):
    # https://stackoverflow.com/questions/64512286/asgi-lifespan-protocol-appears-unsupported
    CONFIG_KWARGS: Dict[str, Any] = {"loop": "auto", "http": "auto", "lifespan": "off"}
