from typing import Optional

from asgiref.sync import sync_to_async
from django.core.exceptions import MultipleObjectsReturned, ObjectDoesNotExist
from django.db import models


class BaseManager(models.Manager):
    async def aget_safe(self,
                        multi_return: bool = False,
                        select_related: Optional[str] = None,
                        **kwargs):

        try:
            if select_related:
                return await self.model.objects.select_related(select_related).aget(**kwargs)
            else:
                return await self.model.objects.aget(**kwargs)
        except MultipleObjectsReturned:
            if multi_return:
                if select_related:
                    return await sync_to_async(self.model.objects.select_related(select_related).filter)(**kwargs)
                else:
                    return await sync_to_async(self.model.objects.filter)(**kwargs)

            raise
        except ObjectDoesNotExist:
            return None
