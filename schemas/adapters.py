from typing import Dict, Optional
from pydantic import BaseModel, Field, field_validator


class AdapterBase(BaseModel):
    name: str
    type: str = Field(pattern=r"^[a-zA-Z0-9_]+$")
    config: Dict = Field(default_factory=dict)
    enabled: bool = True
    path: str = None
    sub_path: Optional[str] = None


class AdapterCreate(AdapterBase):
    @staticmethod
    def normalize_mount_path(p: str) -> str:
        p = p.strip()
        if not p.startswith('/'):
            p = '/' + p
        p = p.rstrip('/')
        return p or '/'

    @field_validator("path")
    def _v_mount(cls, v: str):
        if not v:
            raise ValueError("mount_path required")
        return cls.normalize_mount_path(v)


class AdapterOut(AdapterBase):
    id: int
    path: str = None
    sub_path: Optional[str] = None

    class Config:
        from_attributes = True
