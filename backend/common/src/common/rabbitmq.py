""" Async RabbitMQ service for publishing and receiving messages. """
import aio_pika
import asyncio
import logging

from aio_pika import exceptions
from aio_pika.abc import AbstractIncomingMessage, AbstractRobustChannel, AbstractRobustConnection
from aio_pika.message import Message
from aiormq import ChannelPreconditionFailed
from collections import deque
from functools import partial, wraps
from types import NoneType
from typing import Any, Awaitable, Callable, Optional, Union

from .utils import counter, is_async, record, repeat, singleton

__all__ = ['ARabbitMQService', 'consume_callback', 'parse_settings']

logging.basicConfig(level=logging.INFO)

CONNECTION_EXCEPTIONS = (AttributeError, *exceptions.CONNECTION_EXCEPTIONS)
DEFAULT_TIMEOUT = 10.0
LOGGER = logging.getLogger(__name__)


def parse_settings(settings):
    """
    Example: You can insert into settings.py file follow
         ...

         RABBITMQ = {
            'host': 'localhost',

            'port': 5762,

            'user': 'guest',

            'password': 'guest',

            'vhost': '/',

            'heartbeat': 60,

            'defaults': {
                'exchange': 'default',

                'queues': [
                    'default'

                ]

            }
         }

        ...
    """
    defaults = {
        'host': 'localhost',
        'port': 5762,
        'user': 'guest',
        'password': 'guest',
        'vhost': '/',
        'heartbeat': 60,
        'defaults': {
            'exchange': 'default',
            'queues': [
                'default'
            ]
        }
    }
    _ = getattr(settings, 'RABBITMQ', {})
    if not isinstance(_, dict):
        raise TypeError('RABBITMQ must be a dictionary.')

    defaults['defaults'].update(_.get('defaults', {}))
    try:
        del _['defaults']
    except KeyError:
        pass

    defaults.update(_)
    return defaults


# noinspection PyPep8Naming
class consume_callback:
    __slots__ = ('ack', 'queues', 'rabbit')

    def __init__(self, queues: Optional[Union[list[str], tuple[str, ...]]], ack: bool = False):
        if not isinstance(queues, (list, tuple)):
            raise TypeError("'queues' must be a list or tuple.")

        for queue in queues:
            if not isinstance(queue, str):
                raise TypeError("'queue' must be a string.")

        if not isinstance(ack, bool):
            ack = False

        self.ack = ack
        self.queues = queues

    @record
    def __call__(self, fn: Callable[[AbstractIncomingMessage, ...], Awaitable[Any]]) \
            -> Callable[[AbstractIncomingMessage, ...], Awaitable[Any]]:
        callbacks = yield deque()
        messages = []
        if is_async(fn):
            @wraps(fn)
            async def wrapper(msg: AbstractIncomingMessage, *args, **kwargs):
                nonlocal messages
                if self.ack:
                    if msg.message_id in messages:
                        return

                    messages.append(msg.message_id)

                try:
                    await fn(msg, *args, **kwargs)
                except Exception as e:
                    LOGGER.error(e)
                    raise

                if self.ack:
                    info = _get_acknowledge_info(msg)
                    if not info["is_ack"]:
                        return

                    if info["count"] > 1:
                        info["count"] -= 1
                    elif info["count"] == 1:
                        try:
                            await msg.ack()
                        except Exception as e:
                            LOGGER.error(e, exc_info=True)
                        else:
                            LOGGER.info(f"Message {msg.message_id} acknowledged.")
                        finally:
                            _clear_acknowledge_info(msg)
        else:
            raise TypeError("Consume callback must be async.")

        wrapper.ack = self.ack
        wrapper.queues = self.queues
        callbacks.append(wrapper)
        return wrapper


def _get_acknowledge_info(msg: AbstractIncomingMessage) -> dict[str, Any]:
    try:
        return _on_consume.__closure__[0].cell_contents[0].get(msg)
    except KeyError:
        return {"count": 0, "is_ack": False}


def _clear_acknowledge_info(msg: AbstractIncomingMessage) -> None:
    try:
        _on_consume.__closure__[0].cell_contents[0].pop(msg)
    except KeyError:
        pass


def _get_consume_callbacks():
    contents = consume_callback.__call__.__closure__[0].cell_contents  # [deque(...)]
    try:
        return contents[0]
    except IndexError:
        return deque()


@record
async def _on_consume(msg: AbstractIncomingMessage):
    data = yield {}
    data.setdefault(msg, None)
    count, is_ack = 0, True
    for fn in _get_consume_callbacks():
        if msg.routing_key in getattr(fn, 'queues'):
            ack = getattr(fn, 'ack')
            is_ack &= ack
            asyncio.create_task(fn(msg))
            if ack:
                count += 1

    if count:
        data[msg] = {"count": count, "is_ack": is_ack}
    else:
        del data[msg]


class ProxyConnection:
    __slots__ = ('connection',)

    def __init__(self):
        self.connection: Optional[AbstractRobustConnection] = None

    def __get__(self, instance, owner) -> Optional[AbstractRobustConnection]:
        return self.connection

    def __set__(self, instance: "ARabbitMQService", value: Optional[AbstractRobustConnection]) -> None:
        if not isinstance(value, (AbstractRobustConnection, NoneType)):
            raise TypeError("Connection must be an instance of AbstractRobustConnection or None.")

        if self.connection and not self.connection.is_closed:
            asyncio.create_task(instance.close())

        self.connection = value

    def __delete__(self, instance) -> None:
        self.connection = None


@singleton
class ARabbitMQService:
    __slots__ = ('defaults', 'params',)

    connection = ProxyConnection()

    def __init__(self, /, host='localhost', port=5672, vhost='/', user='guest', password='guest', heartbeat=60,
                 defaults=None, **kwargs):
        self.defaults = {
            'exchange': 'default',
        }
        self.defaults.update(defaults or {})
        self.params = {
            'host': host,
            'port': port,
            'virtualhost': vhost,
            'login': user,
            'password': password,
            'timeout': heartbeat
        }
        self.params.update(kwargs)

    async def close(self):
        try:
            if not self.connection.is_closed:
                await self.connection.close()
        except AttributeError:
            pass
        except exceptions.CONNECTION_EXCEPTIONS as e:
            LOGGER.warning("Problem with closing connection: %s \n"
                           "May be connection already closed.", e.args[0])

    async def _connect(self) -> None:
        LOGGER.info("Connecting to RabbitMQ...")
        if self.connection is None or self.connection.is_closed:
            self.connection = await aio_pika.connect_robust(**self.params)
            LOGGER.info("Success connection to RabbitMQ.")

    def connect(self, reload_timeout=DEFAULT_TIMEOUT):
        repeater = repeat(break_on_success=True,
                          count=-1,
                          exceptions=exceptions.CONNECTION_EXCEPTIONS,
                          timeout=reload_timeout)
        asyncio.create_task(repeater(self._connect)())

    @record
    async def _consume(self,
                       queue: str,
                       prefetch_count: int,
                       timeout: float) -> None:
        consumers = yield {}
        LOGGER.info(f"Start consume '{queue}' queue ...")
        ch = await self.connection.channel()
        await ch.set_qos(prefetch_count=prefetch_count)
        qu = await ch.declare_queue(queue, durable=True, robust=True, arguments={'x-queue-type': 'quorum'})
        tag = await qu.consume(callback=_on_consume, no_ack=False, timeout=timeout, robust=True)
        consumers[queue] = tag
        LOGGER.info(f"Success consuming '{queue}' queue.")

    def consume(self,
                queues: Union[list[str], tuple[str, ...], None] = None,
                logs: bool = False,
                prefetch_count: int = 50,
                consume_timeout: float = 3600,
                reload_timeout: float = DEFAULT_TIMEOUT) -> None:
        if queues is None:
            queues = self.defaults['queues']

        if not isinstance(queues, (list, tuple)):
            raise TypeError("'queues' must be a list or tuple.")

        if not isinstance(prefetch_count, int):
            prefetch_count = 50

        if not isinstance(consume_timeout, (float, int)):
            consume_timeout = 3600

        if not isinstance(reload_timeout, (float, int)):
            reload_timeout = DEFAULT_TIMEOUT

        repeater = repeat(break_on_success=True,
                          count=-1,
                          exceptions=exceptions.CONNECTION_EXCEPTIONS,
                          fail_on_error=False,
                          logs=logs,
                          timeout=reload_timeout)
        for queue in queues:
            if not isinstance(queue, str):
                LOGGER.warning(f"Queue {queue} must be a string. Consume doesn't run.")
                continue

            fn = partial(repeater(self._consume),
                         queue=queue,
                         prefetch_count=prefetch_count,
                         timeout=consume_timeout)
            asyncio.create_task(fn())

    @property
    def consumers(self):
        content = self._consume.__closure__[0].cell_contents
        try:
            return content[0]
        except IndexError:
            return {}

    async def remove_consume_unsafe(self, queue: str) -> None:
        if not isinstance(queue, str):
            raise TypeError("'queue' must be a string.")

        try:
            tag = self.consumers[queue]
        except KeyError:
            return

        ch = await self.connection.channel()
        qu = await ch.declare_queue(queue, durable=True, robust=True, arguments={'x-queue-type': 'quorum'})
        await qu.cancel(tag)
        del self.consumers[queue]

    @record
    async def declare(self,
                      channel: Optional[AbstractRobustChannel] = None,
                      exchange: Optional[str] = None,
                      queues: Optional[Union[list[str], tuple[str, ...]]] = None) -> None:  # TODO: separate _declare
        """
        Raises:
            ChannelPreconditionFailed: exchange or queue already exists with other parameters.
            TypeError: exchange or queue has invalid type.
        """
        if exchange is None:
            exchange = self.defaults['exchange']

        if not isinstance(exchange, str):
            raise TypeError("'exchange' must be a string.")

        if queues is None:
            queues = self.defaults['queues']

        if not isinstance(queues, (list, tuple)):
            raise TypeError("'queues' must be a list or tuple.")

        if not isinstance(channel, (AbstractRobustChannel, NoneType)):
            channel = None

        ch = channel
        if not isinstance(ch, AbstractRobustChannel):
            ch = await self.connection.channel()

        record_data = yield {"exchanges": [], "queues": []}
        try:
            if exchange not in record_data['exchanges']:
                await ch.declare_exchange(exchange, durable=True, robust=False)
                record_data["exchanges"].append(exchange)

            for queue in queues:
                if not isinstance(queue, str):
                    raise TypeError("'queue' must be a string.")

                if queue not in record_data['queues']:
                    qu = await ch.declare_queue(queue, durable=True, robust=False, arguments={'x-queue-type': 'quorum'})
                    record_data["queues"].append(queue)
                    await qu.bind(exchange=exchange, routing_key=queue)
        except ChannelPreconditionFailed as e:
            LOGGER.error("exchange or queue already exists with other parameters.")
            LOGGER.error(e)
            raise
        finally:
            if not isinstance(ch, AbstractRobustChannel):
                try:
                    await ch.close()
                except Exception as e:
                    LOGGER.error(e)
                else:
                    LOGGER.info(f"temp channel was closed: {ch}")

    async def send(self,
                   exchange: Optional[str] = None,
                   queues: Optional[Union[list[str], tuple[str, ...]]] = None,
                   message: bytes = b'',
                   enable_errors: bool = False,
                   repeat_on_error: int = -1) -> None:  # TODO: add validate all params
        """
        Args:
            exchange:
            queues:
            message:
            enable_errors: if argument is False, then ignore all errors.
             Default: False.
            repeat_on_error: if argument < 0, then message will try to be sent 'indefinitely'.
             If the connection is broken, the number of attempts to resend the message will not
             be spent until the connection is restored.
             Default: -1.
        Raises:
            ChannelPreconditionFailed: exchange or queue already exists with other parameters.
            TypeError: exchange or queue or message has invalid type.
             In case with invalid types, don't repeat send for any repeat_on_error argument.
        """
        if exchange is None:
            exchange = self.defaults['exchange']

        if not isinstance(message, bytes):
            if enable_errors:
                raise TypeError("'message' must be a byte.")

            LOGGER.error("'message' must be a byte.")
            return

        if not isinstance(enable_errors, bool):
            enable_errors = False

        if not isinstance(repeat_on_error, int):
            repeat_on_error = -1

        count = 0
        try:
            async with self.connection.channel() as ch:
                await self.declare(ch, exchange, queues)
                exc = await ch.get_exchange(exchange)
                for queue in queues:
                    await exc.publish(Message(message), queue)
                    count += 1
                    LOGGER.info(
                        f"Sending message success. Details: "
                        f"exchange - {exchange}, "
                        f"queue - {queue}, "
                        f"message - {message}.")
        except (AttributeError, TypeError, *exceptions.CONNECTION_EXCEPTIONS) as e:
            try:
                LOGGER.error(e)
                if enable_errors:
                    raise e
            finally:
                if not isinstance(e, TypeError) and repeat_on_error and count < len(queues):
                    self._save_lost_messages(
                        exchange,
                        queues[count:len(queues)],
                        message,
                        repeat_on_error
                    )

    def _get_lost_messages(self) -> deque:
        contents = self._save_lost_messages.__closure__[0].cell_contents
        try:
            return contents[0]
        except IndexError:
            return contents

    def _is_run_send_lost_messages(self) -> bool:
        return not not self._send_lost_messages.__closure__[0].cell_contents[0]

    @record
    def _save_lost_messages(self,
                            exchange: str,
                            queues: Union[list[str], tuple[str, ...]],
                            message: bytes,
                            repeat_on_error: int) -> None:
        record_data = yield deque()
        record_data.append({
            'exchange': exchange,
            'queues': queues,
            'message': message,
            'enable_errors': True,
            'repeat_on_error': max(repeat_on_error, -1)
        })
        if not self._is_run_send_lost_messages():
            asyncio.create_task(self._send_lost_messages())

    @counter(max_count=1)
    async def _send_lost_messages(self, big_timeout: float = DEFAULT_TIMEOUT, small_timeout: float = 1.0) -> None:
        big_timeout = min(max(big_timeout, 5.0), 20.0)  # 5 <= big_timeout <= 20
        small_timeout = max(min(small_timeout, 2.0), 0.1)  # 0.1 <= small_timeout <= 2
        count, timeout = min(len(self._get_lost_messages()), 0x20), big_timeout
        temp_queue = deque(maxlen=count)
        while count:
            await asyncio.sleep(timeout)
            msg = self._get_lost_messages().popleft()
            LOGGER.info(f"Sending lost message ... {msg}")
            rep = msg['repeat_on_error']
            try:
                count -= 1
                if rep:
                    msg['repeat_on_error'] = 0

                await self.send(**msg)
            except ChannelPreconditionFailed:  # problems with declare exchange or queue
                if rep:
                    msg['repeat_on_error'] = max(rep - 1, -1)
                    temp_queue.appendleft(msg)

                timeout = small_timeout
            except (AttributeError, *exceptions.CONNECTION_EXCEPTIONS):  # connection problems (wait more time)
                count += 1
                msg['repeat_on_error'] = rep
                self._get_lost_messages().appendleft(msg)
                timeout = big_timeout
            except Exception as e:  # other (unknown) problems
                print("other (unknown) problems")
                LOGGER.error(e)
                if rep:
                    msg['repeat_on_error'] = max(rep - 1, -1)
                    temp_queue.appendleft(msg)

                timeout = small_timeout
            else:
                timeout = small_timeout
            finally:
                if not count:
                    self._get_lost_messages().extendleft(temp_queue)
                    temp_queue.clear()
                    count = min(len(self._get_lost_messages()), 0x20)
                    timeout = big_timeout
