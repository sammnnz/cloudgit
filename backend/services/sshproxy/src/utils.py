import os
import re

from asyncssh import SSHServer
from common.ssh import SSHClient
from common.utils import is_simple_stroke
from types import ModuleType

CONF_FIELDS = {
    'host': str,
    'port': int,
    'server_host_keys': list,
    'server_factory': type(SSHServer),
    'client_factory': type(SSHClient),
}

GIT_COMMANDS = (
    'git-receive-pack',
    'git-upload-pack'
)

SERVICES = {
    'auth': os.getenv('REMOTE_SERVER_URL') + '/api/auth',
    'repo': os.getenv('REMOTE_SERVER_URL') + '/api/repo',
}


def get_service_url(name: str) -> str:
    return SERVICES.get(name, None)


def load_conf(conf_module: ModuleType):
    conf = {}
    for key in dir(conf_module):
        if key.startswith("_"):
            continue

        if key in CONF_FIELDS:
            value = getattr(conf_module, key, None)
            if not isinstance(value, CONF_FIELDS[key]):
                continue

            conf[key] = value

    return conf


def parse_command(command: str) -> tuple[str, str]:
    command = command.strip()
    for cmd in GIT_COMMANDS:
        try:
            _, arg = command.split(cmd, maxsplit=1)
            if not is_simple_stroke(_):
                raise RuntimeError(f"Invalid command: {command}")

            arg = arg.strip()
            if arg.startswith("'"):
                arg = arg[1:]
            elif arg.startswith('"'):
                arg = arg[1:]

            if arg.endswith("'"):
                arg = arg[:-1]
            elif arg.endswith('"'):
                arg = arg[:-1]

            substrs = re.compile(r"^/([^\s\\/]*)\.git$").findall(arg)
            if len(substrs) != 1:
                raise RuntimeError(f"Invalid command: {command}")

            return cmd, substrs.pop()
        except ValueError:
            continue

    raise RuntimeError(f"Invalid command: {command}")
