""" Python utils for the backend. """
import asyncio
import functools
import logging

from collections.abc import Callable
from inspect import CO_ASYNC_GENERATOR, CO_COROUTINE, CO_GENERATOR
from json import dumps, loads
from pathlib import Path
from types import FunctionType, MethodType, NoneType
from typing import Any, Coroutine, Optional

__all__ = [
    "bytes_to_json",
    "CancelRepeat",
    "check_path",
    "is_async",
    "is_async_generator",
    "is_generator",
    "is_simple_stroke",
    "json_to_bytes",
    "lock",
    "record",
    "repeat",
    "parse_keys",
    "ProxyField",
    "singleton"
]


logging.basicConfig(level=logging.INFO)

LOGGER = logging.getLogger(__name__)


# noinspection PyPep8Naming
class lock:
    __slots__ = ('max_count',)

    def __init__(self, max_count=1):
        self.max_count = max_count

    def __call__(self, fn):
        if not isinstance(fn, (FunctionType, MethodType)):
            raise TypeError(f"'{fn}' must be function or method.")

        count = [0]

        @functools.wraps(fn)
        async def wrapper(*args, **kwargs):
            nonlocal count
            if count[0] >= self.max_count:
                return

            count[0] += 1
            try:
                return await fn(*args, **kwargs)
            except Exception:
                raise
            finally:
                count[0] -= 1

        return wrapper


class CancelRepeat(Exception):
    pass


# noinspection PyPep8Naming
class repeat:
    __slots__ = ('break_on_success', 'count', 'exceptions', 'fail_on_error', 'logs', 'timeout')

    def __init__(self,
                 break_on_success: bool = False,
                 count: int = 1,
                 exceptions: tuple = (Exception,),
                 fail_on_error: bool = False,
                 logs: bool = False,
                 timeout: float = 10.0):
        self.break_on_success = break_on_success
        self.count = count + 1 if count >= 0 else -1
        self.exceptions = exceptions
        self.fail_on_error = fail_on_error
        self.logs = logs
        self.timeout = timeout

    def __call__(self, fn):
        if not isinstance(fn, (FunctionType, MethodType)):
            raise TypeError(f"'{fn}' must be function or method.")

        @functools.wraps(fn)
        async def wrapper(*args, **kwargs):
            while self.count:
                self.count = max(self.count - 1, -1)
                try:
                    await fn(*args, **kwargs)
                except CancelRepeat:
                    break
                except self.exceptions as e:
                    if self.logs:
                        LOGGER.warning(e, exc_info=True)
                except Exception as e:
                    if self.fail_on_error:
                        raise e
                    elif self.logs:
                        LOGGER.warning(e, exc_info=True)
                else:
                    if self.break_on_success:
                        break
                finally:
                    await asyncio.sleep(self.timeout)

        return wrapper


class ProxyField:
    __slots__ = ('onset', 'readonly', 'types', 'value')

    def __init__(self, *types, onset=None, readonly=False):
        if not isinstance(onset, (FunctionType, MethodType, NoneType)):
            self.onset = None
        else:
            self.onset = onset

        if not isinstance(readonly, bool):
            self.readonly = False
        else:
            self.readonly = readonly

        self.types = types

    def __get__(self, instance, owner) -> Any:
        return self.value

    def __set__(self, instance, value):
        if not isinstance(value, self.types):
            raise TypeError(f"'${self.types}' types required.")

        if self.readonly and hasattr(self, 'value'):
            raise AttributeError("This field is readonly and cannot be set again.")

        if self.onset is not None:
            self.onset(self, value)

        self.value = value

    def __delete__(self, instance):
        if self.readonly:
            raise AttributeError("This field is readonly and cannot be deleted.")

        del self.value


def bytes_to_json(b: bytes, codec: str = 'utf-8') -> dict:
    if not isinstance(b, bytes):
        raise TypeError(f"'{b}' must be a bytes.")

    return loads(b.decode(codec))


def check_path(path: Optional[str]) -> bool:
    try:
        Path(path)
    except (ValueError, TypeError):
        return False

    return True


def is_async(fn):
    if not isinstance(fn, (FunctionType, MethodType)):
        return False

    return not not fn.__code__.co_flags & CO_COROUTINE


def is_async_generator(fn):
    if not isinstance(fn, (FunctionType, MethodType)):
        return False

    return not not fn.__code__.co_flags & CO_ASYNC_GENERATOR


def is_generator(fn):
    if not isinstance(fn, (FunctionType, MethodType)):
        return False

    return not not fn.__code__.co_flags & CO_GENERATOR


def is_simple_stroke(s: str) -> bool:
    if not isinstance(s, str):
        return False

    if s.isspace() or not s:
        return True

    return False


def json_to_bytes(o: dict, codec: str = 'utf-8') -> bytes:
    if not isinstance(o, dict):
        raise TypeError(f"'{o}' must be a dictionary.")

    return dumps(o).encode(codec)


def record(fn) -> Callable[..., Coroutine[Any, Any, Any]]:
    """
    A decorator to record data.

    Note:
        For generator functions or asynchronous generator functions.
    """
    if not isinstance(fn, (FunctionType, MethodType)):
        raise TypeError(f"'{fn}' must be function or method.")

    data = []

    if is_async_generator(fn):
        @functools.wraps(fn)
        async def wrapper(*args, **kwargs):
            nonlocal data
            coroutine = fn(*args, **kwargs)
            try:
                pattern = await anext(coroutine)
                if not len(data):
                    data.append(pattern)

                await coroutine.asend(data[0])
            except StopAsyncIteration:
                pass
    elif is_generator(fn):
        @functools.wraps(fn)
        def wrapper(*args, **kwargs):
            nonlocal data
            call = fn(*args, **kwargs)
            try:
                pattern = next(call)
                if not len(data):
                    data.append(pattern)

                call.send(data[0])
            except StopIteration:
                pass
    else:
        raise TypeError(f"'{fn}' must be a generator function or async generator function.")

    return wrapper


def parse_keys(keys: str):
    keys = keys.split(";")
    for key in keys:
        if is_simple_stroke(key):
            continue

        key = key.strip()
        if not check_path(key):
            raise TypeError("'keys' string must be in the format: 'key1; key2; ...',"
                            "where each key points to a file with a host/client key.")

        yield key


def singleton(cls: type):
    """
    A decorator to make a class a singleton.
    """
    instances = {}

    @functools.wraps(cls)
    def wrapper(*args, **kwargs):
        if cls not in instances:
            instances[cls] = cls(*args, **kwargs)

        return instances[cls]

    return wrapper
