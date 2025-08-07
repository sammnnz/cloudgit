from django.conf import settings

SERVICES = getattr(settings, 'SERVICES', None)
STORAGE = getattr(settings, 'STORAGE', None)


def get_storage(name: str = 'default'):
    if not isinstance(name, str):
        name = 'default'

    if STORAGE is None or not isinstance(STORAGE, dict):
        raise TypeError("'STORAGE' dict must be set in settings.py.")

    obj = STORAGE.get(name, None)
    if obj is None:
        raise TypeError("'STORAGE' object has no key '%s'" % name)

    return obj


def get_service_url(name: str) -> str:
    if SERVICES is None or not isinstance(SERVICES, dict):
        raise Exception("'SERVICES' dict must be set in settings.py.")

    url = SERVICES.get(name, None)
    if url is None:
        raise TypeError("'SERVICES' object has no key '%s'" % name)

    return url
