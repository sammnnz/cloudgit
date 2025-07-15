""" RabbitMQ service for publishing and receiving messages. """
import logging

from pika import BlockingConnection, ConnectionParameters, PlainCredentials
from pika.adapters.blocking_connection import BlockingChannel
from pika.exceptions import AMQPConnectionError, ChannelClosedByBroker, ChannelWrongStateError, \
    ConnectionClosedByBroker, ConnectionWrongStateError, StreamLostError, AMQPError
from time import sleep
from types import FunctionType, MethodType, NoneType
from typing import Optional, Union

from .utils import ProxyField

__all__ = ['acknowledge', 'DummyConnection', 'RabbitMQService', 'RabbitMQServiceError']

LOGGER = logging.getLogger(__name__)


def acknowledge(on_message: callable):
    """
    Default wrapper for acknowledge the message after success run 'on_message'
    function.
    """

    def wrapper(ch, method, properties, body):
        try:
            on_message(ch, method, properties, body)
        except Exception as e:
            pass
        else:
            ch.basic_ack(delivery_tag=method.delivery_tag)  # Acknowledge the message

    return wrapper


class _RabbitMQMeta(type):
    __slots__ = ()

    _service = None

    def __call__(cls, *args, **kwargs):
        if not (cls is RabbitMQService):
            raise TypeError("'_RabbitMQMeta' metaclass only for 'RabbitMQService' class.")

        if isinstance(_RabbitMQMeta._service, RabbitMQService):
            return _RabbitMQMeta._service

        instance = object.__new__(cls)
        instance.__init__(*args, **kwargs)
        _RabbitMQMeta._service = instance
        return instance


class DummyConnection:
    __slots__ = ()

    @property
    def is_open(self):
        return False

    def channel(self, channel_number=None):
        raise StreamLostError("Connection is not open or failed to reload.")

    def close(self, reply_code=200, reply_text='Normal shutdown'):
        pass


def _record_message(fn):
    """
    Decorator to record messages.
    """
    messages = []

    def wrapper(self, queues, message, exchange, repeat):
        nonlocal messages
        messages.append({'queues': queues, 'message': message, 'exchange': exchange, 'repeat': repeat})

    return wrapper


def _record_queues(fn):
    """
    Decorator to record queues for the RabbitMQ service.

    Note: Only for RabbitMQService._declare_queues.

    Raises:
        TypeError
    """
    _exchanges = [None]
    _queues = []

    def wrapper(self, queues, exchange):
        if not isinstance(queues, (list, tuple)):
            raise TypeError("Queues must be a list or tuple.")

        if not isinstance(exchange, (str, NoneType)):
            raise TypeError("Exchange must be a string or None.")

        if exchange not in _exchanges:
            try:
                self.channel.exchange_declare(exchange=exchange, exchange_type='direct', durable=True)
            except ChannelWrongStateError as e:
                return  # exchange already exists with other parameters
            except (AttributeError, ConnectionClosedByBroker) as e:
                return  # problems with channel
            except AMQPError as e:
                return

            _exchanges.append(exchange)

        for queue in queues:
            if queue in _queues:
                continue

            if not isinstance(queue, str):
                raise TypeError("Queue must be a string.")

            try:
                self.channel.queue_declare(queue=queue, durable=True)
            except (AttributeError, ChannelClosedByBroker) as e:
                return  # problems with channel or queue exists with other parameters
            except AMQPError as e:
                return

            try:
                if exchange is not None:
                    self.channel.queue_bind(exchange=exchange, queue=queue, routing_key=queue)
            except (AttributeError, ChannelClosedByBroker) as e:
                return  # problems with channel
            except AMQPError as e:
                return

            _queues.append(queue)

    return wrapper


# noinspection PyDunderSlots,PyUnresolvedReferences,PyArgumentList
class RabbitMQService(metaclass=_RabbitMQMeta):
    __slots__ = ()

    channel = ProxyField(BlockingChannel, NoneType)
    exchange_default = ProxyField(str, readonly=True)
    connection = ProxyField(BlockingConnection, DummyConnection)
    params = ProxyField(ConnectionParameters, readonly=True)

    def __init__(self,
                 host='localhost',
                 port=5672,
                 vhost='/',
                 user='guest',
                 password='guest',
                 heartbeat=60,
                 **kwargs):
        self.params = ConnectionParameters(
            host=host, port=port, virtual_host=vhost,
            credentials=PlainCredentials(user, password), heartbeat=heartbeat, **kwargs
        )
        try:
            self.connection = BlockingConnection(self.params)
        except (RuntimeError, AMQPConnectionError) as e:
            self.connection = DummyConnection()

        try:
            self.channel = self.connection.channel()
        except StreamLostError as e:
            self.channel = None

    @_record_queues
    def _declare_queues(self,
                        queues: Union[list[str], tuple[str, ...]],
                        exchange: Optional[str]):
        """
        Raises:
             TypeError
        """

    def _force_reload(self):
        """
        Raises:
        """
        if self.connection.is_open:
            try:
                self.connection.close()
            except ConnectionWrongStateError:
                pass

        try:
            self.connection = BlockingConnection(self.params)
        except (RuntimeError, AMQPConnectionError) as e:
            return False

        return True

    @_record_message
    def _save_lost_message(self,
                           queues: Union[list[str], tuple[str, ...]],
                           message: bytes,
                           exchange: str,
                           repeat: int):
        """
        Raises:
        """

    def _update_channel(self):
        """
        Raises:
            AMQPConnectionError
            ConnectionWrongStateError
        """
        if not self.connection.is_open and not self._force_reload():
            raise ConnectionWrongStateError("Connection is not open or failed to reload.")

        try:
            self.channel = self.connection.channel()
        except StreamLostError as e:
            if self._force_reload():
                self.channel = self.connection.channel()
            else:
                raise AMQPConnectionError("Connection is not open or failed to reload.")

    def get_lost_messages(self):
        return self._save_lost_message.__closure__[0].cell_contents

    def get_post_messages(self):
        return self.post_message.__closure__[0].cell_contents

    @_record_message
    def post_message(self,
                     queues: Union[list[str], tuple[str, ...]] = (),
                     message: bytes = b'',
                     exchange: str = '',
                     repeat: int = 0):
        pass

    def receive(self,
                queues: Union[list[str], tuple[str, ...]] = (),
                on_message: callable = None,
                restart: int = 0):
        if not isinstance(on_message, (FunctionType, MethodType)):
            def on_message(ch, method, properties, body):
                print(f"Received message: {body.decode()}")

        if not isinstance(restart, int) or restart < 0:
            restart = 0

        try:
            cn = self.channel
            if cn is not None and cn.is_open:
                self._declare_queues(queues, None)

            for queue in queues:
                try:
                    cn.basic_consume(queue=queue, on_message_callback=on_message, auto_ack=False)
                except (AttributeError, AMQPError) as e:
                    self._update_channel()
                    cn = self.channel
                    if cn is None or cn.is_closed:
                        break

                    self._declare_queues(queues, None)
                    cn.basic_consume(queue=queue, on_message_callback=on_message, auto_ack=False)
            else:
                cn.start_consuming()
                return
        except TypeError as e:
            pass  # invalid data types
        except (AttributeError, AMQPError) as e:
            pass  # connection failed

        if restart:
            LOGGER.warning("RabbitMQ consuming is not running. Restarting...")
            sleep(1)
            self.receive(queues=queues, on_message=on_message, restart=restart - 1)

    def send(self,
             queues: Union[list[str], tuple[str, ...]] = (),
             message: bytes = b'',
             exchange: str = '',
             repeat: int = 0):
        if not isinstance(queues, (list, tuple)):
            queues = ()

        if not isinstance(message, bytes):
            message = b''

        if not isinstance(exchange, str):
            exchange = ''

        if not isinstance(repeat, int) or repeat < 0:
            repeat = 0

        count, length = 0, len(queues)
        try:
            cn = self.channel
            if cn is not None and cn.is_open:
                self._declare_queues(queues, exchange)

            for k in range(length):
                count = k
                try:
                    cn.basic_publish(exchange=exchange, routing_key=queues[k], body=message)
                except (AttributeError, AMQPError) as e:
                    self._update_channel()
                    cn = self.channel
                    if cn is None or cn.is_closed:
                        break  # connection failed

                    self._declare_queues(queues, exchange)
                    cn.basic_publish(exchange=exchange, routing_key=queues[k], body=message)
            else:
                count = length
        except TypeError as e:
            pass  # invalid data types
        except (AttributeError, AMQPError) as e:
            pass  # connection failed

        if count < length:
            self._save_lost_message(queues[count:length], message, exchange, repeat)


class RabbitMQServiceError(Exception):
    pass
