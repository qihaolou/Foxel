FROM oven/bun:1.2-slim AS frontend-builder
WORKDIR /app/web
COPY web/package.json web/bun.lock ./
RUN bun install --frozen-lockfile
COPY web/ ./
RUN bun run build

FROM python:3.13-slim
WORKDIR /app

# 安装系统依赖
RUN apt-get update && apt-get install -y nginx git && rm -rf /var/lib/apt/lists/*

# 安装 Python 依赖
RUN pip install uv
COPY pyproject.toml uv.lock ./
RUN uv pip install --system . gunicorn

# 克隆仓库
RUN git clone https://github.com/DrizzleTime/FoxelUpgrade /app/migrate

# 复制前端构建产物
COPY --from=frontend-builder /app/web/dist /app/web/dist

# 复制应用代码
COPY . .

# 复制 Nginx 配置
COPY nginx.conf /etc/nginx/nginx.conf

# === 新增部分：创建所需目录并设置权限 ===
RUN mkdir -p data/db data/mount && \
    chmod 777 data/db data/mount
# ==========================================

# 暴露端口
EXPOSE 80

# 复制并设置启动脚本
COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

# 设置启动命令
CMD ["/entrypoint.sh"]
