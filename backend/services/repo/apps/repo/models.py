# This is an auto-generated Django model module.
# You'll have to do the following manually to clean this up:
#   * Rearrange models' order
#   * Make sure each model has one field with primary_key=True
#   * Make sure each ForeignKey and OneToOneField has `on_delete` set to the desired behavior
#   * Remove `managed = False` lines if you wish to allow Django to create, modify, and delete the table
# Feel free to rename the models, but don't rename db_table values or field names.
from django.db import models
# https://pypi.org/project/django-enum/
from django_enum import EnumField


class AuthUserExternal(models.Model):
    id = models.AutoField(primary_key=True)
    user_id = models.IntegerField()

    class Meta:
        db_table = 'auth_user_external'


class Branch(models.Model):
    id = models.BigAutoField(primary_key=True)
    repo = models.ForeignKey('Repo', on_delete=models.CASCADE)
    name = models.CharField(max_length=255)
    is_default = models.BooleanField(db_index=True)

    class Meta:
        db_table = 'branch'


class File(models.Model):
    id = models.BigAutoField(primary_key=True)
    name = models.CharField(max_length=255)
    path = models.CharField(max_length=255, db_comment='relative path into repo')
    ext = models.CharField(max_length=255, blank=True, null=True, db_index=True,
                           db_comment='`NULL` equal without extension')
    branch = models.ForeignKey(Branch, on_delete=models.CASCADE)

    class Meta:
        db_table = 'file'


class Maintainer(models.Model):
    class AccessEnum(models.TextChoices):
        FULL = 'f', 'full'
        PARTIAL = 'p', 'partial'

    id = models.BigAutoField(primary_key=True)
    repo = models.ForeignKey('Repo', on_delete=models.CASCADE)
    user = models.ForeignKey(AuthUserExternal, on_delete=models.CASCADE, db_index=False)
    access = EnumField(AccessEnum, db_comment='values: full, partial')

    class Meta:
        db_table = 'maintainer'


class Repo(models.Model):
    class AccessEnum(models.TextChoices):
        PRIVATE = 'PR', 'private'
        PUBLIC = 'PU', 'public'

    id = models.BigAutoField(primary_key=True)
    user = models.ForeignKey(AuthUserExternal, on_delete=models.CASCADE, db_comment='repo holder')
    storage = models.ForeignKey('Storage', on_delete=models.SET_NULL, blank=True, null=True,
                                db_comment='`NULL` when repo store locale')
    name = models.CharField(max_length=32)
    access = EnumField(AccessEnum, db_index=True, db_comment='values: private, public')
    path = models.CharField(max_length=255, db_comment='path into storage')

    class Meta:
        db_table = 'repo'


class Storage(models.Model):
    id = models.BigAutoField(primary_key=True)
    link = models.CharField(max_length=255)

    class Meta:
        db_table = 'storage'
