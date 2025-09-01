from common.utils import is_simple_stroke
from django.contrib.auth.password_validation import validate_password
from django.contrib.auth.validators import UnicodeUsernameValidator
from django.core.exceptions import ValidationError
from django.core.validators import validate_email
from ninja import ModelSchema, Schema
from ninja.errors import HttpError
from pydantic import field_validator
from typing import Optional
from .models import User, SSHKey

username_validator = UnicodeUsernameValidator()


class SessionInfoOut(Schema):
    id: Optional[int] = None  # user ID
    is_authenticated: bool = False
    username: str = ''


class SessionLoginIn(ModelSchema):
    class Meta:
        model = User
        fields = ('username', 'password')
        fields_optional = ()


class UserInSchema(ModelSchema):
    class Meta:
        model = User
        fields = ('username', 'password', 'email', 'first_name', 'last_name')
        fields_optional = ('first_name', 'last_name')

    # https://pydantic.com.cn/ru/concepts/validators/#_3
    @field_validator('email', check_fields=False, mode='before')
    @classmethod
    def validate_email(cls, value):
        if not value:
            raise HttpError(422, "Email is required.")

        try:
            validate_email(value)
        except ValidationError as e:
            raise HttpError(422, message=e.message)

        return value.lower()

    @field_validator('password', check_fields=False, mode='before')
    @classmethod
    def validate_password(cls, value):
        if not value:
            raise HttpError(422, "Password is required.")

        try:
            validate_password(value, user=None)
        except ValidationError as e:
            raise HttpError(422, message=e.message)

        return value

    @field_validator('username', check_fields=False, mode='before')
    @classmethod
    def validate_username(cls, value):
        if not value:
            raise HttpError(422, "Username is required.")

        try:
            username_validator(value)
        except ValidationError as e:
            raise HttpError(422, message=e.message)

        return value.lower()


class UserOutSchema(ModelSchema):
    class Meta:
        model = User
        fields = ('id', 'username', 'email', 'first_name', 'last_name')
        fields_optional = ('first_name', 'last_name')


class UserSSHKeyAddInSchema(Schema):
    username: str
    keyname: str
    sshkey: str

    @field_validator('sshkey', check_fields=False, mode='after')
    @classmethod
    def validate_sshkey(cls, value: str):
        value = value.strip()
        if is_simple_stroke(value):
            raise HttpError(422, "SSH key must be not empty.")

        if len(value) > 256:
            raise HttpError(422, "SSH key must be <= 256 characters.")

        return value


class UserSSHKeysInSchema(Schema):
    username: str
    keyname: Optional[str] = None


class _UserSSHKey(Schema):
    id: int
    username: str


class UserSSHKeyOutSchema(ModelSchema):
    user: _UserSSHKey

    class Meta:
        model = SSHKey
        fields = ('id', 'keyname', 'sshkey')
        fields_optional = ('fingerprint',)
