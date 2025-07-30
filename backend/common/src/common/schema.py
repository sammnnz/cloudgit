from django.db.models import Model
from ninja import Schema


class RabbitSchema(Schema):
    action: str
    id: int
    info: dict
    service: str
    table: str

    @classmethod
    def from_orm(cls, obj: Model, action: str = "", info: dict = None) -> "RabbitSchema":
        if not isinstance(info, dict):
            info = {}

        return cls(
            action=action,
            id=obj.pk,
            info=info,
            service=obj._meta.app_label,
            table=obj._meta.db_table,
        )

    @classmethod
    def create(cls, obj: Model, info: dict = None) -> "RabbitSchema":
        return cls.from_orm(obj, action="create", info=info)

    @classmethod
    def delete(cls, obj: Model, info: dict = None) -> "RabbitSchema":
        return cls.from_orm(obj, action="delete", info=info)
