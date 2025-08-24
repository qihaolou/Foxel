from tortoise import fields
from tortoise.models import Model


class StorageAdapter(Model):
    id = fields.IntField(pk=True)
    name = fields.CharField(max_length=100, unique=True)
    type = fields.CharField(max_length=30)
    config = fields.JSONField()
    enabled = fields.BooleanField(default=True)
    mounts: fields.ReverseRelation["Mount"]

    class Meta:
        table = "storage_adapters"


class Mount(Model):
    id = fields.IntField(pk=True)
    path = fields.CharField(max_length=255, unique=True)
    sub_path = fields.CharField(max_length=1024, null=True)
    adapter: fields.ForeignKeyRelation[StorageAdapter] = fields.ForeignKeyField(
        "models.StorageAdapter", related_name="mounts", on_delete=fields.CASCADE
    )
    enabled = fields.BooleanField(default=True)

    class Meta:
        table = "mounts"


class UserAccount(Model):
    id = fields.IntField(pk=True)
    username = fields.CharField(max_length=50, unique=True)
    email = fields.CharField(max_length=100, unique=True, null=True)
    full_name = fields.CharField(max_length=100, null=True)
    hashed_password = fields.CharField(max_length=128)
    disabled = fields.BooleanField(default=False)

    class Meta:
        table = "user"


class Configuration(Model):
    id = fields.IntField(pk=True)
    key = fields.CharField(max_length=100, unique=True)
    value = fields.TextField()

    class Meta:
        table = "configurations"


class AutomationTask(Model):
    id = fields.IntField(pk=True)
    name = fields.CharField(max_length=100)
    event = fields.CharField(max_length=50)

    path_pattern = fields.CharField(max_length=1024, null=True)
    filename_regex = fields.CharField(max_length=255, null=True)

    processor_type = fields.CharField(max_length=100)
    processor_config = fields.JSONField()

    enabled = fields.BooleanField(default=True)

    class Meta:
        table = "automation_tasks"


class Log(Model):
    id = fields.IntField(pk=True)
    timestamp = fields.DatetimeField(auto_now_add=True)
    level = fields.CharField(max_length=50)
    source = fields.CharField(max_length=100)
    message = fields.TextField()
    details = fields.JSONField(null=True)
    user_id = fields.IntField(null=True)

    class Meta:
        table = "logs"


class ShareLink(Model):
    id = fields.IntField(pk=True)
    token = fields.CharField(max_length=100, unique=True, index=True)
    name = fields.CharField(max_length=255)
    paths = fields.JSONField()
    user: fields.ForeignKeyRelation[UserAccount] = fields.ForeignKeyField(
        "models.UserAccount", related_name="shares", on_delete=fields.CASCADE
    )
    created_at = fields.DatetimeField(auto_now_add=True)
    expires_at = fields.DatetimeField(null=True)
    access_type = fields.CharField(max_length=20, default="public")
    hashed_password = fields.CharField(max_length=128, null=True)

    class Meta:
        table = "share_links"
