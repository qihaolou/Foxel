import httpx
from typing import List
from services.config import ConfigCenter

async def describe_image_base64(base64_image: str, detail: str = "high") -> str:
    """
    传入base64图片和文本提示，返回图片描述文本。
    """
    OAI_API_URL = await ConfigCenter.get("AI_API_URL", "https://api.siliconflow.cn/v1/chat/completions")
    VISION_MODEL = await ConfigCenter.get("AI_VISION_MODEL", "Qwen/Qwen2.5-VL-32B-Instruct")
    API_KEY = await ConfigCenter.get("AI_API_KEY", "")
    payload = {
        "model": VISION_MODEL,
        "messages": [
            {"role": "user", "content": [
                {
                    "type": "image_url",
                    "image_url": {
                        "url": f"data:image/jpeg;base64,{base64_image}",
                        "detail": detail
                    }
                },
                {
                    "type": "text",
                    "text": "描述这个图片"
                }
            ]}
        ]
    }
    headers = {
        "Authorization": f"Bearer {API_KEY}",
        "Content-Type": "application/json"
    }
    try:
        async with httpx.AsyncClient(timeout=60.0) as client:
            resp = await client.post(OAI_API_URL, headers=headers, json=payload)
            resp.raise_for_status()
            result = resp.json()
            return result["choices"][0]["message"]["content"]
    except httpx.ReadTimeout:
        return "请求超时，请稍后重试。"
    except Exception as e:
        return f"请求失败: {str(e)}"

async def get_text_embedding(text: str) -> List[float]:
    """
    传入文本，返回嵌入向量。
    """
    OAI_API_URL = await ConfigCenter.get("AI_API_URL", "https://api.siliconflow.cn/v1/chat/completions")
    EMBED_MODEL = await ConfigCenter.get("AI_EMBED_MODEL", "Qwen/Qwen3-Embedding-8B")
    API_KEY = await ConfigCenter.get("AI_API_KEY", "")
    payload = {
        "model": EMBED_MODEL,
        "input": text
    }
    headers = {
        "Authorization": f"Bearer {API_KEY}",
        "Content-Type": "application/json"
    }
    async with httpx.AsyncClient() as client:
        resp = await client.post(OAI_API_URL.replace("chat/completions", "embeddings"), headers=headers, json=payload)
        resp.raise_for_status()
        result = resp.json()
        return result["data"][0]["embedding"]
