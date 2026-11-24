FROM python:3.12-slim-bookworm AS downloads

RUN apt-get update \
    && apt-get install -y --no-install-recommends ca-certificates curl \
    && rm -rf /var/lib/apt/lists/*

RUN mkdir -p /opt/llama /opt/models \
    && curl -fsSL --retry 3 --max-time 180 \
      https://github.com/ggml-org/llama.cpp/releases/download/b12648/llama-b12648-bin-ubuntu-x64.tar.gz \
      -o /tmp/llama.tar.gz \
    && echo '646653127f3638e979b08eb6711b73dd005f253901ce5b2268d05aedc307d8e1  /tmp/llama.tar.gz' | sha256sum -c - \
    && tar -xzf /tmp/llama.tar.gz -C /opt/llama --strip-components=1 \
    && find /opt/llama -maxdepth 1 -type f ! -name '*.so*' ! -name 'llama-server' ! -name 'LICENSE' -delete \
    && curl -fsSL --retry 3 --max-time 240 \
      https://huggingface.co/bartowski/SmolLM2-360M-Instruct-GGUF/resolve/7be6f65f1db715fe5dc5a4634c0d459b4eed42ec/SmolLM2-360M-Instruct-IQ4_XS.gguf \
      -o /opt/models/smollm2.gguf \
    && echo '33bf63c32304b217f8bcc5b47dcb1d325b356e21282e42c758eee25c0dd83bf5  /opt/models/smollm2.gguf' | sha256sum -c -

FROM python:3.12-slim-bookworm AS service

RUN apt-get update \
    && apt-get install -y --no-install-recommends libgomp1 libzstd1 \
    && rm -rf /var/lib/apt/lists/* \
    && pip install --no-cache-dir 'OpenJarvis[server]==1.0.4' \
    && useradd --create-home --uid 10001 jarvis

COPY --from=downloads /opt/llama /opt/llama
COPY --from=downloads /opt/models /opt/models
WORKDIR /app
COPY service.py /app/service.py

ENV OPENJARVIS_HOME=/home/jarvis/.openjarvis PYTHONUNBUFFERED=1 OMP_NUM_THREADS=1 OPENBLAS_NUM_THREADS=1
USER jarvis
EXPOSE 10000

CMD ["python", "/app/service.py"]
