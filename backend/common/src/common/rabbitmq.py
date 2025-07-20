""" Async RabbitMQ service for publishing and receiving messages. """
import aio_pika
import asyncio
import logging

from aio_pika import exceptions
from aio_pika.abc import AbstractRobustConnection, AbstractRobustChannel
from aio_pika.message import Message
from aiormq import ChannelPreconditionFailed
from collections import deque
from types import NoneType
from typing import Optional, Union, Any

from .utils import record, ProxyField, singleton, Counter

__all__ = ['acknowledge', 'ARabbitMQService']

logging.basicConfig(level=logging.INFO)
_LOGGER = logging.getLogger(__name__)
_TIMEOUT = 10.0


def acknowledge(on_message: callable):
    """
    Default wrapper for acknowledge the message after success run 'on_message'
    function.
    """
    # TODO: impl acknowledge decorator
    # def wrapper(ch, method, properties, body):
    #     try:
    #         on_message(ch, method, properties, body)
    #     except Exception as e:
    #         pass
    #     else:
    #         ch.basic_ack(delivery_tag=method.delivery_tag)  # Acknowledge the message
    #
    # return wrapper



@singleton
class ARabbitMQService:
    __slots__ = ()

    # noinspection PyMethodParameters
    def _on_close(proxy, value):
        connection: AbstractRobustConnection = getattr(proxy, 'value', None)
        if connection is None:
            return

        if not connection.is_closed:
            asyncio.create_task(connection.close())

    connection: Optional[AbstractRobustConnection] = ProxyField(
        AbstractRobustConnection, NoneType,
        onset=_on_close
    )
    params: dict[str, Any] = ProxyField(
        dict,
        readonly=True
    )

    def __init__(self, /, host='localhost', port=5672, vhost='/', user='guest', password='guest', heartbeat=60,
                 **kwargs):
        self.connection = None
        self.params = {'host': host, 'port': port, 'virtualhost': vhost, 'login': user, 'password': password,
                       'timeout': heartbeat}
        self.params.update(kwargs)

    async def close(self):
        try:
            await self.connection.close()
        except exceptions.CONNECTION_EXCEPTIONS as e:
            _LOGGER.warning("Problem with closing connection: %s \n"
                           "May be connection already closed.", e.args[0])

    async def connect(self, repeat: int = -1, timeout: float = _TIMEOUT) -> None:
        _LOGGER.info("Connecting to RabbitMQ...")
        try:
            if self.connection is None or self.connection.is_closed:
                self.connection = await aio_pika.connect_robust(**self.params)
                _LOGGER.info("Success connection to RabbitMQ.")
        except exceptions.CONNECTION_EXCEPTIONS as e:
            _LOGGER.error(e)
            if repeat:
                await asyncio.sleep(timeout)
                await self.connect(repeat - 1)

    @record
    async def declare(self,
                      channel: Optional[AbstractRobustChannel] = None,
                      exchange: str = 'default',
                      queues: Union[list[str], tuple[str, ...]] = ()) -> None:
        """
        Raises:
            ChannelPreconditionFailed: exchange or queue already exists with other parameters.
            TypeError: exchange or queue has invalid type.
        """
        if not isinstance(exchange, str):
            raise TypeError("'exchange' must be a string.")

        if not isinstance(queues, (list, tuple)):
            raise TypeError("'queues' must be a list or tuple.")

        if not isinstance(channel, (AbstractRobustChannel, NoneType)):
            channel = None

        ch = channel or await self.connection.channel()
        record_data = yield {"exchanges": [], "queues": []}
        try:
            if exchange not in record_data['exchanges']:
                await ch.declare_exchange(exchange, durable=True, robust=False)
                record_data["exchanges"].append(exchange)

            for queue in queues:
                if not isinstance(queue, str):
                    raise TypeError("'queue' must be a string.")

                if queue not in record_data['queues']:
                    qu = await ch.declare_queue(queue, durable=True, robust=False)
                    record_data["queues"].append(queue)
                    await qu.bind(exchange=exchange, routing_key=queue)
        except ChannelPreconditionFailed as e:
            _LOGGER.error("exchange or queue already exists with other parameters.")
            _LOGGER.error(e)
            raise
        finally:
            if channel is None:
                try:
                    await ch.close()
                except Exception as e:
                    _LOGGER.error(e)
                else:
                    _LOGGER.info(f"temp channel was closed: {ch}")

    def run(self):
        asyncio.create_task(self.connect())

    async def send(self,
                   exchange: str = 'default',
                   queues: Union[list[str], tuple[str, ...]] = (),
                   message: bytes = b'',
                   enable_errors: bool = False,
                   repeat_on_error: int = -1) -> None:
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
        if not isinstance(message, bytes):
            if enable_errors:
                raise TypeError("'message' must be a byte.")

            _LOGGER.error("'message' must be a byte.")
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
                    _LOGGER.info(f"Sending message success. Details: exchange - {exchange}, queue - {queue}, message - {message}.")
        except (AttributeError, TypeError, *exceptions.CONNECTION_EXCEPTIONS) as e:
            try:
                _LOGGER.error(e)
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

    @Counter(max_count=1)
    async def _send_lost_messages(self, big_timeout: float = _TIMEOUT, small_timeout: float = 1.0) -> None:
        big_timeout = min(max(big_timeout, 5.0), 20.0)  # 5 <= big_timeout <= 20
        small_timeout = max(min(small_timeout, 2.0), 0.1)  # 0.1 <= small_timeout <= 2
        count, timeout = max(len(self._get_lost_messages()), 0x20), big_timeout
        temp_queue = deque(maxlen=count)
        while count:
            await asyncio.sleep(timeout)
            try:
                count -= 1
                msg = self._get_lost_messages().popleft()
                _LOGGER.info(f"Sending lost message ... {msg}")
                repeat = msg['repeat_on_error']
                if repeat:
                    msg['repeat_on_error'] = 0

                await self.send(**msg)
            except ChannelPreconditionFailed:  # problems with declare exchange or queue
                if repeat:
                    msg['repeat_on_error'] = max(repeat - 1, -1)
                    temp_queue.appendleft(msg)

                timeout = small_timeout
            except (AttributeError, *exceptions.CONNECTION_EXCEPTIONS):  # connection problems (wait more time)
                count += 1
                msg['repeat_on_error'] = repeat
                self._get_lost_messages().appendleft(msg)
                timeout = big_timeout
            except Exception as e:  # other (unknown) problems
                _LOGGER.error(e)
                if repeat:
                    msg['repeat_on_error'] = max(repeat - 1, -1)
                    temp_queue.appendleft(msg)

                timeout = small_timeout
            else:
                timeout = small_timeout
            finally:
                if not count:
                    self._get_lost_messages().extendleft(temp_queue)
                    temp_queue.clear()
                    count = len(self._get_lost_messages())
                    timeout = big_timeout
