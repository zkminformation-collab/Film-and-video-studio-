"""ZKMAP Studio's OpenJarvis API backed by a local llama.cpp process."""

from __future__ import annotations

import json
import os
import subprocess
import threading
import time
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen

from fastapi import HTTPException
from openjarvis.server.app import create_app
from starlette.responses import JSONResponse
from uvicorn import run

MODEL = "smollm2-360m-instruct"
LLAMA_URL = "http://127.0.0.1:8419"
EXPOSED_ROUTES = {"/health", "/v1/chat/completions"}
HOSTED_REPLY_LIMIT = 144


class StudioInferenceEngine:
    """Run one bounded text completion at a time on the free instance."""

    def __init__(self):
        self._slot = threading.Lock()

    def health(self):
        try:
            with urlopen(f"{LLAMA_URL}/health", timeout=2) as response:
                return response.status == 200
        except (URLError, TimeoutError):
            return False

    def generate(self, messages, *, model, temperature, max_tokens, **kwargs):
        if model != MODEL or kwargs.get("tools"):
            raise HTTPException(status_code=400, detail="Unsupported completion")
        if not self._slot.acquire(blocking=False):
            raise HTTPException(status_code=429, detail="Inference busy")
        try:
            return self._complete(messages, temperature, max_tokens)
        finally:
            self._slot.release()

    def _complete(self, messages, temperature, max_tokens):
        system = [msg for msg in messages if msg.role.value == "system"]
        conversation = [msg for msg in messages if msg.role.value != "system"]
        while len(conversation) > 1 and sum(len(msg.text) for msg in system + conversation) > 3600:
            conversation = conversation[2:]

        body = {
            "model": MODEL,
            "messages": [{"role": msg.role.value, "content": msg.text} for msg in system + conversation],
            "stream": False,
            "temperature": min(temperature, 0.55),
            "max_tokens": max(1, min(max_tokens, HOSTED_REPLY_LIMIT)),
        }
        request = Request(
            f"{LLAMA_URL}/v1/chat/completions",
            data=json.dumps(body).encode(),
            headers={"Content-Type": "application/json"},
        )
        try:
            with urlopen(request, timeout=85) as response:
                result = json.load(response)
        except HTTPError as error:
            status = 400 if error.code == 400 else 502
            raise HTTPException(status_code=status, detail="Inference request failed") from error
        except (URLError, TimeoutError) as error:
            raise HTTPException(status_code=503, detail="Inference unavailable") from error

        choice = result["choices"][0]
        return {
            "content": choice["message"]["content"],
            "finish_reason": choice["finish_reason"],
            "usage": result["usage"],
        }


def main():
    key = os.environ.get("OPENJARVIS_API_KEY", "")
    if len(key) < 32:
        raise RuntimeError("Configure an OpenJarvis API key of at least 32 characters")
    executable = os.getenv("OPENJARVIS_LLAMA_SERVER", "/opt/llama/llama-server")
    model_file = os.getenv("OPENJARVIS_MODEL_FILE", "/opt/models/smollm2.gguf")
    engine = StudioInferenceEngine()
    process = subprocess.Popen([
        executable, "--host", "127.0.0.1", "--port", "8419", "--model", model_file,
        "--alias", MODEL, "--ctx-size", "1536", "--batch-size", "32", "--ubatch-size", "32",
        "--parallel", "1", "--threads", "1", "--n-gpu-layers", "0", "--no-ui",
        "--cache-ram", "0", "--no-cache-prompt", "--no-repack",
    ])
    try:
        deadline = time.monotonic() + 75
        while not engine.health():
            if process.poll() is not None or time.monotonic() >= deadline:
                raise RuntimeError("The local model failed to start")
            time.sleep(0.5)

        jarvis = create_app(engine, MODEL, api_key=key)

        async def chat_service(scope, receive, send):
            if scope["type"] == "http" and scope["path"] not in EXPOSED_ROUTES:
                await JSONResponse({"detail": "Not found"}, status_code=404)(scope, receive, send)
            elif scope["type"] == "websocket":
                await send({"type": "websocket.close", "code": 1008})
            else:
                await jarvis(scope, receive, send)

        run(chat_service, host="0.0.0.0", port=int(os.getenv("PORT", "10000")))
    finally:
        if process.poll() is None:
            process.terminate()
            try:
                process.wait(timeout=5)
            except subprocess.TimeoutExpired:
                process.kill()
                process.wait()


if __name__ == "__main__":
    main()
