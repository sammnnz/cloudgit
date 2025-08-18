from pathlib import Path

from ninja import ModelSchema, Schema
from ninja.errors import HttpError
# from ninja.schema import S
from pydantic import field_validator
from typing import Optional, Literal  # , Type, Any

from common.utils import check_path
from .managers import RepoAccessEnum
from .models import AuthUserExternal, Repo

AccessLiteral = Literal["private", "public"]


class RepoGetInSchema(Schema):
    username: str = ...
    reponame: Optional[str] = ...
    access: Optional[str] = None

    @field_validator('access', check_fields=False, mode='before')
    @classmethod
    def validate_access(cls, value):
        if value:
            value = getattr(RepoAccessEnum, value.upper())

        return value


class _UserFromRepoSchema(ModelSchema):
    class Meta:
        model = AuthUserExternal
        fields = ("user_id", "username")


class RepoGetOutSchema(ModelSchema):
    # reponame: Optional[str] = None
    user: _UserFromRepoSchema

    class Meta:
        model = Repo
        fields = ["user", "repo_name", "access", "description"]
        depth = 1

    # def from_orm(cls: Type[S], obj: Any, **kw: Any) -> S:
    #     result = super().from_orm(obj, **kw)
    #     result.reponame = result.repo_name

    @field_validator('access', check_fields=False, mode='after')
    @classmethod
    def validate_access(cls, value):
        access = RepoAccessEnum(value).label
        return access


class RepoDataGetInSchema(Schema):
    username: str = ...
    reponame: str = ...
    branch: str = ...
    path: str = ...

    @field_validator('path', check_fields=False, mode='after')
    @classmethod
    def validate_path(cls, value):
        if not check_path(value):
            raise HttpError(422, f"Invalid path '{value}'.")

        return value


class RepoCreateInSchema(Schema):
    username: str = ...
    reponame: str = ...
    access: AccessLiteral = ...
    description: str = "no description"

    @field_validator('access', check_fields=False, mode='after')
    @classmethod
    def validate_access(cls, value):
        if value:
            value = getattr(RepoAccessEnum, value.upper()).value

        return value

    @field_validator('description', check_fields=False, mode='before')
    @classmethod
    def validate_description(cls, value):
        value = value.strip()
        if value == "":
            value = "no description"

        return value

    @field_validator('reponame', check_fields=False, mode='before')
    @classmethod
    def validate_reponame(cls, value):
        value = value.strip()
        if value == "":
            raise HttpError(422, "Repository name must be not empty string.")

        return value


class RepoDeleteInSchema(Schema):
    username: str = ...
    reponame: str = ...


class StorageSchema(Schema):
    link: str
    type: str
