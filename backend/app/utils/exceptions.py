from fastapi import HTTPException, Request, status
from fastapi.responses import JSONResponse

class AppException(HTTPException):
    def __init__(self, status_code: int, message: str = "", detail: str = ""):
        msg = message or detail or "An error occurred"
        super().__init__(status_code=status_code, detail=msg)
        self.status_code = status_code
        self.message = msg

async def app_exception_handler(request: Request, exc: AppException):
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "status": exc.status_code,
            "message": exc.message
        }
    )

async def http_exception_handler(request: Request, exc: HTTPException):
    # Handle standard FastAPI HTTPExceptions uniformly
    detail_msg = exc.detail if isinstance(exc.detail, str) else "An error occurred"
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "status": exc.status_code,
            "message": detail_msg
        }
    )
