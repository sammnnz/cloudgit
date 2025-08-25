import asyncio
import functools

import asyncssh
import logging
import re

from asyncssh import SSHServer
from asyncssh.connection import SSHClientConnection
from common.utils import CancelRepeat, repeat, is_simple_stroke
from types import NoneType
from typing import Optional, Type, Awaitable

connections: dict[str, dict] = {}
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


def check_connection(name: str) -> bool:
    global connections
    connection = connections.get(name, None)
    if not isinstance(connection, dict):
        return False

    ssh = connection.get('ssh', None)
    if not isinstance(ssh, SSHClientConnection):
        return False

    return not ssh.is_closed()


def _ssh_close(name: str):
    ssh = get_connection_ssh(name)
    if isinstance(ssh, SSHClientConnection):
        ssh.close()
        logger.info(f"Success closing ssh connection '{name}'.")
    else:
        logger.warning(f"SSH connection not closing, because connection object '{ssh}' has no 'SSHClientConnection' "
                       f"type.")


def ssh_close(name: str):
    global connections
    connection = connections.get(name, None)
    if connection is None:
        raise TypeError(f"SSH connection '{name}' not found.")

    _set_connection_cancel(name, True)
    _ssh_close(name)


async def _ssh_connect(name: str, **kwargs):
    global connections
    if _get_connection_cancel(name):
        try:
            raise CancelRepeat
        finally:
            _set_connection_cancel(name, False)
            _set_connection_lock(name, False)
            _set_connection_ssh(name, None)
            logger.info(f"Cancelling '_ssh_connect' for '{name}'.")

    if _get_connection_lock(name):
        if not check_connection(name):
            _set_connection_lock(name, False)

        return

    _set_connection_lock(name, True)
    try:
        connection = await asyncssh.connect(**kwargs)
        _set_connection_ssh(name, connection)
        await ssh_exec(name, ["echo Connect"], logs=True)
    except Exception as e:
        _set_connection_lock(name, False)
        raise e


def _ssh_connect_callback(*args, name: str, task: asyncio.Task, fail_on_error: bool, exceptions: tuple, **kwargs):
    exc = task.exception()
    if fail_on_error and not isinstance(exc, exceptions):
        return

    repeater = repeat(
        break_on_success=False,
        fail_on_error=fail_on_error,
        exceptions=exceptions,
        count=-1,
        logs=True,
        timeout=10)(_ssh_connect)(name, **kwargs)
    asyncio.create_task(repeater)


def ssh_connect(name: str, fail_on_error: bool = False, **kwargs):
    if not isinstance(name, str):
        if fail_on_error:
            raise TypeError("'ssh_connect' expects string name.")

        logger.warning(f"'ssh_connect' expects string name.")
        return

    if get_connection_ssh(name) is not None:
        if fail_on_error:
            raise TypeError(f"SSH connection '{name}' already initialized.")

        logger.warning(f"SSH connection '{name}' already initialized.")
        return

    try:
        loop = asyncio.get_running_loop()
    except RuntimeError:
        logger.warning(f"Problem with SSH connecting '{name}'. Event Loop doesn't exists.")
    else:
        connections[name] = {}
        task = loop.create_task(_ssh_connect(name, **kwargs))
        task.add_done_callback(functools.partial(_ssh_connect_callback,
                                                 name=name,
                                                 task=task,
                                                 fail_on_error=fail_on_error,
                                                 exceptions=(asyncssh.Error, ), **kwargs))
        return task


async def ssh_exec(name: str,
                   commands: list[str],
                   fail_on_bash_error: bool = True,
                   logs: bool = True,
                   *args, **kwargs) -> list[str]:
    """
    Raises:
        RuntimeError: if command fails or connection is lost.
    """
    ssh = get_connection_ssh(name)
    if ssh is None:
        raise RuntimeError(f"SSH connection '{name}' is failed ...")

    separator = getattr(get_connection_ssh(name), '_username', None)
    if separator is None:
        raise RuntimeError(f"SSH connection '{name}' has no '_username' attribute.")

    output, result = "", []
    try:
        stdin, stdout, stderr = await ssh.open_session(
            term_type="dumb", term_size=(200, 24), *args, **kwargs
        )
        for cmd in commands:
            ok = "\nok"  # TODO: make unique for every iteration
            _cmd = cmd
            if not is_simple_stroke(cmd):
                _cmd += " && echo " + ok[1:]

            stdin.write(f"{_cmd}\n")
            output, _ = _ssh_parse_output(output=await ssh_read(stdout), cmd=_cmd, separator=separator, ok=ok)
            try:
                if not output.endswith(ok):
                    if fail_on_bash_error:
                        raise RuntimeError(f"SSH command '{cmd}' failed. Unexpected output: \n{output}\n")

                    result.append(output)
                    return result

                output = output.removesuffix(ok)
                result.append(output)
            finally:
                if logs:
                    logger.info("\n" + _.replace(_cmd, cmd) + output)
    finally:
        try:
            stdin.close()
        except Exception as e:
            logger.warning(e, exc_info=True)

    return result


async def ssh_read(stream: asyncssh.SSHReader, timeout: float = 0.1) -> str:
    ret = ""
    while True:
        try:
            ret += await asyncio.wait_for(stream.readline(), timeout=timeout)
        except (OSError, asyncio.TimeoutError, asyncio.CancelledError):
            return ret


def _get_connection_cancel(name: str) -> bool:
    global connections
    connection = connections.get(name, {})
    return connection.get('cancel', False)


def _get_connection_lock(name: str) -> bool:
    global connections
    connection = connections.get(name, {})
    return connection.get('lock', False)


def get_connection_ssh(name: str) -> Optional[SSHClientConnection]:
    global connections
    connection = connections.get(name, {})
    return connection.get('ssh', None)


def _set_connection_cancel(name: str, value: bool):
    global connections
    connection = connections.get(name, None)
    if not isinstance(connection, dict):
        return

    if isinstance(value, bool):
        connection['cancel'] = value


def _set_connection_lock(name: str, value: bool):
    global connections
    connection = connections.get(name, None)
    if not isinstance(connection, dict):
        return

    if isinstance(value, bool):
        connection['lock'] = value


def _set_connection_ssh(name: str, value: Optional[SSHClientConnection]):
    global connections
    connection = connections.get(name, None)
    if not isinstance(connection, dict):
        return

    if isinstance(value, (NoneType, SSHClientConnection)):
        connection['ssh'] = value


def _ssh_parse_output(output: str, cmd: str, separator: str, ok: str = "\nok") -> tuple[str, str]:
    special_symbols = ("$", "\\", "|", "[", "]")
    for symbol in special_symbols:
        if symbol in cmd:
            cmd = cmd.replace(symbol, "\\" + symbol)
    substrs = re.compile(rf"[^\n]*{separator}@.*:.*{cmd}.*").findall(output)
    if not len(substrs):
        if not output.endswith(ok):
            output += ok

        return output.rstrip(), ""

    first_line = substrs.pop()
    output_lines = output.split(first_line).pop()
    if is_simple_stroke(output_lines):
        output_lines += ok

    return output_lines.rstrip(), first_line


class SSHClient:
    def __init__(self, process: asyncssh.SSHServerProcess):
        self._conn: Optional[SSHClientConnection] = None
        self._process: asyncssh.SSHServerProcess = process

    async def after_handle(self):
        raise NotImplementedError("'after_handle' not implemented.")

    async def before_handle(self):
        raise NotImplementedError("'before_handle' not implemented.")

    async def set_dest_connection(self, *args, **kwargs) -> Awaitable[SSHClientConnection]:
        raise NotImplementedError("'set_dest_connection' must be implemented.")

    @classmethod
    async def handle_client(cls, process: asyncssh.SSHServerProcess):
        self = cls(process)
        try:
            await self.before_handle()
        except NotImplementedError:
            pass

        await self.set_dest_connection()
        await self.run()
        try:
            await self.after_handle()
        except NotImplementedError:
            pass

        process.exit(0)

    async def run(self) -> None:
        try:
            await self._conn.run(
                command=self._process.command,
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


async def ssh_proxy_server_start(host: str, port: int,
                                 server_host_keys: list[str],
                                 server_factory: Type[SSHServer],
                                 client_factory: Type[SSHClient], **kwargs):
    await asyncssh.create_server(server_factory, host, port,
                                 server_host_keys=server_host_keys,
                                 line_editor=False,
                                 process_factory=client_factory.handle_client,
                                 encoding=None, **kwargs)
    logger.info("SSH Proxy Server Started.")


async def _test_connect_and_exec(name, **kwargs):
    commands_valid = ["cd /", "ls"]
    commands_invalid = ["cd s\\s\\s", "ls"]
    while True:
        if check_connection(name):
            await ssh_exec(name, commands_valid, logs=True)
            await ssh_exec(name, commands_invalid, fail_on_bash_error=False, logs=True)
            ssh_close(name)
            break
        else:
            ssh_connect(name, **kwargs)

        await asyncio.sleep(1)

    while True:
        await asyncio.sleep(1)
        if check_connection(name):
            continue

        break


async def _test_ssh_server():
    pass

if __name__ == '__main__':
    import os
    from dotenv import load_dotenv

    load_dotenv("../../.env")
    storage_name = os.getenv("STORAGE_NAME")
    params = {
        "host": os.getenv("STORAGE_HOST"),
        "port": os.getenv("STORAGE_PORT"),
        "username": os.getenv("STORAGE_USERNAME"),
        'client_keys': [os.getenv("STORAGE_CLIENT_KEY")],
        "encryption_algs": '+aes128-cbc,aes256-cbc',
        "known_hosts": None
    }
    asyncio.run(_test_connect_and_exec(storage_name, **params))
