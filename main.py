from dotenv import load_dotenv

load_dotenv()

from fastapi import FastAPI
from api.routers import include_routers
from db.session import close_db, init_db
from contextlib import asynccontextmanager
from fastapi.middleware.cors import CORSMiddleware
from api.middleware import LoggingMiddleware
from services.adapters.registry import runtime_registry


@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_db()
    await runtime_registry.refresh()
    try:
        yield
    finally:
        await close_db()


def create_app() -> FastAPI:
    app = FastAPI(
        title="Foxel",
        description="AList-like virtual storage aggregator",
        lifespan=lifespan,
    )
    include_routers(app)
    app.add_middleware(LoggingMiddleware)
    return app


app = create_app()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
