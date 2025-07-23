"""
ASGI config for cloudgit project.

It exposes the ASGI callable as a module-level variable named ``application``.

For more information on this file, see
https://docs.djangoproject.com/en/5.2/howto/deployment/asgi/
"""
import asyncio
import os
import sys

if sys.platform.startswith('linux'):
    import uvloop
else:
    uvloop = None

from django.core.asgi import get_asgi_application
from channels.routing import ProtocolTypeRouter

if os.getenv('DJANGO_SETTINGS_MODULE', None) is None:
    os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'settings')


async def _loop(scope, receive, send):
    if uvloop:
        loop = uvloop.new_event_loop()
    else:
        loop = asyncio.new_event_loop()

    asyncio.set_event_loop(loop)
    try:
        await get_asgi_application()(scope, receive, send)
    finally:
        loop.close()

application = ProtocolTypeRouter({
    "http": _loop,
})
