import os

from multiprocessing import cpu_count


def _max_workers():
    if os.getenv('DJANGO_DEBUG', True):
        return min(cpu_count(), 2)

    return cpu_count()


accesslog = "-"
bind = str(os.getenv('GUNICORN_HOST') or '127.0.0.1') + ':' + str(os.getenv('GUNICORN_PORT') or 8001)
max_requests = 5000
reload = os.getenv('DJANGO_DEBUG', True)
worker_class = 'server.worker.UvicornWorker'
workers = _max_workers()

# NOTE: more information in https://docs.gunicorn.org/en/latest/settings.html
