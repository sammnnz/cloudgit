import gunicorn.app.base

from abc import ABC
from server import gunicorn_conf
from types import ModuleType


class StandaloneApplication(gunicorn.app.base.BaseApplication, ABC):
    def __init__(self, app: str, options=None):
        self.app = app if isinstance(app, str) else None
        self.options = options if isinstance(options, ModuleType) else None
        super().__init__()

    def load_config(self):
        if self.options is None:
            return

        for key in dir(self.options):
            if key.startswith("_"):
                continue

            if key in self.cfg.settings and getattr(self.options, key) is not None:
                self.cfg.set(key.lower(), getattr(self.options, key))

    def load(self):
        if self.app is None:
            raise TypeError("ASGI application must be defined.")

        asgi = __import__(self.app, fromlist=['asgi'])
        application = getattr(asgi, "application", None)
        if application is None:
            raise AttributeError("ASGI application must be defined.")

        return application


if __name__ == "__main__":
    StandaloneApplication(app="server.asgi", options=gunicorn_conf).run()
