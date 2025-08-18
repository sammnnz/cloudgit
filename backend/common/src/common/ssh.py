import asyncio
import asyncssh
import logging
import re

from asyncssh.connection import SSHClientConnection
from common.utils import CancelRepeat, repeat, is_simple_stroke
from types import NoneType
from typing import Optional

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
    ssh = _get_connection_ssh(name)
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


@repeat(break_on_success=False, count=-1, logs=True, timeout=10)
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
        logger.warning(e, exc_info=True)
        _set_connection_lock(name, False)


def ssh_connect(name: str, fail_on_error: bool = False, **kwargs):
    if not isinstance(name, str):
        if fail_on_error:
            raise TypeError("'ssh_connect' expects string name.")

        logger.warning(f"'ssh_connect' expects string name.")
        return

    if _get_connection_ssh(name) is not None:
        if fail_on_error:
            raise TypeError(f"SSH connection '{name}' already initialized.")

        logger.warning(f"SSH connection '{name}' already initialized.")
        return

    connections[name] = {}
    try:
        loop = asyncio.get_running_loop()
        loop.create_task(_ssh_connect(name, **kwargs))
    except RuntimeError:
        logger.warning(f"Problem with SSH connecting '{name}'. Event Loop doesn't exists.")


async def ssh_exec(name: str,
                   commands: list[str],
                   fail_on_bash_error: bool = True,
                   logs: bool = True,
                   *args, **kwargs) -> list[str]:
    """
    Raises:
        RuntimeError: if command fails or connection is lost.
    """
    ssh = _get_connection_ssh(name)
    if ssh is None:
        raise RuntimeError(f"SSH connection '{name}' is failed ...")

    separator = getattr(_get_connection_ssh(name), '_username', None)
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


def _get_connection_ssh(name: str) -> Optional[SSHClientConnection]:
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


async def _main(name, **kwargs):
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
    asyncio.run(_main(storage_name, **params))
