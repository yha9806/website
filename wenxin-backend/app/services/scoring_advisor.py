from typing import Dict, List, Optional, Any
from enum import Enum

class TaskType(str, Enum):
    POEM = "poem"
    STORY = "story" 
    PAINTING = "painting"
    MUSIC = "music"

class ScoringAdvice:
    """Evaluation scoring advice and guidance"""
    
    def __init__(self):
        self.task_templates = {
            TaskType.POEM: {
                'typical_ranges': {
                    'rhythm': (75, 90),
                    'composition': (70, 85),
                    'narrative': (60, 80),
                    'emotion': (80, 95),
                    'creativity': (70, 90),
                    'cultural': (85, 95)
                },
                'focus_areas': [
                    '韵律节奏是否和谐',
                    '意境营造是否深远',
                    '语言运用是否精练',
                    '文化内涵是否丰富'
                ],
                'common_strengths': [
                    '节奏感强，朗朗上口',
                    '意象丰富，情感真挚',
                    '文化底蕴深厚'
                ],
                'common_weaknesses': [
                    '部分句子节奏略显生硬',
                    '个别用词可以更加精练',
                    '意境层次可以更加丰富'
                ]
            },
            TaskType.STORY: {
                'typical_ranges': {
                    'rhythm': (60, 80),
                    'composition': (80, 92),
                    'narrative': (85, 95),
                    'emotion': (75, 90),
                    'creativity': (80, 95),
                    'cultural': (70, 85)
                },
                'focus_areas': [
                    '故事结构是否完整',
                    '人物塑造是否立体',
                    '情节发展是否合理',
                    '语言表达是否流畅'
                ],
                'common_strengths': [
                    '故事情节引人入胜',
                    '人物形象鲜明生动',
                    '语言表达生动自然'
                ],
                'common_weaknesses': [
                    '部分情节转折略显突兀',
                    '人物内心刻画可以更深入',
                    '结局处理可以更加精彩'
                ]
            },
            TaskType.PAINTING: {
                'typical_ranges': {
                    'rhythm': (65, 85),
                    'composition': (85, 95),
                    'narrative': (70, 85),
                    'emotion': (80, 92),
                    'creativity': (85, 95),
                    'cultural': (75, 90)
                },
                'focus_areas': [
                    '构图布局是否和谐',
                    '色彩搭配是否协调',
                    '艺术风格是否统一',
                    '视觉冲击力如何'
                ],
                'common_strengths': [
                    '构图平衡，层次丰富',
                    '色彩运用大胆创新',
                    '风格独特，识别度高'
                ],
                'common_weaknesses': [
                    '部分细节处理可以更精致',
                    '色彩层次可以更加丰富',
                    '光影效果可以进一步优化'
                ]
            },
            TaskType.MUSIC: {
                'typical_ranges': {
                    'rhythm': (85, 95),
                    'composition': (80, 90),
                    'narrative': (65, 85),
                    'emotion': (85, 95),
                    'creativity': (75, 90),
                    'cultural': (70, 85)
                },
                'focus_areas': [
                    '旋律线条是否优美',
                    '节奏变化是否丰富',
                    '和声进行是否合理',
                    '情感表达是否到位'
                ],
                'common_strengths': [
                    '旋律优美，朗朗上口',
                    '节奏变化丰富有趣',
                    '情感表达真挚动人'
                ],
                'common_weaknesses': [
                    '部分和声进行可以更加新颖',
                    '动态变化可以更加丰富',
                    '结构层次可以进一步优化'
                ]
            }
        }
    
    def get_task_advice(self, task_type: TaskType) -> Dict[str, Any]:
        """Get scoring advice for a specific task type"""
        template = self.task_templates.get(task_type)
        if not template:
            return self._get_default_advice()
        
        return {
            'task_type': task_type.value,
            'typical_score_ranges': template['typical_ranges'],
            'focus_areas': template['focus_areas'],
            'evaluation_tips': self._generate_evaluation_tips(task_type),
            'common_patterns': {
                'strengths': template['common_strengths'],
                'areas_for_improvement': template['common_weaknesses']
            }
        }
    
    def get_dimension_guidance(self, task_type: TaskType, dimension: str) -> Dict[str, Any]:
        """Get specific guidance for a dimension"""
        template = self.task_templates.get(task_type)
        if not template or dimension not in template['typical_ranges']:
            return {}
        
        min_score, max_score = template['typical_ranges'][dimension]
        
        return {
            'dimension': dimension,
            'typical_range': {
                'min': min_score,
                'max': max_score,
                'average': (min_score + max_score) / 2
            },
            'scoring_guidelines': self._get_dimension_guidelines(dimension),
            'quality_indicators': self._get_quality_indicators(dimension)
        }
    
    def analyze_user_scoring_pattern(self, user_scores: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Analyze user's scoring patterns for personalized advice"""
        if not user_scores:
            return {'message': 'No scoring history available'}
        
        # Calculate user's average scores by dimension
        dimension_averages = {}
        dimension_counts = {}
        
        for score_record in user_scores:
            if 'evaluation_metrics' in score_record and score_record['evaluation_metrics']:
                for dim, score in score_record['evaluation_metrics'].items():
                    if isinstance(score, (int, float)):
                        if dim not in dimension_averages:
                            dimension_averages[dim] = 0
                            dimension_counts[dim] = 0
                        dimension_averages[dim] += score * 100  # Convert to 0-100 scale
                        dimension_counts[dim] += 1
        
        # Calculate final averages
        for dim in dimension_averages:
            if dimension_counts[dim] > 0:
                dimension_averages[dim] /= dimension_counts[dim]
        
        return {
            'total_evaluations': len(user_scores),
            'average_scores_by_dimension': dimension_averages,
            'scoring_tendencies': self._analyze_scoring_tendencies(dimension_averages),
            'personalized_suggestions': self._generate_personalized_suggestions(dimension_averages)
        }
    
    def _generate_evaluation_tips(self, task_type: TaskType) -> List[str]:
        """Generate evaluation tips for specific task type"""
        base_tips = [
            '评分时请综合考虑作品的整体质量',
            '可以参考同类型作品的表现进行对比',
            '建议从多个维度进行全面评估'
        ]
        
        task_specific_tips = {
            TaskType.POEM: [
                '注意诗歌的韵律美感和意境深度',
                '考虑文字的精练程度和表达力',
                '评估文化内涵的丰富性'
            ],
            TaskType.STORY: [
                '重点关注故事的完整性和逻辑性',
                '评估人物塑造的立体感',
                '考虑语言表达的生动性'
            ],
            TaskType.PAINTING: [
                '注意构图的平衡性和美感',
                '评估色彩运用的协调性',
                '考虑创意表达的独特性'
            ],
            TaskType.MUSIC: [
                '重点听旋律的流畅性和美感',
                '评估节奏变化的丰富性',
                '考虑情感表达的真挚度'
            ]
        }
        
        return base_tips + task_specific_tips.get(task_type, [])
    
    def _get_dimension_guidelines(self, dimension: str) -> List[str]:
        """Get scoring guidelines for specific dimension"""
        guidelines = {
            'rhythm': [
                '90-100分：节奏完美，韵律优美',
                '80-89分：节奏流畅，偶有小瑕疵',
                '70-79分：基本流畅，有改进空间',
                '60-69分：节奏一般，需要优化'
            ],
            'composition': [
                '90-100分：构图完美，层次丰富',
                '80-89分：构图协调，布局合理',
                '70-79分：基本平衡，可以优化',
                '60-69分：构图一般，需要改进'
            ],
            'narrative': [
                '90-100分：叙事完整，逻辑清晰',
                '80-89分：故事流畅，结构合理',
                '70-79分：基本完整，有待完善',
                '60-69分：叙事一般，需要提升'
            ],
            'emotion': [
                '90-100分：情感真挚，感染力强',
                '80-89分：情感自然，表达到位',
                '70-79分：有情感色彩，可以加强',
                '60-69分：情感表达一般'
            ],
            'creativity': [
                '90-100分：创意独特，令人惊艳',
                '80-89分：有创新元素，表现不错',
                '70-79分：有一定创意，可以突破',
                '60-69分：创意一般，较为常规'
            ],
            'cultural': [
                '90-100分：文化内涵深厚，底蕴丰富',
                '80-89分：有文化色彩，表达得体',
                '70-79分：文化元素适中',
                '60-69分：文化内涵有待加强'
            ]
        }
        
        return guidelines.get(dimension, ['请根据作品质量综合评估'])
    
    def _get_quality_indicators(self, dimension: str) -> List[str]:
        """Get quality indicators for dimension"""
        indicators = {
            'rhythm': ['韵律节奏', '音韵美感', '朗诵效果'],
            'composition': ['布局平衡', '层次结构', '视觉美感'],
            'narrative': ['故事完整性', '逻辑性', '叙事技巧'],
            'emotion': ['情感真实度', '感染力', '共鸣程度'],
            'creativity': ['创新程度', '独特性', '想象力'],
            'cultural': ['文化底蕴', '传统元素', '时代特色']
        }
        
        return indicators.get(dimension, ['整体质量'])
    
    def _analyze_scoring_tendencies(self, dimension_averages: Dict[str, float]) -> Dict[str, str]:
        """Analyze user's scoring tendencies"""
        if not dimension_averages:
            return {}
        
        tendencies = {}
        overall_avg = sum(dimension_averages.values()) / len(dimension_averages) if dimension_averages else 0
        
        for dim, avg in dimension_averages.items():
            if avg > overall_avg + 5:
                tendencies[dim] = '您在此维度评分较为宽松'
            elif avg < overall_avg - 5:
                tendencies[dim] = '您在此维度评分较为严格'
            else:
                tendencies[dim] = '您在此维度评分较为中性'
        
        return tendencies
    
    def _generate_personalized_suggestions(self, dimension_averages: Dict[str, float]) -> List[str]:
        """Generate personalized scoring suggestions"""
        if not dimension_averages:
            return ['建议多参与评测以获得个性化建议']
        
        suggestions = []
        overall_avg = sum(dimension_averages.values()) / len(dimension_averages)
        
        if overall_avg > 85:
            suggestions.append('您的评分整体偏高，可以适当提高评判标准')
        elif overall_avg < 75:
            suggestions.append('您的评分整体较为严格，可以适当关注作品的亮点')
        else:
            suggestions.append('您的评分较为均衡，请继续保持客观评判')
        
        # Find dimension with highest variance
        if len(dimension_averages) >= 3:
            max_dim = max(dimension_averages.keys(), key=lambda k: dimension_averages[k])
            min_dim = min(dimension_averages.keys(), key=lambda k: dimension_averages[k])
            
            if dimension_averages[max_dim] - dimension_averages[min_dim] > 15:
                suggestions.append(f'您在{max_dim}维度评分较高，{min_dim}维度较严格，建议平衡评判标准')
        
        return suggestions
    
    def _get_default_advice(self) -> Dict[str, Any]:
        """Get default advice for unknown task types"""
        return {
            'task_type': 'unknown',
            'typical_score_ranges': {
                'overall': (70, 90)
            },
            'focus_areas': ['整体质量', '创意表现', '技术水平'],
            'evaluation_tips': ['请根据作品整体表现进行综合评分'],
            'common_patterns': {
                'strengths': ['表现良好的方面'],
                'areas_for_improvement': ['可以改进的地方']
            }
        }