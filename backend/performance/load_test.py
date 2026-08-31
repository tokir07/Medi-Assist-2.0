import sys
import os
import time
import asyncio
import httpx
from typing import Dict, Any

# Ensure app modules can be imported
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.database.database import SessionLocal
from app.database.models import User, Patient, UserRole
from app.core.security import create_access_token

def get_auth_token() -> str:
    db = SessionLocal()
    try:
        user = db.query(User).filter(User.email == "load_test@mediassist.app").first()
        if not user:
            user = User(
                email="load_test@mediassist.app",
                name="Load Test Patient",
                role=UserRole.PATIENT,
                password_hash="hashed_pass"
            )
            db.add(user)
            db.commit()
            db.refresh(user)

            patient = Patient(user_id=user.id)
            db.add(patient)
            db.commit()

        return create_access_token(subject=user.id, role="PATIENT", user_id=user.id)
    finally:
        db.close()

async def send_request(client: httpx.AsyncClient, url: str, headers: Dict[str, str]) -> float:
    t0 = time.time()
    res = await client.get(url, headers=headers)
    t1 = time.time()
    return (t1 - t0) * 1000  # ms

async def run_load_test(base_url: str, concurrency: int = 25, total_requests: int = 100):
    token = get_auth_token()
    headers = {"Authorization": f"Bearer {token}"}
    target_url = f"{base_url}/api/v1/dashboard"

    print(f"Starting Load Test: Concurrency={concurrency}, Total Requests={total_requests}")
    start_time = time.time()

    async with httpx.AsyncClient(timeout=10.0) as client:
        tasks = []
        for _ in range(total_requests):
            tasks.append(send_request(client, target_url, headers))

        durations = await asyncio.gather(*tasks, return_exceptions=True)

    total_time = time.time() - start_time
    valid_durations = [d for d in durations if isinstance(d, (int, float))]
    
    valid_durations.sort()
    p50 = valid_durations[len(valid_durations) // 2]
    p95 = valid_durations[int(len(valid_durations) * 0.95)]
    p99 = valid_durations[int(len(valid_durations) * 0.99)]
    throughput = len(valid_durations) / total_time

    print(f"Load Test Completed in {total_time:.2f}s")
    print(f"  - Throughput: {throughput:.2f} req/sec")
    print(f"  - p50 Latency: {p50:.2f} ms")
    print(f"  - p95 Latency: {p95:.2f} ms")
    print(f"  - p99 Latency: {p99:.2f} ms")

if __name__ == "__main__":
    asyncio.run(run_load_test(base_url="http://127.0.0.1:8000", concurrency=25, total_requests=100))
