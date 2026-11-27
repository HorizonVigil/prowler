FROM python:3.12-slim
WORKDIR /opt/prowler
COPY pyproject.toml uv.lock ./
COPY README.md LICENSE ./
COPY prowler ./prowler
COPY prowler-cli.py ./prowler-cli.py
COPY horizonvigil_runner ./horizonvigil_runner
RUN pip install --no-cache-dir uv && uv sync --frozen --no-dev
ENV PYTHONPATH=/opt/prowler
ENV PATH="/opt/prowler/.venv/bin:$PATH"
ENV PYTHONUNBUFFERED=1
EXPOSE 8080
CMD ["python", "horizonvigil_runner/server.py"]
