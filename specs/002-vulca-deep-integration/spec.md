# Feature Specification: VULCA Deep Integration

## Feature Number
002

## Feature Name
vulca-deep-integration

## Overview
Transform VULCA from a standalone feature into the core evaluation system of WenXin MoYun, creating a unified 6D/47D assessment platform with seamless UI integration and intelligent view switching.

## Problem Statement
The current VULCA implementation suffers from fundamental architectural issues:
- **Dual-track system**: VULCA exists as a separate page (/vulca-demo) disconnected from the main platform
- **Data silos**: 47D data and 6D data are not truly integrated, requiring manual "Load Demo Data" actions
- **Fragmented UX**: Users must actively discover and navigate to VULCA features
- **Hidden value**: VULCA's powerful 47-dimension evaluation and 8 cultural perspectives are buried in secondary pages
- **API mismatch**: Frontend expects integers but receives UUIDs, causing 422 errors

This results in VULCA's advanced capabilities being underutilized and the platform appearing to have two separate evaluation systems rather than one unified, powerful solution.

## Goals
1. **Unify evaluation systems**: Create a single, cohesive evaluation platform where 6D serves as summary view and 47D as detailed analysis
2. **Seamless data integration**: Enable automatic data flow between 6D and 47D evaluations without user intervention
3. **Progressive disclosure**: Present evaluation data from simple to complex based on user needs
4. **Intelligent switching**: Automatically select appropriate evaluation depth (6D/47D) based on context
5. **Production readiness**: Deploy complete VULCA functionality to production environment

## Non-Goals
- Complete rewrite of existing evaluation algorithms
- Removal of 6D evaluation system
- Breaking changes to existing APIs
- Modification of core VULCA mathematical models
- Changes to authentication or user management systems

## User Stories

### Story 1: Seamless Evaluation Viewing
**As a** platform user  
**I want to** view AI model evaluations without knowing about VULCA specifics  
**So that** I can understand model capabilities at the depth I need

**Acceptance Criteria:**
- Default view shows familiar 6D summary
- Single click reveals 47D detailed analysis
- No "Load Demo Data" required for real models
- Smooth transitions between evaluation depths

### Story 2: Unified Model Comparison
**As a** researcher  
**I want to** compare models using both high-level and detailed metrics  
**So that** I can make informed decisions based on specific needs

**Acceptance Criteria:**
- Compare models side-by-side in 6D or 47D view
- Switch comparison depth without losing context
- Cultural perspective overlays available for all comparisons
- Export comparison data in multiple formats

### Story 3: Progressive Information Discovery
**As a** casual user  
**I want to** start with simple scores and dive deeper when needed  
**So that** I'm not overwhelmed with information

**Acceptance Criteria:**
- Initial view shows overall score and 6D radar
- Hover reveals mini 47D preview
- Click expands to full 47D analysis
- Cultural perspectives accessible but not forced

## Technical Requirements

### Data Layer Unification
```typescript
interface UnifiedEvaluation {
  modelId: string;
  
  // Core 6D scores (always present)
  basic6D: {
    creativity: number;
    technique: number;
    emotion: number;
    context: number;
    innovation: number;
    impact: number;
  };
  
  // Extended 47D scores (generated on-demand)
  extended47D?: {
    dimensions: Record<string, number>;
    culturalPerspectives: Record<CultureType, PerspectiveData>;
    metadata: {
      generatedAt: Date;
      algorithm: string;
      confidence: number;
    };
  };
  
  // Evaluation metadata
  metadata: {
    evaluationDepth: '6D' | '47D' | 'hybrid';
    lastUpdated: Date;
    dataSource: 'real' | 'generated' | 'predicted';
    syncStatus: 'pending' | 'completed' | 'failed';
  };
}
```

### API Layer Integration
```typescript
// Unified endpoint with intelligent depth selection
GET /api/v1/models/{id}/evaluation?depth=auto|6d|47d|full

// Batch evaluation for comparison
POST /api/v1/models/compare
{
  "modelIds": ["uuid1", "uuid2"],
  "depth": "auto",
  "includeCultural": true
}

// Real-time VULCA generation
POST /api/v1/models/{id}/generate-vulca
{
  "base6D": {...},
  "culturalPreference": "global"
}
```

### Frontend Component Architecture
```typescript
// Smart evaluation display component
<UnifiedEvaluation
  modelId={id}
  initialDepth="auto"
  onDepthChange={handleDepthChange}
  culturalOverlay={selectedCulture}
/>

// Progressive disclosure pattern
<ModelCard>
  <ScoreSummary />           {/* Always visible */}
  <MiniRadar onHover />       {/* Hover preview */}
  <DetailPanel onExpand />    {/* Click to expand */}
  <CulturalLens optional />   {/* Advanced features */}
</ModelCard>
```

## Implementation Plan

### Phase 1: Data Model Unification (Week 1)
1. Create unified evaluation schema
2. Implement 6D”47D conversion service
3. Update database models for unified structure
4. Create migration scripts for existing data
5. Implement caching layer for performance

### Phase 2: API Integration (Week 1-2)
1. Refactor endpoints to support unified model
2. Fix UUID vs integer ID mismatch issue
3. Implement intelligent depth selection logic
4. Add batch comparison endpoints
5. Create real-time VULCA generation API

### Phase 3: Frontend Integration (Week 2-3)
1. Update `useVULCAData` hook for unified data
2. Refactor `VULCAVisualization` component
3. Integrate VULCA into `LeaderboardTable`
4. Enhance `ModelDetailPage` with progressive disclosure
5. Remove standalone VULCA demo page

### Phase 4: UI/UX Polish (Week 3)
1. Implement smooth transitions between views
2. Add loading states and skeletons
3. Create intuitive depth indicators
4. Design cultural perspective overlays
5. Optimize mobile responsive design

### Phase 5: Production Deployment (Week 4)
1. Complete integration testing
2. Performance optimization
3. Production build and deployment
4. Monitor and collect metrics
5. Gradual feature rollout

## Dependencies
- Existing VULCA core algorithm (`VULCACoreAdapter`)
- SQLAlchemy models and Alembic migrations
- React 19 and Recharts visualization library
- FastAPI backend infrastructure
- Google Cloud Platform deployment pipeline

## Testing Strategy

### Unit Tests
- Data conversion algorithms (6D”47D)
- API endpoint logic
- Component state management
- Cultural perspective calculations

### Integration Tests
- End-to-end data flow
- API response formatting
- Database synchronization
- Cache invalidation

### E2E Tests
- User journey from rankings to detailed analysis
- Model comparison workflows
- Cultural perspective switching
- Mobile responsiveness

### Performance Tests
- 47D calculation time (<500ms)
- Page load time with VULCA data (<2s)
- Smooth transitions (60fps)
- Memory usage optimization

## Performance Considerations
- Lazy load 47D data only when requested
- Cache VULCA calculations for 24 hours
- Use React.memo for expensive visualizations
- Implement virtual scrolling for dimension lists
- CDN cache for static VULCA assets

## Security Considerations
- Validate all dimension values (0-100 range)
- Sanitize cultural perspective inputs
- Rate limit VULCA generation endpoints
- Audit log for data modifications
- No PII in evaluation metadata

## Rollout Plan

### Stage 1: Internal Testing
- Deploy to staging environment
- Team testing and feedback
- Performance benchmarking
- Bug fixes and optimizations

### Stage 2: Beta Release
- Feature flag for 10% of users
- Collect usage metrics
- A/B test against current system
- Gather user feedback

### Stage 3: General Availability
- Full production deployment
- Remove legacy VULCA demo
- Update documentation
- Marketing announcement

## Success Metrics
- **Engagement**: 50% of users access 47D view within first week
- **Performance**: <500ms to switch between 6D/47D views
- **Adoption**: 80% prefer unified system in user surveys
- **Quality**: <1% error rate in VULCA calculations
- **Discovery**: 3x increase in cultural perspective usage

## Risk Mitigation

### Risk 1: Data Migration Failures
**Mitigation**: Comprehensive backup strategy, rollback procedures, parallel run period

### Risk 2: Performance Degradation
**Mitigation**: Extensive load testing, caching strategy, CDN optimization

### Risk 3: User Confusion
**Mitigation**: Gradual rollout, in-app tutorials, clear visual indicators

### Risk 4: API Breaking Changes
**Mitigation**: Version deprecation strategy, backward compatibility layer

## Timeline Estimate
- Phase 1: 40 hours
- Phase 2: 30 hours
- Phase 3: 50 hours
- Phase 4: 20 hours
- Phase 5: 20 hours
- **Total: 160 hours (4 weeks)**

## Budget Considerations
- No additional infrastructure costs (uses existing GCP resources)
- Development time: 160 hours
- Testing and QA: 40 hours
- Documentation: 20 hours

## Open Questions
1. Should we maintain backward compatibility with standalone VULCA URLs?
2. What should be the default depth for new users vs returning users?
3. How should we handle models without VULCA data during transition?
4. Should cultural perspectives be personalized based on user location?

## Success Criteria
The integration will be considered successful when:
1. All real models display VULCA data without manual intervention
2. Users can seamlessly switch between 6D and 47D views
3. Performance metrics meet or exceed targets
4. User satisfaction scores increase by 20%
5. VULCA features are used by >50% of active users

## Notes
This deep integration represents a fundamental shift in how WenXin MoYun presents AI evaluation data. By making VULCA capabilities native to the platform rather than an add-on, we're positioning WenXin as the most comprehensive AI evaluation platform available, with unique cultural perspective insights that differentiate it from competitors.

The key principle is that users shouldn't need to know what VULCA is to benefit from its powerful analysis capabilities. The system should intelligently present the right level of detail at the right time, making complex evaluations accessible to all user types.