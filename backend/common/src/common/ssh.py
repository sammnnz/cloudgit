import asyncio
import asyncssh
import logging
import re

from asyncssh.connection import SSHClientConnection
from typing import Union
from .utils import repeat

data: dict[str, Union[None, bool, SSHClientConnection]] = {'lock': False, 'ssh': None}
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


def check_connection():
    ssh = data['ssh']
    if not isinstance(ssh, asyncssh.SSHClientConnection):
        return False

    return not ssh.is_closed()


def get_ssh_connection():
    global data
    return data.get('ssh')


def ssh_close():
    if not data.get('lock'):
        return

    ssh = get_ssh_connection()
    if isinstance(ssh, SSHClientConnection):
        ssh.close()
        _set_ssh_lock(False)


@repeat(break_on_success=False, count=-1, logs=True, timeout=10)
async def _ssh_connect(**kwargs):
    global data
    if data['lock']:
        if not check_connection():
            data['lock'] = False

        return

    data['lock'] = True
    try:
        data['ssh'] = await asyncssh.connect(**kwargs)
        logger.info(await ssh_exec([""]))
    except Exception as e:
        logger.warning(e, exc_info=True)
        data['lock'] = False


def ssh_connect(**kwargs):
    try:
        loop = asyncio.get_running_loop()
        loop.create_task(_ssh_connect(**kwargs))
    except RuntimeError:
        logger.warning("Problem with connecting to RabbitMQ. Event Loop doesn't exists.")


def _set_ssh_lock(value: bool):
    global data
    try:
        data['lock'] = value
    except (IndexError, KeyError):
        return


async def ssh_exec(commands: list[str], *args, **kwargs):
    ssh = get_ssh_connection()
    if ssh is None:
        raise RuntimeError('ssh connection is failed ...')

    stdin, stdout, stderr = await ssh.open_session(
        term_type="dumb", term_size=(200, 24), *args, **kwargs
    )
    output = ''
    for cmd in commands:
        stdin.write(f"{cmd}\n")
        output += await ssh_read(stdout)
    # status = stdout.get_exit_status()
    # print(status)
    return output


def ssh_parse_output(output: str, commands: list[str], logs: bool = True):
    separator = getattr(get_ssh_connection(), '_username', None)
    if separator is None:
        return output

    cmds, log_info, res = commands.copy(), [], []
    cmds.reverse()
    for cmd in cmds:
        substr = re.compile(rf"[^\n]*{separator}@.*:.*{cmd}.*").findall(output).pop()
        temp = output.split(substr)
        res.append(temp.pop())
        output = ''.join(temp)
        if logs:
            log_info.append(substr + res[-1])

    if logs:
        log_info.reverse()
        for _ in log_info:
            logger.info(_)

    del log_info
    res.reverse()
    return res


async def ssh_read(stream: asyncssh.SSHReader, timeout: float = 0.1) -> str:
    ret = ''
    while True:
        try:
            ret += await asyncio.wait_for(stream.readline(), timeout=timeout)
        except (OSError, asyncio.TimeoutError, asyncio.CancelledError):
            return ret


@repeat(break_on_success=False, count=5, logs=True, timeout=10)
async def _test_ssh_exec(commands: list[str]):
    output = await ssh_exec(commands)
    for out in ssh_parse_output(output, commands):
        logger.info(out)


async def _main():
    params = {
        "host": '127.0.0.1',
        "port": 2222,
        "username": 'cloudgit_admin',
        # "password": '1234567890',
        'client_keys': ['~/.ssh/cloudgit_storage_1'],
        "encryption_algs": '+aes128-cbc,aes256-cbc'
    }
    command_1 = "cd /"
    command_2 = "ls"
    try:
        await asyncio.wait_for(_ssh_connect(**params), timeout=5)
    except asyncio.TimeoutError:
        pass

    await asyncio.create_task(_test_ssh_exec([command_1, command_2]))

if __name__ == '__main__':
    asyncio.run(_main())
