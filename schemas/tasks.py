from pydantic import BaseModel
from typing import Optional, Dict, Any


class AutomationTaskBase(BaseModel):
    name: str
    event: str
    path_pattern: Optional[str] = None
    filename_regex: Optional[str] = None
    processor_type: str
    processor_config: Dict[str, Any] = {}
    enabled: bool = True


class AutomationTaskCreate(AutomationTaskBase):
    pass


class AutomationTaskUpdate(AutomationTaskBase):
    name: Optional[str] = None
    event: Optional[str] = None
    processor_type: Optional[str] = None
    processor_config: Optional[Dict[str, Any]] = None
    enabled: Optional[bool] = None


class AutomationTaskRead(AutomationTaskBase):
    id: int

    class Config:
        from_attributes = True
