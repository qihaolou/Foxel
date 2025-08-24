import re
from typing import List
from models.database import AutomationTask
from services.processors.registry import get as get_processor
from services.logging import LogService

class TaskService:
    async def trigger_tasks(self, event: str, path: str):
        tasks = await AutomationTask.filter(event=event, enabled=True)
        for task in tasks:
            if self.match(task, path):
                await self.execute(task, path)

    def match(self, task: AutomationTask, path: str) -> bool:
        if task.path_pattern and not path.startswith(task.path_pattern):
            return False
        if task.filename_regex:
            filename = path.split('/')[-1]
            if not re.match(task.filename_regex, filename):
                return False
        return True

    async def execute(self, task: AutomationTask, path: str):
        from services.virtual_fs import read_file, write_file

        processor = get_processor(task.processor_type)
        if not processor:
            print(f"Processor {task.processor_type} not found for task {task.id}")
            return

        try:
            file_content = await read_file(path)
            result = await processor.process(file_content, path, task.processor_config)
            
            save_to = task.processor_config.get("save_to")
            if save_to and getattr(processor, "produces_file", False):
                await write_file(save_to, result)

        except Exception as e:
            error_message = f"Error executing task {task.id} for path {path}: {e}"
            print(error_message)
            await LogService.error(
                source=f"task_executor:{task.id}",
                message=error_message,
                details={"task_name": task.name, "event": task.event, "path": path, "processor": task.processor_type}
            )

task_service = TaskService()