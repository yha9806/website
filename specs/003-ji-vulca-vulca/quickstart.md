# VULCA Integration Quickstart

## Prerequisites
- Node.js 18+ and npm 9+
- Python 3.11+
- PostgreSQL 14+
- Redis 7+
- Docker (optional, for containerized testing)

## Backend Setup

### 1. Install Dependencies
```bash
cd wenxin-backend
pip install -r requirements.txt -c constraints.txt
```

### 2. Run Database Migrations
```bash
alembic upgrade head
python scripts/populate_vulca_dimensions.py
```

### 3. Start Backend Services
```bash
# Terminal 1: Start API server
uvicorn app.main:app --reload --port 8001

# Terminal 2: Start Celery worker for batch processing
celery -A app.celery worker --loglevel=info

# Terminal 3: Start Celery beat for scheduled tasks
celery -A app.celery beat --loglevel=info
```

## Frontend Setup

### 1. Install Dependencies
```bash
cd wenxin-moyun
npm install --legacy-peer-deps
```

### 2. Configure Environment
```bash
# Create .env.local
echo "VITE_API_URL=http://localhost:8001" > .env.local
echo "VITE_VULCA_ENABLED=true" >> .env.local
```

### 3. Start Development Server
```bash
npm run dev
```

## Quick Validation Tests

### Test 1: View VULCA Dimensions (Free Tier)
1. Navigate to http://localhost:5173
2. Click on any model card
3. Verify: TOP 5 VULCA dimensions visible
4. Verify: "Upgrade for full analysis" message appears

### Test 2: Full VULCA Analysis (Paid Tier)
1. Login with paid tier account: `paid_user` / `test123`
2. Navigate to model details
3. Click "Expand All Dimensions"
4. Verify: All 47 dimensions visible with categories
5. Verify: Cultural perspectives section available

### Test 3: Real-time Updates (Enterprise Tier)
1. Login with enterprise account: `enterprise` / `test123`
2. Open model details
3. Click "Generate New Analysis"
4. Verify: Progress bar appears with stages
5. Verify: WebSocket updates dimension values in real-time

### Test 4: API Integration
```bash
# Get VULCA score for a model
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:8001/v2/models/{uuid}/vulca

# Get dimension definitions
curl http://localhost:8001/v2/vulca/dimensions

# Compare models (paid tier)
curl -X POST -H "Authorization: Bearer $PAID_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"model_uuids": ["uuid1", "uuid2"]}' \
  http://localhost:8001/v2/vulca/compare
```

## Running Tests

### Backend Tests
```bash
cd wenxin-backend

# Run VULCA-specific tests
pytest tests/test_vulca_api.py -v
pytest tests/test_vulca_algorithm.py -v
pytest tests/test_vulca_cache.py -v

# Run integration tests
pytest tests/integration/test_vulca_flow.py -v
```

### Frontend E2E Tests
```bash
cd wenxin-moyun

# Run VULCA UI tests
npm run test:e2e -- --grep="VULCA"

# Run with UI for debugging
npm run test:e2e:ui -- --grep="VULCA"
```

## Performance Validation

### Load Testing
```bash
# Install locust
pip install locust

# Run load test (simulates 100 concurrent users)
locust -f tests/load/vulca_load_test.py \
  --host=http://localhost:8001 \
  --users=100 --spawn-rate=10
```

### Expected Performance Metrics
- API Response Time: < 200ms (p95)
- VULCA Generation: < 30 seconds per model
- WebSocket Latency: < 100ms
- Cache Hit Rate: > 80%

## Monitoring

### Check Redis Cache
```bash
redis-cli
> KEYS vulca:*
> GET vulca:score:{model_uuid}:current
```

### Check Celery Tasks
```bash
celery -A app.celery inspect active
celery -A app.celery inspect scheduled
```

### View Logs
```bash
# API logs
tail -f logs/api.log | grep VULCA

# Celery logs
tail -f logs/celery.log | grep vulca_generation

# Frontend console (browser DevTools)
localStorage.setItem('debug', 'vulca:*')
```

## Common Issues

### Issue: VULCA scores not generating
**Solution**: Check Celery worker is running and Redis is accessible

### Issue: Dimensions showing as "undefined"
**Solution**: Run `npm run dev:clean` to clear Vite cache

### Issue: WebSocket connection failing
**Solution**: Ensure Socket.IO server is running on correct port

### Issue: Cultural perspectives not loading
**Solution**: Verify user tier in JWT claims includes 'paid' or 'enterprise'

## Production Deployment

### 1. Build Frontend
```bash
cd wenxin-moyun
npm run build
# Upload dist/ to Cloud Storage
```

### 2. Deploy Backend
```bash
cd wenxin-backend
docker build -t vulca-api .
docker push gcr.io/wenxin-moyun-prod-new/vulca-api
# Deploy to Cloud Run
```

### 3. Run Migrations
```bash
# Via Cloud Run Jobs
gcloud run jobs execute vulca-migration \
  --region=asia-east1
```

### 4. Verify Deployment
```bash
# Check health endpoint
curl https://wenxin-moyun-api.run.app/health/vulca

# Verify WebSocket endpoint
wscat -c wss://wenxin-moyun-api.run.app/v2/vulca/stream
```

## Success Criteria Checklist

- [ ] All 47 VULCA dimensions display correctly
- [ ] Tier-based access control working
- [ ] UUID migration completed without breaking existing features
- [ ] Snake_case standardization in API responses
- [ ] Cache invalidation triggers working
- [ ] Batch processing runs nightly at 3 AM UTC
- [ ] WebSocket real-time updates for enterprise tier
- [ ] Performance metrics meet requirements
- [ ] All tests passing (unit, integration, E2E)
- [ ] Production deployment successful