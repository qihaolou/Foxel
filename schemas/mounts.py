from typing import Optional
from pydantic import BaseModel


class MountCreate(BaseModel):
    path: str
    adapter_id: int
    sub_path: Optional[str] = None
    enabled: bool = True

    @staticmethod
    def normalize(path: str) -> str:
        return (path if path.startswith('/') else '/' + path).rstrip('/') or '/'

    def model_post_init(self, __context):  
        self.path = self.normalize(self.path)


class MountOut(MountCreate):
    id: int

    class Config:
        from_attributes = True
