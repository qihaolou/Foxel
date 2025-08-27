from tortoise.transactions import in_transaction
from models.database import (
    StorageAdapter,
    Mount,
    UserAccount,
    AutomationTask,
    ShareLink,
    Configuration,
)
from services.config import VERSION


class BackupService:
    @staticmethod
    async def export_data():
        """
        导出所有相关数据到JSON格式。
        """
        async with in_transaction() as conn:
            adapters = await StorageAdapter.all().values()
            mounts = await Mount.all().values()
            users = await UserAccount.all().values()
            tasks = await AutomationTask.all().values()
            shares = await ShareLink.all().values()
            configs = await Configuration.all().values()

        for share in shares:
            share["created_at"] = share["created_at"].isoformat(
            ) if share.get("created_at") else None
            share["expires_at"] = share["expires_at"].isoformat(
            ) if share.get("expires_at") else None

        return {
            "version": VERSION,
            "storage_adapters": list(adapters),
            "mounts": list(mounts),
            "user_accounts": list(users),
            "automation_tasks": list(tasks),
            "share_links": list(shares),
            "configurations": list(configs),
        }

    @staticmethod
    async def import_data(data: dict):
        """
        从JSON数据导入到数据库。
        """
        async with in_transaction() as conn:
            await ShareLink.all().using_db(conn).delete()
            await AutomationTask.all().using_db(conn).delete()
            await Mount.all().using_db(conn).delete()
            await StorageAdapter.all().using_db(conn).delete()
            await UserAccount.all().using_db(conn).delete()
            await Configuration.all().using_db(conn).delete()

            if data.get("configurations"):
                await Configuration.bulk_create(
                    [Configuration(**c) for c in data["configurations"]],
                    using_db=conn
                )

            if data.get("user_accounts"):
                await UserAccount.bulk_create(
                    [UserAccount(**u) for u in data["user_accounts"]],
                    using_db=conn
                )

            if data.get("storage_adapters"):
                await StorageAdapter.bulk_create(
                    [StorageAdapter(**a) for a in data["storage_adapters"]],
                    using_db=conn
                )

            if data.get("mounts"):
                await Mount.bulk_create(
                    [Mount(**m) for m in data["mounts"]],
                    using_db=conn
                )

            if data.get("automation_tasks"):
                await AutomationTask.bulk_create(
                    [AutomationTask(**t) for t in data["automation_tasks"]],
                    using_db=conn
                )

            if data.get("share_links"):
                await ShareLink.bulk_create(
                    [ShareLink(**s) for s in data["share_links"]],
                    using_db=conn
                )
