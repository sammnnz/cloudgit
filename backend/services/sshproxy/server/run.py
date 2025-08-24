import asyncio
import logging
import sys

if sys.platform.startswith('linux'):
    import uvloop
else:
    uvloop = None

import conf as _conf

from common.ssh import ssh_proxy_server_start
from src.utils import load_conf

conf = load_conf(_conf)
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

if uvloop:
    loop = uvloop.new_event_loop()
else:
    loop = asyncio.new_event_loop()

asyncio.set_event_loop(loop)
loop.create_task(ssh_proxy_server_start(**conf))
try:
    loop.run_forever()
except KeyboardInterrupt:
    logger.info('Closing SSH Proxy Server.')
