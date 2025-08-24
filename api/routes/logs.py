from typing import Optional
from fastapi import APIRouter, Query
from models.database import Log
from api.response import page, success
from tortoise.expressions import Q
from datetime import datetime

router = APIRouter(prefix="/api/logs", tags=["Logs"])

@router.get("")
async def get_logs(
    page_num: int = Query(1, alias="page"),
    page_size: int = Query(20, alias="page_size"),
    level: Optional[str] = Query(None),
    source: Optional[str] = Query(None),
    start_time: Optional[datetime] = Query(None),
    end_time: Optional[datetime] = Query(None),
):
    """获取日志列表，支持分页和筛选"""
    query = Log.all()
    if level:
        query = query.filter(level=level)
    if source:
        query = query.filter(source__icontains=source)
    if start_time:
        query = query.filter(timestamp__gte=start_time)
    if end_time:
        query = query.filter(timestamp__lte=end_time)

    total = await query.count()
    logs = await query.order_by("-timestamp").offset((page_num - 1) * page_size).limit(page_size)

    return success(page([log for log in logs], total, page_num, page_size))

@router.delete("")
async def clear_logs(
    start_time: Optional[datetime] = Query(None),
    end_time: Optional[datetime] = Query(None),
):
    """清理指定时间范围内的日志"""
    query = Log.all()
    if start_time:
        query = query.filter(timestamp__gte=start_time)
    if end_time:
        query = query.filter(timestamp__lte=end_time)
    
    deleted_count = await query.delete()
    return success({"deleted_count": deleted_count})
