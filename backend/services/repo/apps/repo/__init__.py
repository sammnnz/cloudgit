from common.rabbitmq import ARabbitMQService, parse_settings
from common.ssh import ssh_connect
from common.utils import get_storage
from django.conf import settings

rabbit = ARabbitMQService(** parse_settings(settings))
rabbit.connect()
rabbit.consume(['to_repo'], consume_timeout=3600)
ssh_connect(** get_storage(settings, 'storage-1')['ssh'])
