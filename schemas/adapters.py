from typing import Dict, Optional
from pydantic import BaseModel, Field, validator


class AdapterCreate(BaseModel):
    name: str
    type: str = Field(pattern=r"^[a-zA-Z0-9_]+$")
    config: Dict = Field(default_factory=dict)
    enabled: bool = True
    mount_path: str  
    sub_path: Optional[str] = None  

    @staticmethod
    def normalize_mount_path(p: str) -> str:
        p = p.strip()
        if not p.startswith('/'):
            p = '/' + p
        p = p.rstrip('/')
        return p or '/'

    @validator("mount_path")
    def _v_mount(cls, v: str):
        if not v:
            raise ValueError("mount_path required")
        return cls.normalize_mount_path(v)


class AdapterOut(AdapterCreate):
    id: int

    class Config:
        from_attributes = True
