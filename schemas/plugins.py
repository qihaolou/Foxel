from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field


class PluginCreate(BaseModel):
    url: str = Field(min_length=1)
    enabled: bool = True


class PluginOut(BaseModel):
    id: int
    url: str
    enabled: bool
    key: Optional[str]
    name: Optional[str]
    version: Optional[str]
    supported_exts: Optional[List[str]]
    default_bounds: Optional[Dict[str, Any]]
    default_maximized: Optional[bool]
    icon: Optional[str]
    description: Optional[str]
    author: Optional[str]
    website: Optional[str]
    github: Optional[str]

    class Config:
        from_attributes = True
