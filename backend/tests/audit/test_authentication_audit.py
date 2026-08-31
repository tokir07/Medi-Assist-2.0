import sys
import os
import pytest
from fastapi.testclient import TestClient

sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

from app.main import app

client = TestClient(app)

PROTECTED_ENDPOINTS = [
    ("GET", "/api/v1/dashboard"),
    ("GET", "/api/v1/profile"),
    ("PATCH", "/api/v1/profile"),
    ("GET", "/api/v1/history"),
    ("POST", "/api/v1/consultation"),
]

@pytest.mark.parametrize("method,path", PROTECTED_ENDPOINTS)
def test_unauthenticated_access_returns_401(method, path):
    if method == "GET":
        res = client.get(path)
    elif method == "PATCH":
        res = client.patch(path, json={})
    elif method == "POST":
        res = client.post(path, json={})
    
    assert res.status_code == 401, f"Expected 401 for unauthenticated {method} {path}, got {res.status_code}"

@pytest.mark.parametrize("method,path", PROTECTED_ENDPOINTS)
def test_invalid_token_returns_401(method, path):
    headers = {"Authorization": "Bearer invalid_jwt_token_123"}
    if method == "GET":
        res = client.get(path, headers=headers)
    elif method == "PATCH":
        res = client.patch(path, json={}, headers=headers)
    elif method == "POST":
        res = client.post(path, json={}, headers=headers)

    assert res.status_code == 401, f"Expected 401 for invalid token on {method} {path}, got {res.status_code}"
