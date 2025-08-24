import pkgutil
import inspect
from importlib import import_module
from typing import Dict, Callable
from .base import BaseProcessor

ProcessorFactory = Callable[[], BaseProcessor]
TYPE_MAP: Dict[str, ProcessorFactory] = {}
CONFIG_SCHEMAS: Dict[str, dict] = {}

def discover_processors():
    import services.processors
    processors_pkg = services.processors
    TYPE_MAP.clear()
    CONFIG_SCHEMAS.clear()
    for modinfo in pkgutil.iter_modules(processors_pkg.__path__):
        if modinfo.name.startswith("_"):
            continue
        full_name = f"{processors_pkg.__name__}.{modinfo.name}"
        try:
            module = import_module(full_name)
        except Exception:
            continue
        processor_type = getattr(module, "PROCESSOR_TYPE", None)
        processor_name = getattr(module, "PROCESSOR_NAME", None)
        supported_exts = getattr(module, "SUPPORTED_EXTS", None)
        schema = getattr(module, "CONFIG_SCHEMA", None)
        factory = getattr(module, "PROCESSOR_FACTORY", None)
        if not processor_type:
            continue
        if factory is None:
            for attr in module.__dict__.values():
                if inspect.isclass(attr) and attr.__name__.endswith("Processor"):
                    def _mk(cls=attr):
                        return lambda: cls()
                    factory = _mk()
                    break
        if not callable(factory):
            continue
        TYPE_MAP[processor_type] = factory
        produces_file = getattr(module, "produces_file", None)
        if produces_file is None and hasattr(factory(), "produces_file"):
            produces_file = getattr(factory(), "produces_file")
        if isinstance(schema, list):
            CONFIG_SCHEMAS[processor_type] = {
                "type": processor_type,
                "name": processor_name or processor_type,
                "supported_exts": supported_exts or [],
                "config_schema": schema,
                "produces_file": produces_file if produces_file is not None else False
            }

def get_config_schemas() -> Dict[str, dict]:
    return CONFIG_SCHEMAS

def get_config_schema(processor_type: str):
    return CONFIG_SCHEMAS.get(processor_type)

def get(processor_type: str) -> BaseProcessor:
    factory = TYPE_MAP.get(processor_type)
    if factory:
        return factory()
    return None

discover_processors()
