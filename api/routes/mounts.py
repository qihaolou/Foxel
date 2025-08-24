from fastapi import APIRouter, HTTPException, Depends
from typing import Annotated

from models import StorageAdapter, Mount
from schemas import MountCreate, MountOut
from api.response import success
from services.auth import get_current_active_user, User
from services.logging import LogService

router = APIRouter(prefix="/api/mounts", tags=["mounts"])


@router.post("")
async def create_mount(
    data: MountCreate,
    current_user: Annotated[User, Depends(get_current_active_user)],
):
    adapter = await StorageAdapter.get_or_none(id=data.adapter_id)
    if not adapter:
        raise HTTPException(400, detail="Adapter not found")
    rec = await Mount.create(
        path=MountCreate.normalize(data.path),
        adapter=adapter,
        sub_path=data.sub_path,
        enabled=data.enabled,
    )
    await LogService.action(
        "route:mounts",
        f"Created mount {rec.path}",
        details=data.model_dump(),
        user_id=current_user.id if hasattr(current_user, "id") else None,
    )
    return success(rec)


@router.get("")
async def list_mounts(
    current_user: Annotated[User, Depends(get_current_active_user)],
):
    recs = await Mount.all()
    return success(recs)


@router.put("/{mount_id}")
async def update_mount(
    mount_id: int,
    data: MountCreate,
    current_user: Annotated[User, Depends(get_current_active_user)],
):
    rec = await Mount.get_or_none(id=mount_id)
    if not rec:
        raise HTTPException(404, detail="Not found")
    adapter = await StorageAdapter.get_or_none(id=data.adapter_id)
    if not adapter:
        raise HTTPException(400, detail="Adapter not found")
    rec.path = MountCreate.normalize(data.path)
    rec.adapter = adapter
    rec.sub_path = data.sub_path
    rec.enabled = data.enabled
    await rec.save()
    await LogService.action(
        "route:mounts",
        f"Updated mount {rec.path}",
        details=data.model_dump(),
        user_id=current_user.id if hasattr(current_user, "id") else None,
    )
    return success(rec)


@router.delete("/{mount_id}")
async def delete_mount(
    mount_id: int,
    current_user: Annotated[User, Depends(get_current_active_user)],
):
    deleted = await Mount.filter(id=mount_id).delete()
    if not deleted:
        raise HTTPException(404, detail="Not found")
    await LogService.action(
        "route:mounts",
        f"Deleted mount {mount_id}",
        details={"mount_id": mount_id},
        user_id=current_user.id if hasattr(current_user, "id") else None,
    )
    return success({"deleted": True})
