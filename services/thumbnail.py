from __future__ import annotations
import io
import hashlib
from pathlib import Path
from typing import Tuple
from fastapi import HTTPException

ALLOWED_EXT = {"jpg", "jpeg", "png", "webp", "gif", "bmp", "tiff"}
MAX_SOURCE_SIZE = 200 * 1024 * 1024
CACHE_ROOT = Path('data/.thumb_cache')


def is_image_filename(name: str) -> bool:
    parts = name.rsplit('.', 1)
    if len(parts) < 2:
        return False
    return parts[1].lower() in ALLOWED_EXT


def _cache_key(adapter_id: int, rel: str, size: int, mtime: int, w: int, h: int, fit: str) -> str:
    raw = f"{adapter_id}|{rel}|{size}|{mtime}|{w}x{h}|{fit}".encode()
    return hashlib.sha1(raw).hexdigest()


def _cache_path(key: str) -> Path:
    sub = Path(key[:2]) / key[2:4]
    return CACHE_ROOT / sub / f"{key}.webp"


def _ensure_cache_dir(p: Path):
    p.parent.mkdir(parents=True, exist_ok=True)


def generate_thumb(data: bytes, w: int, h: int, fit: str) -> Tuple[bytes, str]:
    from PIL import Image
    im = Image.open(io.BytesIO(data))
    if im.mode not in ("RGB", "RGBA"):
        im = im.convert("RGBA" if im.mode in ("P", "LA") else "RGB")
    if fit == 'cover':
        im_ratio = im.width / im.height
        target_ratio = w / h
        if im_ratio > target_ratio:
            new_h = h
            new_w = int(h * im_ratio)
        else:
            new_w = w
            new_h = int(w / im_ratio)
        im = im.resize((new_w, new_h))
        left = max(0, (im.width - w)//2)
        top = max(0, (im.height - h)//2)
        im = im.crop((left, top, left + w, top + h))
    else:
        im.thumbnail((w, h))
    buf = io.BytesIO()
    im.save(buf, 'WEBP', quality=80)
    return buf.getvalue(), 'image/webp'


async def get_or_create_thumb(adapter, adapter_id: int, root: str, rel: str, w: int, h: int, fit: str = 'cover'):
    read_data = await adapter.read_file(root, rel)
    if len(read_data) > MAX_SOURCE_SIZE:
        raise HTTPException(404, detail="Image too large for thumbnail")
    key = _cache_key(adapter_id, rel, len(read_data), 0, w, h, fit)
    path = _cache_path(key)
    if path.exists():
        return path.read_bytes(), 'image/webp', key
    _ensure_cache_dir(path)
    try:
        thumb_bytes, mime = generate_thumb(read_data, w, h, fit)
    except Exception as e:
        raise HTTPException(500, detail=f"Thumbnail generation failed: {e}")
    path.write_bytes(thumb_bytes)
    return thumb_bytes, mime, key
