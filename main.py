from services.config import VERSION, ConfigCenter
from services.adapters.registry import runtime_registry
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from db.session import close_db, init_db
from api.routers import include_routers
from fastapi import FastAPI
from services.middleware.logging_middleware import LoggingMiddleware
from services.middleware.exception_handler import global_exception_handler
from dotenv import load_dotenv
from services.task_queue import task_queue_service

load_dotenv()


@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_db()
    await runtime_registry.refresh()
    await ConfigCenter.set("APP_VERSION", VERSION)
    task_queue_service.start_worker()
    try:
        yield
    finally:
        await task_queue_service.stop_worker()
        await close_db()


def create_app() -> FastAPI:
    app = FastAPI(
        title="Foxel",
        description="AList-like virtual storage aggregator",
        lifespan=lifespan,
    )
    include_routers(app)
    app.add_middleware(LoggingMiddleware)
    app.add_exception_handler(Exception, global_exception_handler)
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
