from fastapi import APIRouter, Depends, Body
from typing import Annotated
from services.processors.registry import get_config_schemas
from services.virtual_fs import process_file
from services.auth import get_current_active_user, User
from api.response import success
from pydantic import BaseModel

router = APIRouter(prefix="/api/processors", tags=["processors"])


@router.get("")
async def list_processors(
    current_user: Annotated[User, Depends(get_current_active_user)]
):
    schemas = get_config_schemas()
    out = []
    for t, meta in schemas.items():
        out.append({
            "type": meta["type"],
            "name": meta["name"],
            "supported_exts": meta.get("supported_exts", []),
            "config_schema": meta["config_schema"],
            "produces_file": meta.get("produces_file", False), 
        })
    return success(out)


class ProcessRequest(BaseModel):
    path: str
    processor_type: str
    config: dict
    save_to: str | None = None
    overwrite: bool = False


@router.post("/process")
async def process_file_with_processor(
    current_user: Annotated[User, Depends(get_current_active_user)],
    req: ProcessRequest = Body(...)
):
    save_to = req.path if req.overwrite else req.save_to
    result = await process_file(req.path, req.processor_type, req.config, save_to)
    return success(result)
