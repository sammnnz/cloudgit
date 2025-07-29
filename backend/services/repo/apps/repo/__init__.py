from common.rabbitmq import ARabbitMQService, parse_settings
from django.conf import settings

rabbit_settings = parse_settings(settings)
rabbit = ARabbitMQService(** rabbit_settings)
rabbit.connect()
rabbit.consume(['to_repo'], consume_timeout=3600)
