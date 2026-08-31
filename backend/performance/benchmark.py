import sys
import os
import time
import statistics
from typing import List, Dict, Any

# Ensure app modules can be imported
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from fastapi.testclient import TestClient
from app.main import app
from app.database.database import SessionLocal
from app.database.models import User, Patient, UserRole

client = TestClient(app)

def setup_test_patient_headers() -> Dict[str, str]:
    db = SessionLocal()
    try:
        user = db.query(User).filter(User.email == "perf_patient@mediassist.app").first()
        if not user:
            user = User(
                email="perf_patient@mediassist.app",
                name="Performance Patient",
                role=UserRole.PATIENT,
                password_hash="hashed_perf_pass"
            )
            db.add(user)
            db.commit()
            db.refresh(user)

            patient = Patient(user_id=user.id)
            db.add(patient)
            db.commit()

        # Login to generate token
        from app.core.security import create_access_token
        token = create_access_token(subject=user.id, role="PATIENT", user_id=user.id)
        return {"Authorization": f"Bearer {token}"}
    finally:
        db.close()

def benchmark_endpoint(endpoint: str, headers: Dict[str, str], iterations: int = 100) -> Dict[str, Any]:
    durations = []
    status_codes = []
    
    # Warmup request
    client.get(endpoint, headers=headers)

    start_total = time.time()
    for _ in range(iterations):
        t0 = time.time()
        res = client.get(endpoint, headers=headers)
        t1 = time.time()
        durations.append((t1 - t0) * 1000)  # ms
        status_codes.append(res.status_code)
    total_time = time.time() - start_total

    durations_sorted = sorted(durations)
    p50 = statistics.median(durations_sorted)
    p95 = durations_sorted[int(len(durations_sorted) * 0.95)]
    p99 = durations_sorted[int(len(durations_sorted) * 0.99)]
    avg = statistics.mean(durations_sorted)
    throughput = iterations / total_time

    return {
        "endpoint": endpoint,
        "iterations": iterations,
        "p50_ms": round(p50, 2),
        "p95_ms": round(p95, 2),
        "p99_ms": round(p99, 2),
        "avg_ms": round(avg, 2),
        "throughput_req_sec": round(throughput, 2),
        "success_rate": round((status_codes.count(200) / iterations) * 100, 1)
    }

def main():
    print("=" * 70)
    print("MediAssist API Performance Benchmark Suite")
    print("=" * 70)

    headers = setup_test_patient_headers()

    endpoints = [
        "/api/v1/dashboard",
        "/api/v1/profile",
        "/api/v1/history",
        "/api/v1/health/ai"
    ]

    results = []
    for ep in endpoints:
        print(f"Benchmarking {ep} (100 iterations)...")
        res = benchmark_endpoint(ep, headers, iterations=100)
        results.append(res)
        print(f"  -> p50: {res['p50_ms']}ms | p95: {res['p95_ms']}ms | p99: {res['p99_ms']}ms | Throughput: {res['throughput_req_sec']} req/s")

    print("\nBenchmark Execution Complete.")
    print("=" * 70)

if __name__ == "__main__":
    main()
