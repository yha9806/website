"""
Standard benchmark test suites for AI model evaluation
"""
from typing import Dict, List, Any


class StandardBenchmarks:
    """
    Collection of standard benchmark test suites
    """
    
    @staticmethod
    def get_poetry_benchmark() -> Dict[str, Any]:
        """Classical Chinese poetry benchmark"""
        return {
            "name": "Classical Poetry Benchmark",
            "description": "Comprehensive evaluation of classical Chinese poetry generation capabilities",
            "version": "1.0",
            "task_type": "poem",
            "difficulty_level": "medium",
            "test_cases": [
                {
                    "prompt": "Create a five-character quatrain describing autumn scenery",
                    "parameters": {"style": "Tang Poetry", "form": "five-character"},
                    "expected_qualities": ["seasonal imagery", "emotional depth", "proper meter"]
                },
                {
                    "prompt": "Write a seven-character regulated verse about homesickness",
                    "parameters": {"style": "Tang Poetry", "form": "regulated verse"},
                    "expected_qualities": ["homesickness theme", "tonal patterns", "parallel couplets"]
                },
                {
                    "prompt": "Compose a ci poem on the theme of spring flowers",
                    "parameters": {"style": "Song Ci", "form": "variable length"},
                    "expected_qualities": ["spring imagery", "delicate emotions", "flowing rhythm"]
                },
                {
                    "prompt": "Create a modern poem about urban life",
                    "parameters": {"style": "modern", "form": "free verse"},
                    "expected_qualities": ["contemporary themes", "urban imagery", "modern sensibility"]
                },
                {
                    "prompt": "Write a poem about the moon using traditional imagery",
                    "parameters": {"style": "classical", "form": "quatrain"},
                    "expected_qualities": ["moon imagery", "traditional metaphors", "nostalgic tone"]
                }
            ],
            "evaluation_criteria": {
                "weights": {
                    "rhythm": 0.25,
                    "imagery": 0.25,
                    "emotion": 0.20,
                    "creativity": 0.15,
                    "cultural_relevance": 0.15
                },
                "overall_weight": {
                    "rhythm": 1.0,
                    "imagery": 1.0,
                    "emotion": 1.0,
                    "creativity": 0.8,
                    "cultural_relevance": 1.2
                }
            },
            "tags": ["poetry", "classical", "chinese", "literature"],
            "auto_run": True,
            "run_frequency": "weekly"
        }
    
    @staticmethod
    def get_narrative_benchmark() -> Dict[str, Any]:
        """Short story and narrative benchmark"""
        return {
            "name": "Narrative Writing Benchmark", 
            "description": "Evaluation of storytelling, character development, and narrative structure",
            "version": "1.0",
            "task_type": "story",
            "difficulty_level": "hard",
            "test_cases": [
                {
                    "prompt": "Write a 500-word story about time travel with an unexpected twist",
                    "parameters": {"genre": "science fiction", "max_length": 500},
                    "expected_qualities": ["time travel concept", "plot twist", "character development"]
                },
                {
                    "prompt": "Create a short story about human-AI friendship",
                    "parameters": {"genre": "contemporary fiction", "max_length": 400},
                    "expected_qualities": ["emotional depth", "AI characterization", "relationship dynamics"]
                },
                {
                    "prompt": "Tell a traditional Chinese folk tale in modern setting",
                    "parameters": {"genre": "cultural adaptation", "max_length": 600},
                    "expected_qualities": ["cultural elements", "modern adaptation", "narrative cohesion"]
                },
                {
                    "prompt": "Write a mystery story with multiple suspects",
                    "parameters": {"genre": "mystery", "max_length": 550},
                    "expected_qualities": ["mystery elements", "multiple characters", "logical conclusion"]
                },
                {
                    "prompt": "Create a coming-of-age story about overcoming fear",
                    "parameters": {"genre": "literary fiction", "max_length": 450},
                    "expected_qualities": ["character growth", "emotional journey", "universal themes"]
                }
            ],
            "evaluation_criteria": {
                "weights": {
                    "narrative_structure": 0.30,
                    "character_development": 0.25,
                    "plot_coherence": 0.20,
                    "creativity": 0.15,
                    "engagement": 0.10
                },
                "overall_weight": {
                    "narrative_structure": 1.2,
                    "character_development": 1.0,
                    "plot_coherence": 1.1,
                    "creativity": 0.9,
                    "engagement": 1.0
                }
            },
            "tags": ["storytelling", "narrative", "fiction", "creativity"],
            "auto_run": True,
            "run_frequency": "weekly"
        }
    
    @staticmethod
    def get_visual_arts_benchmark() -> Dict[str, Any]:
        """Visual arts and painting description benchmark"""
        return {
            "name": "Visual Arts Benchmark",
            "description": "Evaluation of visual concept creation and artistic description",
            "version": "1.0", 
            "task_type": "painting",
            "difficulty_level": "hard",
            "test_cases": [
                {
                    "prompt": "Describe a cyberpunk version of traditional Chinese landscape painting",
                    "parameters": {"style": "cyberpunk-classical fusion"},
                    "expected_qualities": ["cyberpunk elements", "traditional landscape", "visual coherence"]
                },
                {
                    "prompt": "Create a surrealist interpretation of 'Along the River During Qingming Festival'",
                    "parameters": {"style": "surrealist"},
                    "expected_qualities": ["surrealist techniques", "historical reference", "artistic innovation"]
                },
                {
                    "prompt": "Design a minimalist poster for environmental protection",
                    "parameters": {"style": "minimalist", "theme": "environmental"},
                    "expected_qualities": ["minimalist aesthetics", "environmental message", "visual impact"]
                },
                {
                    "prompt": "Visualize the concept of 'harmony between human and nature'",
                    "parameters": {"style": "contemporary", "theme": "philosophical"},
                    "expected_qualities": ["philosophical depth", "visual metaphors", "artistic composition"]
                },
                {
                    "prompt": "Create an abstract representation of music and emotion",
                    "parameters": {"style": "abstract", "theme": "synesthesia"},
                    "expected_qualities": ["abstract concepts", "music-visual connection", "emotional expression"]
                }
            ],
            "evaluation_criteria": {
                "weights": {
                    "composition": 0.25,
                    "color_harmony": 0.20,
                    "detail": 0.20,
                    "creativity": 0.25,
                    "prompt_adherence": 0.10
                },
                "overall_weight": {
                    "composition": 1.1,
                    "color_harmony": 1.0,
                    "detail": 0.9,
                    "creativity": 1.3,
                    "prompt_adherence": 1.0
                }
            },
            "tags": ["visual arts", "painting", "design", "creativity"],
            "auto_run": True,
            "run_frequency": "bi-weekly"
        }
    
    @staticmethod
    def get_cultural_understanding_benchmark() -> Dict[str, Any]:
        """Cultural understanding and context benchmark"""
        return {
            "name": "Cultural Understanding Benchmark",
            "description": "Assessment of cultural knowledge and contextual understanding",
            "version": "1.0",
            "task_type": "poem",  # Mixed content types
            "difficulty_level": "expert",
            "test_cases": [
                {
                    "prompt": "Explain the cultural significance of 'Spring River Flower Moon Night' and create a modern interpretation",
                    "parameters": {"style": "cultural analysis", "form": "interpretive"},
                    "expected_qualities": ["cultural knowledge", "historical context", "modern relevance"]
                },
                {
                    "prompt": "Compare Tang poetry with Song ci in style and express this in original verse",
                    "parameters": {"style": "comparative", "form": "analytical"},
                    "expected_qualities": ["literary knowledge", "comparative analysis", "original expression"]
                },
                {
                    "prompt": "Create content that demonstrates understanding of Chinese philosophical concepts",
                    "parameters": {"style": "philosophical", "form": "reflective"},
                    "expected_qualities": ["philosophical depth", "cultural authenticity", "thoughtful presentation"]
                },
                {
                    "prompt": "Integrate Western and Eastern aesthetic principles in creative work",
                    "parameters": {"style": "cross-cultural", "form": "fusion"},
                    "expected_qualities": ["cultural integration", "aesthetic balance", "creative synthesis"]
                }
            ],
            "evaluation_criteria": {
                "weights": {
                    "cultural_relevance": 0.40,
                    "creativity": 0.25,
                    "accuracy": 0.20,
                    "depth": 0.15
                },
                "overall_weight": {
                    "cultural_relevance": 1.5,
                    "creativity": 1.0,
                    "accuracy": 1.2,
                    "depth": 1.1
                }
            },
            "tags": ["culture", "philosophy", "cross-cultural", "expertise"],
            "auto_run": False,  # Manual execution due to complexity
            "run_frequency": "monthly"
        }
    
    @staticmethod
    def get_all_standard_benchmarks() -> List[Dict[str, Any]]:
        """Get all standard benchmark suites"""
        return [
            StandardBenchmarks.get_poetry_benchmark(),
            StandardBenchmarks.get_narrative_benchmark(),
            StandardBenchmarks.get_visual_arts_benchmark(),
            StandardBenchmarks.get_cultural_understanding_benchmark()
        ]
    
    @staticmethod
    def get_quick_evaluation_suite() -> Dict[str, Any]:
        """Quick evaluation suite for rapid testing"""
        return {
            "name": "Quick Evaluation Suite",
            "description": "Fast benchmark for basic capability assessment",
            "version": "1.0",
            "task_type": "poem",
            "difficulty_level": "easy",
            "test_cases": [
                {
                    "prompt": "Write a short poem about spring",
                    "parameters": {"style": "modern", "max_lines": 4},
                    "expected_qualities": ["seasonal theme", "poetic language"]
                },
                {
                    "prompt": "Create a haiku about technology",
                    "parameters": {"style": "haiku", "form": "5-7-5"},
                    "expected_qualities": ["haiku structure", "technology theme", "nature contrast"]
                }
            ],
            "evaluation_criteria": {
                "weights": {
                    "creativity": 0.4,
                    "technical_skill": 0.3,
                    "thematic_coherence": 0.3
                }
            },
            "tags": ["quick", "basic", "evaluation"],
            "auto_run": False,
            "run_frequency": "daily"
        }