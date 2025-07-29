from common.rabbitmq import ARabbitMQService
from common.utils import json_to_bytes
from ninja import Router
from .models import *
from .schema import *

rabbit = ARabbitMQService()
router = Router()
