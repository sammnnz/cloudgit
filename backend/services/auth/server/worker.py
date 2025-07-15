from typing import Any, Dict
from uvicorn.workers import UvicornWorker as BaseUvicornWorker


class UvicornWorker(BaseUvicornWorker):
    # https://stackoverflow.com/questions/64512286/asgi-lifespan-protocol-appears-unsupported
    CONFIG_KWARGS: Dict[str, Any] = {"loop": "auto", "http": "auto", "lifespan": "off"}
