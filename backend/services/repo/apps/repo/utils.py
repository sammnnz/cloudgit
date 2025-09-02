from django.conf import settings

SERVICES = getattr(settings, 'SERVICES', None)


def get_service_url(name: str) -> str:
    if SERVICES is None or not isinstance(SERVICES, dict):
        raise Exception("'SERVICES' dict must be set in settings.py.")

    url = SERVICES.get(name, None)
    if url is None:
        raise TypeError("'SERVICES' object has no key '%s'" % name)

    return url
