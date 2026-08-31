import time
import uuid
import logging
from fastapi import Request
from starlette.middleware.base import BaseHTTPMiddleware

logger = logging.getLogger("mediassist.tracing")

class RequestTracingMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        # 1. Preserve or generate X-Request-ID
        request_id = request.headers.get("X-Request-ID") or str(uuid.uuid4())
        request.state.request_id = request_id

        # 2. Timing measurement
        start_time = time.time()
        
        response = await call_next(request)
        
        duration_ms = (time.time() - start_time) * 1000

        # 3. Add response tracing headers
        response.headers["X-Request-ID"] = request_id
        response.headers["X-Process-Time"] = f"{duration_ms / 1000:.4f}"

        # 4. Structured logging without sensitive payloads
        logger.info(
            f"{request.method} {request.url.path} -> HTTP {response.status_code} "
            f"({duration_ms:.1f}ms) [req_id={request_id}]"
        )

        return response
