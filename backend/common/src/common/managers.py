from asgiref.sync import sync_to_async
from django.core.exceptions import MultipleObjectsReturned, ObjectDoesNotExist
from django.db import models


class BaseManager(models.Manager):
    async def aget_safe(self, multi_return: bool = False, **kwargs):
        try:
            return await self.model.objects.aget(**kwargs)
        except MultipleObjectsReturned:
            if multi_return:
                return await sync_to_async(self.model.objects.filter)(**kwargs)

            raise
        except ObjectDoesNotExist:
            return None
