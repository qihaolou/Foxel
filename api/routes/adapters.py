from fastapi import APIRouter, HTTPException, Depends
from tortoise.transactions import in_transaction
from typing import Annotated

from models import StorageAdapter, Mount
from schemas import AdapterCreate, AdapterOut
from services.auth import get_current_active_user, User
from services.adapters.registry import runtime_registry, get_config_schemas
from api.response import success
from services.logging import LogService

router = APIRouter(prefix="/api/adapters", tags=["adapters"])


def validate_and_normalize_config(adapter_type: str, cfg):
    schemas = get_config_schemas()
    if not isinstance(cfg, dict):
        raise HTTPException(400, detail="config 必须是对象")
    schema = schemas.get(adapter_type)
    if not schema:
        raise HTTPException(400, detail=f"不支持的适配器类型: {adapter_type}")
    out = {}
    missing = []
    for f in schema:
        k = f["key"]
        if k in cfg and cfg[k] not in (None, ""):
            out[k] = cfg[k]
        elif "default" in f:
            out[k] = f["default"]
        elif f.get("required"):
            missing.append(k)
    if missing:
        raise HTTPException(400, detail="缺少必填配置字段: " + ", ".join(missing))
    return out


@router.post("")
async def create_adapter(
    data: AdapterCreate,
    current_user: Annotated[User, Depends(get_current_active_user)]
):
    adapter_fields = {
        "name": data.name,
        "type": data.type,
        "config": validate_and_normalize_config(data.type, data.config or {}),
        "enabled": data.enabled,
    }
    norm_path = AdapterCreate.normalize_mount_path(data.mount_path)
    exists = await Mount.get_or_none(path=norm_path)
    if exists:
        raise HTTPException(400, detail="Mount path already exists")
    async with in_transaction():
        rec = await StorageAdapter.create(**adapter_fields)
        await Mount.create(
            path=norm_path,
            sub_path=data.sub_path,
            adapter=rec,
            enabled=True,
        )
    rec.mount_path = norm_path
    rec.sub_path = data.sub_path
    await runtime_registry.refresh()
    await LogService.action(
        "route:adapters",
        f"Created adapter {rec.name}",
        details=adapter_fields,
        user_id=current_user.id if hasattr(current_user, "id") else None,
    )
    return success(rec)


@router.get("")
async def list_adapters(
    current_user: Annotated[User, Depends(get_current_active_user)]
):
    adapters = await StorageAdapter.all().prefetch_related("mounts")
    out = []
    for a in adapters:
        mount = a.mounts[0] if a.mounts else None
        item = AdapterOut(
            name=a.name,
            type=a.type,
            config=a.config,
            enabled=a.enabled,
            id=a.id,
            mount_path=mount.path if mount else None,
            sub_path=mount.sub_path if mount else None
        )
        out.append(item)
    return success(out)


@router.get("/available")
async def available_adapter_types(
    current_user: Annotated[User, Depends(get_current_active_user)]
):
    data = []
    for t, fields in get_config_schemas().items():
        data.append({
            "type": t,
            "name": "本地文件系统" if t == "local" else ("WebDAV" if t == "webdav" else t),
            "config_schema": fields,
        })
    return success(data)


@router.get("/{adapter_id}")
async def get_adapter(
    adapter_id: int,
    current_user: Annotated[User, Depends(get_current_active_user)]
):
    rec = await StorageAdapter.get_or_none(id=adapter_id).prefetch_related("mounts")
    if not rec:
        raise HTTPException(404, detail="Not found")
    mount = rec.mounts[0] if rec.mounts else None
    rec.mount_path = mount.path if mount else None
    rec.sub_path = mount.sub_path if mount else None
    return success(rec)


@router.put("/{adapter_id}")
async def update_adapter(
    adapter_id: int,
    data: AdapterCreate,
    current_user: Annotated[User, Depends(get_current_active_user)]
):

    rec = await StorageAdapter.get_or_none(id=adapter_id).prefetch_related("mounts")
    if not rec:
        raise HTTPException(404, detail="Not found")
    norm_path = AdapterCreate.normalize_mount_path(data.mount_path)
    existing = await Mount.get_or_none(path=norm_path)
    mount = rec.mounts[0] if rec.mounts else None
    if existing and (not mount or existing.id != mount.id):
        raise HTTPException(400, detail="Mount path already exists")
    rec.name = data.name
    rec.type = data.type
    rec.config = validate_and_normalize_config(data.type, data.config or {})
    rec.enabled = data.enabled
    await rec.save()
    if mount:
        mount.path = norm_path
        mount.sub_path = data.sub_path
        await mount.save()
    else:
        mount = await Mount.create(
            path=norm_path,
            sub_path=data.sub_path,
            adapter=rec,
            enabled=True,
        )
    rec.mount_path = mount.path
    rec.sub_path = mount.sub_path
    await runtime_registry.refresh()
    await LogService.action(
        "route:adapters",
        f"Updated adapter {rec.name}",
        details=data.model_dump(),
        user_id=current_user.id if hasattr(current_user, "id") else None,
    )
    return success(rec)


@router.delete("/{adapter_id}")
async def delete_adapter(
    adapter_id: int,
    current_user: Annotated[User, Depends(get_current_active_user)]
):
    deleted = await StorageAdapter.filter(id=adapter_id).delete()
    if not deleted:
        raise HTTPException(404, detail="Not found")
    await runtime_registry.refresh()
    await LogService.action(
        "route:adapters",
        f"Deleted adapter {adapter_id}",
        details={"adapter_id": adapter_id},
        user_id=current_user.id if hasattr(current_user, "id") else None,
    )
    return success({"deleted": True})
