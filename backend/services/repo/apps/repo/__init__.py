from common.rabbitmq import ARabbitMQService, parse_settings
from common.ssh import ssh_connect
from utils import get_storages_from_settings
from django.conf import settings

rabbit = ARabbitMQService(** parse_settings(settings))
rabbit.connect()
rabbit.consume(['to_repo'], consume_timeout=3600)
for name, storage in get_storages_from_settings():
    ssh_connect(name, fail_on_error=False, **storage['ssh'])
