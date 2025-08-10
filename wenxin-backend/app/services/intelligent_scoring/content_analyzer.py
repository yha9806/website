"""
Content analyzer for extracting features from generated content
"""
import re
import json
from typing import Dict, Any, Optional


class ContentAnalyzer:
    """Analyzes content to extract quantitative features"""
    
    def analyze_poem(self, content: str, style: Optional[str] = None) -> Dict[str, Any]:
        """Extract features from poem content"""
        lines = content.strip().split('\n')
        words = content.split()
        
        # Basic metrics
        features = {
            'line_count': len([line for line in lines if line.strip()]),
            'word_count': len(words),
            'avg_line_length': sum(len(line) for line in lines) / max(len(lines), 1),
            'character_count': len(content),
            'style': style or 'unknown'
        }
        
        # Chinese poetry specific features
        if self._is_chinese_content(content):
            features.update({
                'chinese_character_count': len(re.findall(r'[\u4e00-\u9fff]', content)),
                'punctuation_count': len(re.findall(r'[，。！？；：]', content)),
                'is_traditional_form': self._detect_traditional_poem_form(lines)
            })
        
        return features
    
    def analyze_story(self, content: str, genre: Optional[str] = None) -> Dict[str, Any]:
        """Extract features from story content"""
        sentences = re.split(r'[.!?。！？]', content)
        paragraphs = content.split('\n\n')
        words = content.split()
        
        features = {
            'word_count': len(words),
            'sentence_count': len([s for s in sentences if s.strip()]),
            'paragraph_count': len([p for p in paragraphs if p.strip()]),
            'avg_sentence_length': len(words) / max(len(sentences), 1),
            'character_count': len(content),
            'genre': genre or 'unknown',
            'dialogue_count': len(re.findall(r'[""].*?[""]', content)),
            'has_dialogue': '"' in content or '"' in content
        }
        
        return features
    
    def analyze_painting_prompt(self, prompt: str, style: Optional[str] = None) -> Dict[str, Any]:
        """Extract features from painting prompt"""
        words = prompt.split()
        
        # Detect artistic elements
        color_keywords = ['red', 'blue', 'green', 'yellow', 'purple', 'orange', 'black', 'white', 
                         'gold', 'silver', 'vibrant', 'bright', 'dark', 'light']
        style_keywords = ['realistic', 'abstract', 'impressionist', 'surreal', 'minimalist',
                         'cyberpunk', 'steampunk', 'fantasy', 'traditional', 'modern']
        composition_keywords = ['landscape', 'portrait', 'still life', 'close-up', 'wide shot',
                               'panoramic', 'detailed', 'simple', 'complex']
        
        features = {
            'word_count': len(words),
            'character_count': len(prompt),
            'style': style or 'unknown',
            'color_mentions': sum(1 for word in words if word.lower() in color_keywords),
            'style_mentions': sum(1 for word in words if word.lower() in style_keywords),
            'composition_mentions': sum(1 for word in words if word.lower() in composition_keywords),
            'has_specific_style': any(word.lower() in style_keywords for word in words),
            'complexity_score': len(words) / 20.0  # Normalized complexity based on prompt length
        }
        
        return features
    
    def analyze_music_composition(self, content: str, style: Optional[str] = None) -> Dict[str, Any]:
        """Extract features from music composition"""
        lines = content.split('\n')
        
        # Detect musical elements
        tempo_keywords = ['allegro', 'andante', 'adagio', 'presto', 'largo', 'moderato',
                         'fast', 'slow', 'medium', 'quick']
        key_signatures = ['C', 'G', 'D', 'A', 'E', 'B', 'F#', 'C#', 'F', 'Bb', 'Eb', 'Ab', 'Db', 'Gb', 'Cb',
                         'Am', 'Em', 'Bm', 'F#m', 'C#m', 'G#m', 'D#m', 'A#m', 'Dm', 'Gm', 'Cm', 'Fm', 'Bbm', 'Ebm', 'Abm']
        
        features = {
            'line_count': len([line for line in lines if line.strip()]),
            'character_count': len(content),
            'word_count': len(content.split()),
            'style': style or 'unknown',
            'has_tempo_marking': any(keyword in content.lower() for keyword in tempo_keywords),
            'has_key_signature': any(key in content for key in key_signatures),
            'has_lyrics': 'lyrics' in content.lower() or any('♪' in line for line in lines),
            'musical_notation_count': len(re.findall(r'[ABCDEFG][#b]?', content))
        }
        
        return features
    
    def _is_chinese_content(self, content: str) -> bool:
        """Check if content contains Chinese characters"""
        chinese_chars = re.findall(r'[\u4e00-\u9fff]', content)
        return len(chinese_chars) > len(content.split()) * 0.3
    
    def _detect_traditional_poem_form(self, lines: list) -> bool:
        """Detect if poem follows traditional Chinese forms"""
        if len(lines) == 4:  # Quatrain
            return True
        elif len(lines) == 8:  # Octave
            return True
        # Add more traditional form detection logic
        return False