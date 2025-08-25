from __future__ import annotations
import io
import hashlib
from pathlib import Path
from typing import Tuple
from fastapi import HTTPException

ALLOWED_EXT = {"jpg", "jpeg", "png", "webp", "gif", "bmp", "tiff", "arw", "cr2", "cr3", "nef", "rw2", "orf", "pef", "dng"}
RAW_EXT = {"arw", "cr2", "cr3", "nef", "rw2", "orf", "pef", "dng"}
MAX_SOURCE_SIZE = 200 * 1024 * 1024
CACHE_ROOT = Path('data/.thumb_cache')


def is_image_filename(name: str) -> bool:
    parts = name.rsplit('.', 1)
    if len(parts) < 2:
        return False
    return parts[1].lower() in ALLOWED_EXT


def is_raw_filename(name: str) -> bool:
    parts = name.rsplit('.', 1)
    if len(parts) < 2:
        return False
    return parts[1].lower() in RAW_EXT


def _cache_key(adapter_id: int, rel: str, size: int, mtime: int, w: int, h: int, fit: str) -> str:
    raw = f"{adapter_id}|{rel}|{size}|{mtime}|{w}x{h}|{fit}".encode()
    return hashlib.sha1(raw).hexdigest()


def _cache_path(key: str) -> Path:
    sub = Path(key[:2]) / key[2:4]
    return CACHE_ROOT / sub / f"{key}.webp"


def _ensure_cache_dir(p: Path):
    p.parent.mkdir(parents=True, exist_ok=True)


def generate_thumb(data: bytes, w: int, h: int, fit: str, is_raw: bool = False) -> Tuple[bytes, str]:
    from PIL import Image
    if is_raw:
        try:
            import rawpy
            with rawpy.imread(io.BytesIO(data)) as raw:
                try:
                    thumb = raw.extract_thumb()
                except rawpy.LibRawNoThumbnailError:
                    thumb = None
                
                if thumb is not None and thumb.format in [rawpy.ThumbFormat.JPEG, rawpy.ThumbFormat.BITMAP]:
                    im = Image.open(io.BytesIO(thumb.data))
                else:
                    rgb = raw.postprocess(use_camera_wb=False, use_auto_wb=True, output_bps=8)
                    im = Image.fromarray(rgb)
        except Exception as e:
            print(f"rawpy processing failed: {e}")
            raise e

    else:
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
    stat = await adapter.stat_file(root, rel)
    if stat['size'] > MAX_SOURCE_SIZE:
         raise HTTPException(400, detail="Image too large for thumbnail")
    
    key = _cache_key(adapter_id, rel, stat['size'], int(stat['mtime']), w, h, fit)
    path = _cache_path(key)
    if path.exists():
        return path.read_bytes(), 'image/webp', key
    _ensure_cache_dir(path)
    read_data = await adapter.read_file(root, rel)
    try:
        thumb_bytes, mime = generate_thumb(read_data, w, h, fit, is_raw=is_raw_filename(rel))
    except Exception as e:
        print(e)
        raise HTTPException(500, detail=f"Thumbnail generation failed: {e}")
    path.write_bytes(thumb_bytes)
    return thumb_bytes, mime, key
