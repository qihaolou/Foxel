from fastapi import APIRouter, Depends, HTTPException
from services.auth import get_current_active_user
from models.database import UserAccount
from services.vector_db import VectorDBService
from api.response import success

router = APIRouter(prefix="/api/vector-db", tags=["vector-db"])


@router.post("/clear-all", summary="清空向量数据库")
async def clear_vector_db(user: UserAccount = Depends(get_current_active_user)):
    if user.username != 'admin':
        raise HTTPException(status_code=403, detail="仅管理员可操作")
    try:
        service = VectorDBService()
        service.clear_all_data()
        return success(msg="向量数据库已清空")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))