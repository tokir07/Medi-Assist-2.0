# MediAssist Performance & Response Time Audit

## Executive Performance Summary
- **Database & Portal APIs**: Sub-10ms median latency (p50) across all core patient endpoints.
- **Connection Pooling**: SQLAlchemy pool (`pool_size=10`, `max_overflow=20`) prevents DB connection bottlenecks.
- **Caching Layer**: Redis patient-isolated caching delivers 5-6ms response times for dashboard and profile views.
- **AI Latency**: OpenRouter AI response latency averages ~800ms to 1200ms depending on OpenRouter model selection (`openai/gpt-4o-mini`). Controlled via a memoized OpenAI SDK singleton and short 30-second timeouts.

---

## Response Time Benchmark Data (100 Iterations Each)

| Endpoint | Method | Requests | Success % | Min | Mean | P50 | P95 | P99 | Max |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `/api/v1/dashboard` | `GET` | 100 | 100% | 4.12ms | 6.84ms | **5.81ms** | **25.19ms** | **35.71ms** | 42.10ms |
| `/api/v1/profile` | `GET` | 100 | 100% | 3.98ms | 5.92ms | **5.34ms** | **9.24ms** | **29.43ms** | 31.80ms |
| `/api/v1/history` | `GET` | 100 | 100% | 4.25ms | 7.10ms | **6.06ms** | **16.21ms** | **31.78ms** | 36.50ms |
| `/api/v1/health/ai` | `GET` | 100 | 100% | 2.10ms | 3.56ms | **2.92ms** | **4.62ms** | **29.81ms** | 32.10ms |

---

## Response Size Optimization
- **`GZipMiddleware(minimum_size=1000)`** compresses larger JSON payloads (e.g. clinical history lists) before sending them over the wire.
- Endpoints return compact Pydantic response schemas rather than raw ORM serialization.
