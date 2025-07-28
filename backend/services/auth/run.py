import gunicorn.app.base

from abc import ABC
from server import gunicorn_conf
from types import ModuleType


class StandaloneApplication(gunicorn.app.base.BaseApplication, ABC):
    def __init__(self, options=None):
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
        import server.asgi
        return server.asgi.application


if __name__ == "__main__":
    StandaloneApplication(options=gunicorn_conf).run()
