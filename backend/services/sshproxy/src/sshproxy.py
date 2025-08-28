import asyncio
import asyncssh
import logging
import os

from asyncssh import SSHClientConnection
from common.ssh import get_connection_ssh, SSHClient as _SSHClient, ssh_connect
from common.utils import parse_keys
from typing import Optional
from .api import get_storage
from .schemas import StorageInSchema
from .utils import parse_command

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

AUTHORIZED_KEYS = os.getenv('SSHPROXY_AUTHORIZED_KEYS')
CLIENT_KEYS = parse_keys(os.getenv('SSHPROXY_CLIENT_KEYS'))


class SSHClient(_SSHClient):
    def __init__(self, process: asyncssh.SSHServerProcess):
        super().__init__(process)
        self.command = None
        self.reponame = None
        self.username = None

    async def before_handle(self):
        command = self._process.command
        cmd, arg = parse_command(command)
        self.command = cmd
        self.reponame = arg
        self.username = self._process.get_extra_info("username")

    async def set_dest_connection(self):
        storage: StorageInSchema = await get_storage(self.username, self.reponame)
        connection = get_connection_ssh(storage.name)
        if not isinstance(connection, SSHClientConnection):
            await ssh_connect(
                storage.name,
                True,
                host=storage.ssh_host,
                port=storage.ssh_port,
                username=storage.ssh_username,
                client_keys=CLIENT_KEYS,
                encryption_algs='+aes128-cbc,aes256-cbc',
                known_hosts=None
            )

        self._conn = get_connection_ssh(storage.name)
        self.command += " '%s/%s/%s.git'" % (storage.path, self.username, self.reponame)

    async def run(self):
        try:
            await self._conn.run(
                command=self.command,
                stdin=self._process.stdin,
                stdout=self._process.stdout,
                stderr=self._process.stderr,
                encoding=None,
                term_type=None,
                # env=process.env,  # TODO: fix Value error
            )
        except Exception as e:
            logger.warning(e, exc_info=True)
            raise e


class SSHProxyServer(asyncssh.SSHServer):
    def __init__(self):
        self._conn = None

    def connection_made(self, conn: asyncssh.SSHServerConnection):
        self._conn = conn

    def connection_lost(self, exc: Optional[Exception]) -> None:
        if exc is not None:
            logger.warning(exc, exc_info=True)

    async def begin_auth(self, username: str):
        path = os.path.join(AUTHORIZED_KEYS, username)
        try:
            self._conn.set_authorized_keys(path)
        except OSError:
            return False

        return True
