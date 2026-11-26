FROM python:3.12-slim
WORKDIR /opt/prowler
COPY pyproject.toml uv.lock ./
COPY prowler ./prowler
COPY prowler-cli.py ./prowler-cli.py
COPY horizonvigil_runner ./horizonvigil_runner
RUN pip install --no-cache-dir uv && uv sync --frozen --no-dev
ENV PYTHONPATH=/opt/prowler
ENV PYTHONUNBUFFERED=1
EXPOSE 8080
CMD ["python", "horizonvigil_runner/server.py"]
