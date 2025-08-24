from typing import Optional, Dict, Any
from models.database import Log

class LogService:
    @staticmethod
    async def _log(level: str, source: str, message: str, details: Optional[Dict[str, Any]] = None, user_id: Optional[int] = None):
        """通用日志记录方法"""
        await Log.create(
            level=level,
            source=source,
            message=message,
            details=details,
            user_id=user_id
        )

    @staticmethod
    async def info(source: str, message: str, details: Optional[Dict[str, Any]] = None, user_id: Optional[int] = None):
        """记录普通信息日志"""
        await LogService._log("INFO", source, message, details, user_id)

    @staticmethod
    async def warning(source: str, message: str, details: Optional[Dict[str, Any]] = None, user_id: Optional[int] = None):
        """记录警告日志"""
        await LogService._log("WARNING", source, message, details, user_id)

    @staticmethod
    async def error(source: str, message: str, details: Optional[Dict[str, Any]] = None, user_id: Optional[int] = None):
        """记录错误日志"""
        await LogService._log("ERROR", source, message, details, user_id)

    @staticmethod
    async def api(message: str, details: Optional[Dict[str, Any]] = None, user_id: Optional[int] = None):
        """专门记录API请求日志"""
        await LogService._log("API", "api_middleware", message, details, user_id)

    @staticmethod
    async def action(
        source: str,
        message: str,
        details: Optional[Dict[str, Any]] = None,
        user_id: Optional[int] = None,
    ):
        """记录用户操作日志"""
        await LogService._log("ACTION", source, message, details, user_id)
