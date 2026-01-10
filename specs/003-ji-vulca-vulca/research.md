# Research: VULCA Deep Integration

## Algorithm Research

### VULCA Core Algorithm
**Decision**: Implement intelligent 6D→47D expansion using weighted mapping algorithm  
**Rationale**: 
- Current simplified mapping is acknowledged as temporary/inaccurate
- Need to study EMNLP2025-VULCA papers for proper algorithm
- Must preserve semantic relationships between dimensions
**Alternatives considered**:
- Random generation: Rejected - lacks meaningful correlation
- Simple linear mapping: Rejected - too simplistic for nuanced evaluation
- ML-based prediction: Considered for future enhancement

### Dimension Mapping Strategy
**Decision**: Category-based expansion with weighted distributions  
**Rationale**:
- 6D maps to 47D through cognitive/creative/social categories
- Each original dimension influences multiple target dimensions
- Preserves evaluation intent while adding granularity
**Implementation approach**:
```
Creativity (6D) → Creative Synthesis, Artistic Expression, Innovation Index, etc. (47D)
Technique (6D) → Technical Precision, Code Quality, Algorithmic Efficiency, etc. (47D)
```

## Data Architecture Research

### UUID Migration Strategy
**Decision**: Dual ID system with 3-month transition period  
**Rationale**:
- Allows gradual migration without breaking existing integrations
- Both Integer and UUID fields coexist temporarily
- Clear deprecation timeline for clients
**Implementation**:
- Add UUID columns alongside existing Integer IDs
- API accepts both, returns both during transition
- Deprecation warnings in responses using Integer IDs

### Snake_case Standardization
**Decision**: API transformation layer for backward compatibility  
**Rationale**:
- Frontend uses camelCase (JavaScript convention)
- Backend uses snake_case (Python convention)
- API middleware handles transformation
**Implementation**:
- Pydantic alias_generator for automatic conversion
- Response models with both formats during transition

## Performance Research

### Cache Strategy
**Decision**: Redis-based event-driven invalidation  
**Rationale**:
- No fixed TTL - data changes trigger invalidation
- Redis pub/sub for distributed cache coordination
- Granular invalidation per model/dimension
**Triggers**:
- Model update → invalidate model cache
- New evaluation → invalidate affected dimensions
- Manual refresh → selective or full flush

### Batch Processing
**Decision**: Celery with scheduled tasks for nightly processing  
**Rationale**:
- Existing Celery infrastructure can be leveraged
- Scheduled at low-traffic hours (3 AM UTC)
- Progress tracking via Redis
**Implementation**:
- Celery beat for scheduling
- Task chunking for 42 models
- Failure retry with exponential backoff

## Data Transmission Research

### WebSocket Implementation
**Decision**: Socket.IO for cross-browser compatibility  
**Rationale**:
- Better browser support than raw WebSockets
- Automatic reconnection handling
- Room-based broadcasting for enterprise features
**Use cases**:
- Real-time VULCA generation progress
- Live dimension updates for enterprise users
- Collaborative evaluation sessions

### Streaming Strategy
**Decision**: Server-Sent Events (SSE) for unidirectional streaming  
**Rationale**:
- Simpler than WebSockets for one-way data flow
- Native browser support
- Automatic reconnection
**Use cases**:
- Streaming 47D details on expansion
- Progress updates during generation

## Security & Access Control

### Tiered Access Implementation
**Decision**: JWT claims-based authorization  
**Rationale**:
- Existing JWT infrastructure
- Claims encode tier level (free/paid/enterprise)
- Middleware enforces access per endpoint
**Tiers**:
- Free: 6D view + TOP 5 of 47D
- Paid: Full 47D + cultural perspectives
- Enterprise: + WebSocket + custom testing + API

### API Rate Limiting
**Decision**: Token bucket algorithm with tier-based limits  
**Rationale**:
- Prevents abuse while allowing burst traffic
- Different limits per tier
- Redis for distributed rate limiting
**Limits**:
- Free: 100 requests/hour
- Paid: 1000 requests/hour
- Enterprise: Unlimited

## UI/UX Research

### Dimension Display Strategy
**Decision**: Progressive disclosure with category grouping  
**Rationale**:
- 47 dimensions overwhelming if shown at once
- Categories provide mental model
- Expansion on demand reduces cognitive load
**Implementation**:
- Collapsed by default showing TOP 10
- Category headers (Cognitive/Creative/Social)
- Smooth animations for expansion

### Progress Indication
**Decision**: Multi-stage progress bar with time estimates  
**Rationale**:
- Transparency builds trust during long operations
- Stage indicators show current processing step
- Time estimates based on historical data
**Stages**:
1. Initializing (5%)
2. Analyzing base dimensions (20%)
3. Expanding to 47D (60%)
4. Calculating perspectives (80%)
5. Finalizing (100%)

## Migration Research

### Database Migration Strategy
**Decision**: Alembic migrations with backward compatibility  
**Rationale**:
- Existing Alembic setup
- Non-breaking additive changes first
- Data migration in separate step
**Sequence**:
1. Add new columns (UUID, VULCA fields)
2. Populate via background job
3. Switch reads to new columns
4. Remove old columns after transition

### API Versioning
**Decision**: URL path versioning (/v1, /v2)  
**Rationale**:
- Clear version visibility
- Easy to route and deprecate
- Parallel operation during transition
**Implementation**:
- /v1: Existing 6D API (deprecated)
- /v2: New VULCA 47D API
- Version negotiation via Accept header

## EMNLP2025-VULCA Algorithm Research Plan

### Execution Timeline
**Day 1: Paper Analysis & Core Algorithm Extraction**
- Deep dive into EMNLP2025-VULCA papers at `I:\website\EMNLP2025-VULCA\`
- Extract mathematical formulations and theoretical foundations
- Document dimension generation methodology
- Identify key parameters and thresholds

**Day 2: 47-Dimension Semantic Correlation Matrix**
- Analyze inter-dimension relationships and weights
- Map semantic connections between 6D and 47D spaces
- Build correlation matrix for dimension expansion
- Document cultural perspective adjustments

**Day 3: Prototype Implementation & Validation**
- Implement core algorithm in Python
- Create test cases with known outputs
- Validate against paper's example results
- Performance benchmarking

### Key Research Areas
1. **Dimension Expansion Logic**
   - How creativity (1D) maps to multiple creative dimensions
   - Weight distribution across target dimensions
   - Confidence score calculation methodology

2. **Cultural Adaptation Mechanism**
   - How cultural perspectives modify base scores
   - Regional weight adjustments
   - Normalization strategies

3. **Quality Metrics**
   - Algorithm accuracy measurements
   - Consistency validation across models
   - Temporal stability of scores

### Implementation Checkpoints
- [ ] Core algorithm documented in pseudocode
- [ ] Mathematical formulas translated to code
- [ ] Test suite with reference implementations
- [ ] Performance optimizations identified

## All NEEDS CLARIFICATION Resolved ✓

No remaining unknowns - all technical decisions documented above.