# Data Model: VULCA Deep Integration

## Core Entities

### VULCAScore
Primary entity representing 47-dimensional evaluation results.

**Fields**:
- `id`: UUID (primary key)
- `legacy_id`: Integer (temporary, for backward compatibility)
- `model_id`: UUID (foreign key to AIModel)
- `version`: String (VULCA algorithm version, e.g., "2.0.0")
- `overall_score`: Float (0-100, weighted aggregate)
- `tier_visibility`: Enum (free, paid, enterprise)
- `generation_status`: Enum (pending, processing, completed, failed)
- `generation_started_at`: DateTime
- `generation_completed_at`: DateTime
- `processing_time_seconds`: Integer
- `created_at`: DateTime
- `updated_at`: DateTime

**Relationships**:
- Has many VULCADimension (47 dimensions)
- Has many CulturalPerspective
- Belongs to AIModel

**Validation**:
- overall_score between 0 and 100
- generation_status transitions: pending → processing → completed/failed
- processing_time_seconds >= 0

### VULCADimension
Individual dimension within the 47D framework.

**Fields**:
- `id`: UUID (primary key)
- `vulca_score_id`: UUID (foreign key)
- `dimension_name`: String (snake_case identifier)
- `display_name`: String (human-readable)
- `category`: Enum (cognitive, creative, social)
- `value`: Float (0-100)
- `confidence`: Float (0-1, algorithm confidence)
- `weight`: Float (contribution to overall score)
- `description`: Text
- `tier_required`: Enum (free, paid, enterprise)

**Relationships**:
- Belongs to VULCAScore
- Has many CulturalPerspectiveValue

**Validation**:
- dimension_name in predefined 47 dimensions list
- value between 0 and 100
- confidence between 0 and 1
- weight >= 0, sum of weights = 1

### CulturalPerspective
Different cultural evaluation lenses.

**Fields**:
- `id`: UUID (primary key)
- `vulca_score_id`: UUID (foreign key)
- `perspective_name`: String (e.g., "western", "eastern", "global")
- `region_code`: String (ISO 3166)
- `overall_score`: Float (0-100)
- `tier_required`: Enum (paid, enterprise)

**Relationships**:
- Belongs to VULCAScore
- Has many CulturalPerspectiveValue

### CulturalPerspectiveValue
Dimension values from cultural perspective.

**Fields**:
- `id`: UUID (primary key)
- `perspective_id`: UUID (foreign key)
- `dimension_id`: UUID (foreign key)
- `adjusted_value`: Float (0-100)
- `cultural_weight`: Float

**Relationships**:
- Belongs to CulturalPerspective
- Belongs to VULCADimension

### AIModel (Extended)
Existing model entity with VULCA additions.

**Fields** (additions):
- `uuid`: UUID (new primary identifier)
- `vulca_enabled`: Boolean (feature flag)
- `vulca_generation_priority`: Integer (batch processing order)
- `last_vulca_generation`: DateTime
- `vulca_generation_frequency`: Enum (daily, weekly, on_demand)

**Relationships**:
- Has many VULCAScore (historical versions)
- Has one current VULCAScore (latest)

## State Transitions

### VULCAScore Generation States
```
pending → processing → completed
         ↓          ↓
         failed ←───┘
```

**Triggers**:
- pending: Created when model needs VULCA evaluation
- processing: Batch job picks up pending score
- completed: Algorithm successfully generates 47D
- failed: Algorithm error or timeout

### Tier Visibility Rules
```
Free User:
  - VULCAScore.overall_score (visible)
  - VULCADimension TOP 5 (visible)
  - Rest (hidden with "Upgrade to view" message)

Paid User:
  - All VULCADimension (visible)
  - CulturalPerspective (visible)
  - WebSocket updates (not available)

Enterprise User:
  - Everything visible
  - Real-time updates via WebSocket
  - Historical versions access
```

## Database Indexes

### Performance Indexes
- `idx_vulca_score_model_created`: (model_id, created_at DESC)
- `idx_vulca_score_status`: (generation_status) WHERE status = 'pending'
- `idx_vulca_dimension_score_category`: (vulca_score_id, category)
- `idx_model_uuid_legacy`: (uuid, legacy_id) - for transition period

### Unique Constraints
- `uq_vulca_score_model_version`: (model_id, version, created_at)
- `uq_dimension_name_score`: (vulca_score_id, dimension_name)
- `uq_perspective_name_score`: (vulca_score_id, perspective_name)

## Data Migration Plan

### Phase 1: Schema Addition (Non-breaking)
```sql
ALTER TABLE ai_models ADD COLUMN uuid UUID DEFAULT gen_random_uuid();
ALTER TABLE ai_models ADD COLUMN vulca_enabled BOOLEAN DEFAULT false;

CREATE TABLE vulca_scores (...);
CREATE TABLE vulca_dimensions (...);
CREATE TABLE cultural_perspectives (...);
CREATE TABLE cultural_perspective_values (...);
```

### Phase 2: Data Population
```python
# Background job to:
1. Generate UUIDs for existing models
2. Create VULCAScore records in 'pending' state
3. Expand existing 6D scores to 47D using algorithm
```

### Phase 3: Dual Operation (3 months)
- APIs return both integer ID and UUID
- Accept either for lookups
- Log deprecation warnings for integer ID usage

### Phase 4: Cleanup
```sql
ALTER TABLE ai_models DROP COLUMN id CASCADE;
ALTER TABLE ai_models RENAME COLUMN uuid TO id;
```

## Caching Strategy

### Cache Keys
- `vulca:score:{model_uuid}:current` - Latest score
- `vulca:score:{model_uuid}:v{version}` - Specific version
- `vulca:dimensions:{score_uuid}` - All dimensions
- `vulca:perspectives:{score_uuid}` - All perspectives
- `vulca:leaderboard:{tier}` - Cached leaderboard per tier

### Invalidation Events
- Model update → Invalidate model's current score
- New score generated → Invalidate model cache, leaderboard
- Manual refresh → Flush specific model or all

## Algorithm Version Management

### AlgorithmVersion
Tracks VULCA algorithm evolution and migrations.

**Fields**:
- `version`: String (e.g., "1.0", "2.0")
- `name`: String (e.g., "Initial Mapping", "EMNLP2025 Implementation")
- `description`: Text
- `is_active`: Boolean
- `migration_date`: DateTime
- `deprecation_date`: DateTime (nullable)
- `algorithm_config`: JSONB (parameters and weights)

**Version Timeline**:
- **v1.0**: Current simplified mapping (temporary)
- **v2.0**: EMNLP2025-based accurate algorithm (target: 2025-09-20)
- **v2.1**: Cultural perspective enhancements (future)

### VULCAScore Version Tracking
Each VULCAScore references the algorithm version used:
```python
vulca_score.algorithm_version = "2.0"  # Tracks which algorithm generated this score
```

## API Contracts Preview

### GET /v2/models/{uuid}/vulca
Returns current VULCA score with tier-appropriate visibility.

### GET /v2/vulca/dimensions
Returns dimension definitions and categories.

### GET /v2/vulca/algorithm-version
Returns current algorithm version information for debugging and validation.

### POST /v2/models/{uuid}/vulca/generate
Triggers on-demand generation (enterprise only).

### WS /v2/vulca/stream
WebSocket endpoint for real-time updates (enterprise only).