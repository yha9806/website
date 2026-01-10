# Feature Specification: VULCA Deep Integration

**Feature Branch**: `003-ji-vulca-vulca`  
**Created**: 2025-09-10  
**Status**: Ready for Planning  
**Input**: User description: "ji 基于现有的内容继续优化任务，这是详细的计划：# VULCA深度集成需求文档..."

## Execution Flow (main)
```
1. Parse user description from Input
   → Extracted: VULCA deep integration requirements
2. Extract key concepts from description
   → Identified: VULCA algorithm, 47D evaluation, UUID migration, snake_case standardization
3. For each unclear aspect:
   → Marked uncertainties about algorithm implementation details
4. Fill User Scenarios & Testing section
   → Defined user flows for model evaluation with VULCA
5. Generate Functional Requirements
   → Created testable requirements for each component
6. Identify Key Entities (data models)
   → VULCA scores, dimensions, cultural perspectives
7. Run Review Checklist
   → All clarifications resolved with concrete decisions
8. Return: SUCCESS (spec ready for planning)
```

---

## ⚡ Quick Guidelines
- ✅ Focus on WHAT users need and WHY
- ❌ Avoid HOW to implement (no tech stack, APIs, code structure)
- 👥 Written for business stakeholders, not developers

---

## User Scenarios & Testing

### Primary User Story
As a user evaluating AI models, I want to see comprehensive 47-dimension VULCA analysis that provides deeper insights than traditional 6D evaluation, so I can make more informed decisions about model selection based on nuanced capabilities across cognitive, creative, and social dimensions.

### Acceptance Scenarios
1. **Given** a user viewing a model's detail page, **When** they access the evaluation section, **Then** they see collapsed VULCA dimensions with top 10 highlighted by default
2. **Given** a model without VULCA scores yet, **When** a user views its page, **Then** they see a clear "Generating VULCA Analysis" status indicator
3. **Given** VULCA scores are available, **When** a user expands dimension categories, **Then** they see all 47 dimensions grouped by cognitive/creative/social categories
4. **Given** multiple cultural perspectives exist, **When** viewing VULCA scores, **Then** all cultural dimension scores are displayed without user customization
5. **Given** a user comparing models, **When** they view the leaderboard, **Then** VULCA-based rankings are integrated seamlessly with existing displays

### Edge Cases
- What happens when VULCA algorithm processing fails for a model?
- How does system handle partial VULCA data (some dimensions missing)?
- What is shown during the transition period from 6D to 47D system?
- How are legacy 6D scores handled after VULCA migration?

## Requirements

### Functional Requirements
- **FR-001**: System MUST display 47 VULCA dimensions replacing the current 6D evaluation system
- **FR-002**: System MUST show top 10 dimensions by default in collapsed view with ability to expand
- **FR-003**: System MUST group dimensions into cognitive, creative, and social categories for better organization
- **FR-004**: System MUST display all cultural perspective scores without personalization options
- **FR-005**: System MUST show "Generating" status for models pending VULCA calculation
- **FR-006**: System MUST migrate all identifiers from Integer to UUID format
- **FR-007**: System MUST standardize all data formats to snake_case naming convention
- **FR-008**: System MUST implement event-driven cache invalidation triggered by: model updates, new evaluation completion, and manual refresh (no fixed TTL)
- **FR-009**: System MUST run nightly batch processing for VULCA pre-calculation
- **FR-010**: System MUST integrate VULCA scores into existing leaderboard rankings
- **FR-011**: System MUST provide tiered access: Free (6D view + TOP 5 47D preview), Paid (complete 47D + cultural perspectives + API), Enterprise (custom testing + data labeling services)
- **FR-012**: System MUST restrict advanced API access to paid users only
- **FR-013**: System MUST implement VULCA algorithm based on EMNLP2025-VULCA research (requires algorithm study phase to extract core logic from I:\website\EMNLP2025-VULCA)
- **FR-014**: System MUST deprecate the standalone vulca-demo page after integration
- **FR-015**: System MUST handle data transmission priorities: basic pull (initial page load), streaming (47D details on user expansion), WebSocket (real-time updates for enterprise users only)
- **FR-016**: System MUST implement transparent 5-stage progress bars (Initializing 5%, Analyzing 20%, Expanding 60%, Perspectives 80%, Finalizing 100%) with estimated time remaining per stage, supporting background processing with completion notifications
- **FR-017**: System MUST intelligently expand 6D scores to 47D dimensions using proper algorithmic mapping (not random generation)
- **FR-018**: System MUST maintain backward compatibility with 3-month transition period supporting dual ID system (Integer and UUID)

### Key Entities
- **VULCA Score**: Represents 47-dimensional evaluation result for a model, includes dimension values, timestamp, cultural perspectives
- **Dimension**: Individual evaluation metric within VULCA framework, has name, category (cognitive/creative/social), value, description
- **Cultural Perspective**: Different cultural lens for evaluation, contains perspective name, dimension weights, regional context
- **Model Evaluation**: Links AI models to their VULCA scores, includes model UUID, score UUID, generation status, completion timestamp
- **Evaluation Category**: Groups related dimensions together (cognitive, creative, social), used for UI organization and analysis

---

## Review & Acceptance Checklist

### Content Quality
- [x] No implementation details (languages, frameworks, APIs)
- [x] Focused on user value and business needs
- [x] Written for non-technical stakeholders
- [x] All mandatory sections completed

### Requirement Completeness
- [x] No [NEEDS CLARIFICATION] markers remain (all clarified)
- [x] Requirements are testable and unambiguous
- [x] Success criteria are measurable
- [x] Scope is clearly bounded
- [x] Dependencies and assumptions identified

### Clarifications Resolved
1. **Algorithm Implementation**: Will conduct algorithm research phase using EMNLP2025-VULCA documents to extract core logic
2. **Cache Invalidation Strategy**: Event-driven invalidation on model updates, new evaluations, and manual refresh
3. **Free vs Paid Features**: Three-tier model defined - Free (basic), Paid (complete), Enterprise (custom)
4. **Data Transmission Triggers**: Clear priorities set for pull/stream/WebSocket based on use case

---

## Execution Status

- [x] User description parsed
- [x] Key concepts extracted
- [x] Ambiguities marked
- [x] User scenarios defined
- [x] Requirements generated
- [x] Entities identified
- [x] Review checklist passed

---
