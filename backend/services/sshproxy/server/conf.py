import dotenv
import os

if os.getenv("DEBUG"):
    dotenv.load_dotenv("dev/.env")
    dotenv.load_dotenv("../../.env")

from asyncssh import SSHServer
from src.sshproxy import SSHProxyServer, SSHClient
from src.utils import parse_keys
from typing import Type

host: str = os.getenv('SSHPROXY_HOST') or ""
port: int = int(os.getenv('SSHPROXY_PORT') or 33)
server_host_keys: list[str] = [*parse_keys(os.getenv('SSHPROXY_SERVER_HOST_KEYS'))]
server_factory: Type[SSHServer] = SSHProxyServer
client_factory: Type[SSHClient] = SSHClient
