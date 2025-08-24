from fastapi import APIRouter, Depends, Form
from typing import Annotated
from services.config import ConfigCenter
from services.auth import get_current_active_user, User, has_users
from api.response import success

router = APIRouter(prefix="/api/config", tags=["config"])


@router.get("/")
async def get_config(
    current_user: Annotated[User, Depends(get_current_active_user)],
    key: str
):
    value = await ConfigCenter.get(key)
    return success({"key": key, "value": value})


@router.post("/")
async def set_config(
    current_user: Annotated[User, Depends(get_current_active_user)],
    key: str = Form(...),
    value: str = Form(...)
):
    await ConfigCenter.set(key, value)
    return success({"key": key, "value": value})


@router.get("/all")
async def get_all_config(
    current_user: Annotated[User, Depends(get_current_active_user)]
):
    configs = await ConfigCenter.get_all()
    return success(configs)


@router.get("/status")
async def get_system_status():
    system_info = {
        "version": "1.0.0",
        "title":  await ConfigCenter.get("APP_NAME", "Foxel"),
        "logo": await ConfigCenter.get("APP_LOGO", "/logo.svg"),
        "is_initialized": await has_users()
    }
    return success(system_info)
