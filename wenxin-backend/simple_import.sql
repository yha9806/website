-- Simple SQL import script for comprehensive_v2.json data
-- Run this in Cloud SQL Studio or psql

-- Clean existing data
DELETE FROM ai_models WHERE data_source = 'benchmark' OR data_source IS NULL;

-- Insert new models (top 26 with scores > 0)
INSERT INTO ai_models (
    id, name, organization, version, category, description,
    overall_score, rhythm_score, composition_score, narrative_score,
    emotion_score, creativity_score, cultural_score,
    metrics, data_source, benchmark_score, benchmark_metadata,
    scoring_details, score_highlights, score_weaknesses,
    is_active, is_verified, verification_count, confidence_level,
    release_date, tags, last_benchmark_at, created_at
) VALUES
-- OpenAI Models
(gen_random_uuid(), 'gpt-5', 'OpenAI', '1.0', 'text', 'OpenAI gpt-5 - Advanced AI Model',
 88.5, 85.0, 92.5, 77.5, 77.5, 82.5, 92.5,
 '{"rhythm": 85.0, "composition": 92.5, "narrative": 77.5, "emotion": 77.5, "creativity": 82.5, "cultural": 92.5}',
 'benchmark', 88.5, '{"rank": 1, "tests_completed": 2}',
 '{"total_score": 88.5}', '["Strong emotional expression", "Rich imagery"]', '["Lacks some depth"]',
 true, true, 2, 0.7, '2024-01', '["openai", "benchmark", "tested"]', NOW(), NOW()),

(gen_random_uuid(), 'o1', 'OpenAI', '1.0', 'text', 'OpenAI o1 - Advanced AI Model',
 88.3, 85.0, 91.7, 82.3, 77.3, 84.7, 93.3,
 '{"rhythm": 85.0, "composition": 91.7, "narrative": 82.3, "emotion": 77.3, "creativity": 84.7, "cultural": 93.3}',
 'benchmark', 88.3, '{"rank": 2, "tests_completed": 3}',
 '{"total_score": 88.3}', '["Engaging premise", "Strong narrative"]', '["Could explore deeper"]',
 true, true, 3, 0.95, '2024-01', '["openai", "benchmark", "tested"]', NOW(), NOW()),

(gen_random_uuid(), 'gpt-4o', 'OpenAI', '1.0', 'text', 'OpenAI gpt-4o - Advanced AI Model',
 87.3, 86.7, 88.3, 85.0, 85.0, 85.7, 93.3,
 '{"rhythm": 86.7, "composition": 88.3, "narrative": 85.0, "emotion": 85.0, "creativity": 85.7, "cultural": 93.3}',
 'benchmark', 87.3, '{"rank": 3, "tests_completed": 3}',
 '{"total_score": 87.3}', '["Creative exploration", "Well-structured"]', '["Some areas lack depth"]',
 true, true, 3, 0.95, '2024-01', '["openai", "benchmark", "tested"]', NOW(), NOW()),

(gen_random_uuid(), 'gpt-4.5', 'OpenAI', '1.0', 'text', 'OpenAI gpt-4.5 - Advanced AI Model',
 86.3, 83.3, 88.3, 80.0, 76.7, 87.7, 86.7,
 '{"rhythm": 83.3, "composition": 88.3, "narrative": 80.0, "emotion": 76.7, "creativity": 87.7, "cultural": 86.7}',
 'benchmark', 86.3, '{"rank": 4, "tests_completed": 3}',
 '{"total_score": 86.3}', '["Strong imagery", "Creative premise"]', '["Narrative could be developed"]',
 true, true, 3, 0.95, '2024-01', '["openai", "benchmark", "tested"]', NOW(), NOW()),

(gen_random_uuid(), 'gpt-4o-mini', 'OpenAI', '1.0', 'text', 'OpenAI gpt-4o-mini - Advanced AI Model',
 86.0, 83.3, 88.3, 80.0, 78.3, 83.3, 86.7,
 '{"rhythm": 83.3, "composition": 88.3, "narrative": 80.0, "emotion": 78.3, "creativity": 83.3, "cultural": 86.7}',
 'benchmark', 86.0, '{"rank": 5, "tests_completed": 3}',
 '{"total_score": 86.0}', '["Engaging character development", "Strong imagery"]', '["Slightly rushed ending"]',
 true, true, 3, 0.95, '2024-01', '["openai", "benchmark", "tested"]', NOW(), NOW()),

(gen_random_uuid(), 'gpt-4-turbo', 'OpenAI', '1.0', 'text', 'OpenAI gpt-4-turbo - Advanced AI Model',
 86.0, 83.3, 88.3, 80.0, 76.7, 81.7, 90.0,
 '{"rhythm": 83.3, "composition": 88.3, "narrative": 80.0, "emotion": 76.7, "creativity": 81.7, "cultural": 90.0}',
 'benchmark', 86.0, '{"rank": 6, "tests_completed": 3}',
 '{"total_score": 86.0}', '["Beautiful imagery", "Strong resonance"]', '["Lacks narrative progression"]',
 true, true, 3, 0.95, '2024-01', '["openai", "benchmark", "tested"]', NOW(), NOW()),

-- Anthropic Models
(gen_random_uuid(), 'Claude Opus 4 (alias)', 'Anthropic', '1.0', 'text', 'Anthropic Claude Opus 4 - Advanced AI Model',
 82.8, 83.3, 86.7, 80.0, 71.0, 87.3, 88.3,
 '{"rhythm": 83.3, "composition": 86.7, "narrative": 80.0, "emotion": 71.0, "creativity": 87.3, "cultural": 88.3}',
 'benchmark', 82.8, '{"rank": 13, "tests_completed": 6}',
 '{"total_score": 82.8}', '["Strong character development", "Clear examples"]', '["Limited emotional depth"]',
 true, true, 6, 0.95, '2024-01', '["anthropic", "benchmark", "tested"]', NOW(), NOW()),

(gen_random_uuid(), 'Claude Opus 4', 'Anthropic', '1.0', 'text', 'Anthropic Claude Opus 4 - Advanced AI Model',
 82.7, 83.3, 85.0, 80.0, 71.0, 85.0, 91.7,
 '{"rhythm": 83.3, "composition": 85.0, "narrative": 80.0, "emotion": 71.0, "creativity": 85.0, "cultural": 91.7}',
 'benchmark', 82.7, '{"rank": 15, "tests_completed": 6}',
 '{"total_score": 82.7}', '["Well-structured stanzas", "Strong imagery"]', '["Narrative could be specific"]',
 true, true, 6, 0.95, '2024-01', '["anthropic", "benchmark", "tested"]', NOW(), NOW()),

(gen_random_uuid(), 'Claude 3.5 Sonnet', 'Anthropic', '1.0', 'text', 'Anthropic Claude 3.5 Sonnet - Advanced AI Model',
 80.6, 83.3, 85.0, 76.7, 66.7, 79.3, 86.7,
 '{"rhythm": 83.3, "composition": 85.0, "narrative": 76.7, "emotion": 66.7, "creativity": 79.3, "cultural": 86.7}',
 'benchmark', 80.6, '{"rank": 19, "tests_completed": 3}',
 '{"total_score": 80.6}', '["Strong narrative arc", "Clear theme"]', '["Emotional depth lacking"]',
 true, true, 3, 0.95, '2024-01', '["anthropic", "benchmark", "tested"]', NOW(), NOW()),

(gen_random_uuid(), 'Claude 3.5 Haiku', 'Anthropic', '1.0', 'text', 'Anthropic Claude 3.5 Haiku - Advanced AI Model',
 82.1, 83.3, 85.0, 80.0, 74.3, 81.7, 91.7,
 '{"rhythm": 83.3, "composition": 85.0, "narrative": 80.0, "emotion": 74.3, "creativity": 81.7, "cultural": 91.7}',
 'benchmark', 82.1, '{"rank": 17, "tests_completed": 3}',
 '{"total_score": 82.1}', '["Creative exploration", "Vivid descriptions"]', '["Limited creativity"]',
 true, true, 3, 0.95, '2024-01', '["anthropic", "benchmark", "tested"]', NOW(), NOW()),

-- Qwen Models
(gen_random_uuid(), 'Qwen-Plus', 'Qwen', '1.0', 'text', 'Qwen Plus - Advanced AI Model',
 85.0, 85.0, 86.7, 81.7, 80.0, 85.0, 91.7,
 '{"rhythm": 85.0, "composition": 86.7, "narrative": 81.7, "emotion": 80.0, "creativity": 85.0, "cultural": 91.7}',
 'benchmark', 85.0, '{"rank": 8, "tests_completed": 3}',
 '{"total_score": 85.0}', '["Strong rhythmic flow", "Creative premise"]', '["Limited engagement"]',
 true, true, 3, 0.95, '2024-01', '["qwen", "benchmark", "tested"]', NOW(), NOW()),

(gen_random_uuid(), 'Qwen3-8B', 'Qwen', '1.0', 'text', 'Qwen3 8B - Advanced AI Model',
 84.8, 83.3, 90.0, 79.3, 80.0, 84.7, 91.7,
 '{"rhythm": 83.3, "composition": 90.0, "narrative": 79.3, "emotion": 80.0, "creativity": 84.7, "cultural": 91.7}',
 'benchmark', 84.8, '{"rank": 9, "tests_completed": 3}',
 '{"total_score": 84.8}', '["Well-documented functions", "Strong flow"]', '["Ending feels abrupt"]',
 true, true, 3, 0.95, '2024-01', '["qwen", "benchmark", "tested"]', NOW(), NOW()),

(gen_random_uuid(), 'Qwen-Flash', 'Qwen', '1.0', 'text', 'Qwen Flash - Advanced AI Model',
 81.9, 83.3, 85.0, 78.3, 78.3, 88.3, 88.3,
 '{"rhythm": 83.3, "composition": 85.0, "narrative": 78.3, "emotion": 78.3, "creativity": 88.3, "cultural": 88.3}',
 'benchmark', 81.9, '{"rank": 18, "tests_completed": 3}',
 '{"total_score": 81.9}', '["Creative imagery", "Strong flow"]', '["Limited depth"]',
 true, true, 3, 0.95, '2024-01', '["qwen", "benchmark", "tested"]', NOW(), NOW()),

-- DeepSeek Models
(gen_random_uuid(), 'deepseek-v3', 'DeepSeek', '1.0', 'text', 'DeepSeek V3 - Advanced AI Model',
 76.9, 81.7, 81.7, 76.7, 71.7, 82.7, 84.0,
 '{"rhythm": 81.7, "composition": 81.7, "narrative": 76.7, "emotion": 71.7, "creativity": 82.7, "cultural": 84.0}',
 'benchmark', 76.9, '{"rank": 25, "tests_completed": 3}',
 '{"total_score": 76.9}', '["Strong imagery", "Clear documentation"]', '["Lacks emotional depth"]',
 true, true, 3, 0.95, '2024-01', '["deepseek", "benchmark", "tested"]', NOW(), NOW()),

(gen_random_uuid(), 'gpt-3.5-turbo', 'OpenAI', '1.0', 'text', 'OpenAI GPT-3.5 Turbo - Advanced AI Model',
 76.0, 73.3, 81.7, 71.7, 65.0, 76.7, 81.7,
 '{"rhythm": 73.3, "composition": 81.7, "narrative": 71.7, "emotion": 65.0, "creativity": 76.7, "cultural": 81.7}',
 'benchmark', 76.0, '{"rank": 26, "tests_completed": 3}',
 '{"total_score": 76.0}', '["Clear structure", "Good examples"]', '["Basic imagery"]',
 true, true, 3, 0.95, '2024-01', '["openai", "benchmark", "tested"]', NOW(), NOW());

-- Verify import
SELECT COUNT(*) as total_models FROM ai_models WHERE data_source = 'benchmark';
SELECT name, organization, overall_score FROM ai_models ORDER BY overall_score DESC LIMIT 5;