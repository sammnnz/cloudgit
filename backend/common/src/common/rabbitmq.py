""" RabbitMQ service for publishing and receiving messages. """
import logging

from pika import BlockingConnection, ConnectionParameters, PlainCredentials
from pika.adapters.blocking_connection import BlockingChannel
from pika.exceptions import ConnectionWrongStateError, StreamLostError
from types import FunctionType, MethodType, NoneType

__all__ = ['acknowledge', 'DummyConnection', 'RabbitMQService', 'RabbitMQServiceError']

LOGGER = logging.getLogger(__name__)


def acknowledge(on_message: callable):  # type: ignore[no-untyped-def]
    """
    Default wrapper for acknowledge the message after success run 'on_message'
    function.
    """

    def wrapper(ch, method, properties, body):
        try:
            on_message(ch, method, properties, body)
        except Exception as e:
            raise RabbitMQServiceError(f"RabbitMQError: {e}")

        ch.basic_ack(delivery_tag=method.delivery_tag)  # Acknowledge the message

    return wrapper


class _ProxyField:
    __slots__ = ('types', 'value')

    def __init__(self, *types):
        self.types = types
        self.value = None

    def __get__(self, instance, owner):
        return self.value

    def __set__(self, instance, value):
        if not isinstance(value, self.types):
            raise TypeError(f"'${self.types}' types required.")

        self.value = value


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
        raise ConnectionWrongStateError("Connection is not open or failed to reload.")

    def close(self, reply_code=200, reply_text='Normal shutdown'):
        pass


# noinspection PyDunderSlots,PyUnresolvedReferences
class RabbitMQService(metaclass=_RabbitMQMeta):
    __slots__ = ()

    channel = _ProxyField(BlockingChannel, NoneType)
    connection = _ProxyField(BlockingConnection, DummyConnection)
    params = _ProxyField(ConnectionParameters)

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
        except RuntimeError as e:
            self.connection = DummyConnection()

        try:
            self.channel = self.connection.channel()
        except StreamLostError as e:
            self.channel = None

    def _force_reload(self):
        if self.connection.is_open:
            try:
                self.connection.close()
            except ConnectionWrongStateError:
                pass

        try:
            self.connection = BlockingConnection(self.params)
        except RuntimeError as e:
            return False

        return True

    def _update_channel(self):
        if not self.connection.is_open and not self._force_reload():
            raise ConnectionWrongStateError("Connection is not open or failed to reload.")

        try:
            self.channel = self.connection.channel()
        except StreamLostError as e:
            if self._force_reload():
                self.channel = self.connection.channel()
            else:
                raise RuntimeError("Connection is not open or failed to reload.")

    def receive(self, queue: str = 'default', on_message: callable = None, **kwargs):
        if not isinstance(on_message, (FunctionType, MethodType)):
            def on_message(ch, method, properties, body):
                print(f"Received message: {body.decode()}")

        cn = self.channel
        try:
            cn.queue_declare(queue=queue, durable=True)
            cn.basic_consume(queue=queue, on_message_callback=on_message, auto_ack=False, **kwargs)
            cn.start_consuming()
        except (AttributeError, StreamLostError) as e:
            try:
                self._update_channel()
            except (ConnectionWrongStateError, RuntimeError) as e:
                pass  # TODO: impl save message
            else:
                cn = self.channel
                try:
                    cn.queue_declare(queue=queue, durable=True)
                    cn.basic_consume(queue=queue, on_message_callback=on_message, auto_ack=False, **kwargs)
                    cn.start_consuming()
                except (AttributeError, StreamLostError) as e:
                    pass  # TODO: impl save message

    def send(self, queue: str = 'default', message: bytes = b'', **kwargs):
        cn = self.channel
        try:
            cn.queue_declare(queue=queue, durable=True)
            cn.basic_publish(exchange='', routing_key=queue, body=message, **kwargs)
        except (AttributeError, StreamLostError) as e:
            try:
                self._update_channel()
            except (ConnectionWrongStateError, RuntimeError) as e:
                pass  # TODO: impl save message
            else:
                cn = self.channel
                try:
                    cn.queue_declare(queue=queue, durable=True)
                    cn.basic_publish(exchange='', routing_key=queue, body=message, **kwargs)
                except (AttributeError, StreamLostError) as e:
                    pass  # TODO: impl save message


class RabbitMQServiceError(Exception):
    pass
