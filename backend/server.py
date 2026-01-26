from fastapi import FastAPI, Request
from fastapi.responses import StreamingResponse, JSONResponse
from starlette.middleware.cors import CORSMiddleware
import httpx
import os
import logging
from dotenv import load_dotenv
from pathlib import Path

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

app = FastAPI()

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Next.js server URL (frontend server)
NEXTJS_URL = "http://localhost:3000"

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

# Proxy all /api/* requests to Next.js server
@app.api_route("/api/{path:path}", methods=["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"])
async def proxy_to_nextjs(request: Request, path: str):
    """Proxy all API requests to Next.js server"""
    try:
        # Build target URL
        target_url = f"{NEXTJS_URL}/api/{path}"
        
        # Get query params
        if request.query_params:
            target_url += f"?{request.query_params}"
        
        # Get request body for non-GET requests
        body = None
        if request.method in ["POST", "PUT", "PATCH"]:
            body = await request.body()
        
        # Forward headers (except Host)
        headers = dict(request.headers)
        headers.pop("host", None)
        headers.pop("Host", None)
        
        # Make request to Next.js
        async with httpx.AsyncClient(timeout=60.0) as client:
            response = await client.request(
                method=request.method,
                url=target_url,
                headers=headers,
                content=body
            )
            
            # Return response
            return StreamingResponse(
                iter([response.content]),
                status_code=response.status_code,
                headers=dict(response.headers),
                media_type=response.headers.get("content-type", "application/json")
            )
    except httpx.TimeoutException:
        logger.error(f"Timeout proxying to {target_url}")
        return JSONResponse({"error": "Request timeout"}, status_code=504)
    except Exception as e:
        logger.error(f"Error proxying to Next.js: {str(e)}")
        return JSONResponse({"error": str(e)}, status_code=500)

# Health check endpoint
@app.get("/health")
async def health_check():
    return {"status": "healthy", "proxy": "active", "target": NEXTJS_URL}

# Root endpoint
@app.get("/")
async def root():
    return {"message": "StarNews API Proxy", "target": NEXTJS_URL}
