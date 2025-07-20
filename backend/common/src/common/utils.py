""" Python utils for the backend. """
import functools
from inspect import CO_ASYNC_GENERATOR, CO_GENERATOR
from types import FunctionType, MethodType, NoneType

__all__ = ["Counter", "record", "ProxyField", "singleton"]


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

    def __get__(self, instance, owner):
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


class Counter:
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


def is_async_generator(fn):
    if not isinstance(fn, (FunctionType, MethodType)):
        return False

    return not not fn.__code__.co_flags & CO_ASYNC_GENERATOR


def is_generator(fn):
    if not isinstance(fn, (FunctionType, MethodType)):
        return False

    return not not fn.__code__.co_flags & CO_GENERATOR


def record(fn):
    """
    A decorator to record data.

    Note:
        For generator functions or asynchronous generator functions.
    """
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
