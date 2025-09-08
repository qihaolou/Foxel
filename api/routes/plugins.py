from typing import List, Any, Dict
from fastapi import APIRouter, HTTPException, Body
from models import database
from schemas import PluginCreate, PluginOut

router = APIRouter(prefix="/api/plugins", tags=["plugins"])


@router.post("", response_model=PluginOut)
async def create_plugin(payload: PluginCreate):
    rec = await database.Plugin.create(
        url=payload.url,
        enabled=payload.enabled,
    )
    return PluginOut.model_validate(rec)


@router.get("", response_model=List[PluginOut])
async def list_plugins():
    rows = await database.Plugin.all().order_by("-id")
    return [PluginOut.model_validate(r) for r in rows]


@router.delete("/{plugin_id}")
async def delete_plugin(plugin_id: int):
    rec = await database.Plugin.get_or_none(id=plugin_id)
    if not rec:
        raise HTTPException(status_code=404, detail="Plugin not found")
    await rec.delete()
    return {"code": 0, "msg": "ok"}


@router.put("/{plugin_id}", response_model=PluginOut)
async def update_plugin(plugin_id: int, payload: PluginCreate):
    rec = await database.Plugin.get_or_none(id=plugin_id)
    if not rec:
        raise HTTPException(status_code=404, detail="Plugin not found")
    rec.url = payload.url
    rec.enabled = payload.enabled
    await rec.save()
    return PluginOut.model_validate(rec)


@router.post("/{plugin_id}/metadata", response_model=PluginOut)
async def update_manifest(plugin_id: int, manifest: Dict[str, Any] = Body(...)):
    rec = await database.Plugin.get_or_none(id=plugin_id)
    if not rec:
        raise HTTPException(status_code=404, detail="Plugin not found")
    key_map = {
        'key': 'key',
        'name': 'name',
        'version': 'version',
        'supported_exts': 'supported_exts',
        'supportedExts': 'supported_exts',
        'default_bounds': 'default_bounds',
        'defaultBounds': 'default_bounds',
        'default_maximized': 'default_maximized',
        'defaultMaximized': 'default_maximized',
        'icon': 'icon',
        'description': 'description',
        'author': 'author',
        'website': 'website',
        'github': 'github',
    }
    for k, v in list(manifest.items()):
        if v is None:
            continue
        attr = key_map.get(k)
        if not attr:
            continue
        setattr(rec, attr, v)
    await rec.save()
    return PluginOut.model_validate(rec)
