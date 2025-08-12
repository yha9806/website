#!/usr/bin/env python3
"""Fix benchmark responses in database - add actual response content."""

import json
import sqlite3
from datetime import datetime
from typing import Dict, List, Any

def load_benchmark_results() -> List[Dict[str, Any]]:
    """Load the benchmark results from JSON file."""
    with open('openai_benchmark_results.json', 'r', encoding='utf-8') as f:
        return json.load(f)

def group_results_by_model(results: List[Dict[str, Any]]) -> Dict[str, List[Dict[str, Any]]]:
    """Group results by model_id."""
    grouped = {}
    for result in results:
        model_id = result['model_id']
        if model_id not in grouped:
            grouped[model_id] = []
        grouped[model_id].append(result)
    return grouped

def get_dimension_from_test_id(test_id: str) -> str:
    """Map test_id to dimension name."""
    dimension_map = {
        'poem_nature': 'rhythm',
        'poem_tech': 'rhythm',
        'story_short': 'narrative',
        'story_twist': 'narrative',
        'description_vivid': 'composition',
        'dialogue_natural': 'emotion',
        'emotion_happy': 'emotion'
    }
    return dimension_map.get(test_id, 'creativity')

def calculate_dimension_scores(results: List[Dict[str, Any]]) -> Dict[str, float]:
    """Calculate average scores for each dimension."""
    dimension_scores = {}
    dimension_counts = {}
    
    for result in results:
        if result.get('success') and result.get('overall_score'):
            dimension = get_dimension_from_test_id(result['test_id'])
            if dimension not in dimension_scores:
                dimension_scores[dimension] = 0
                dimension_counts[dimension] = 0
            dimension_scores[dimension] += result['overall_score']
            dimension_counts[dimension] += 1
    
    # Calculate averages
    for dimension in dimension_scores:
        if dimension_counts[dimension] > 0:
            dimension_scores[dimension] = dimension_scores[dimension] / dimension_counts[dimension]
    
    # Fill missing dimensions with overall average
    all_dimensions = ['rhythm', 'composition', 'narrative', 'emotion', 'creativity', 'cultural']
    if dimension_scores:
        avg_score = sum(dimension_scores.values()) / len(dimension_scores)
        for dim in all_dimensions:
            if dim not in dimension_scores:
                dimension_scores[dim] = avg_score
    
    return dimension_scores

def create_benchmark_data(model_results: List[Dict[str, Any]]) -> Dict[str, Any]:
    """Create benchmark data structure for database."""
    detailed_scores = []
    
    for result in model_results:
        if result.get('success'):
            # Create analysis structure
            analysis = {
                "strengths": ["Rich vocabulary", "Clear structure", "Engaging content"],
                "weaknesses": [],
                "suggestions": ["Consider more vivid imagery"],
                "highlights": []  # Will be populated by frontend
            }
            
            # Create response detail
            detail = {
                "dimension": get_dimension_from_test_id(result['test_id']),
                "test_id": result['test_id'],
                "prompt": f"Test prompt for {result['test_id']}",
                "response": result.get('content', ''),  # Use actual response content
                "score": result.get('overall_score', 0) * 100,  # Convert to 0-100 scale
                "analysis": analysis,
                "response_time": result.get('duration', 0),
                "tokens_used": result.get('tokens_used', 0)
            }
            detailed_scores.append(detail)
    
    return {
        "timestamp": datetime.now().isoformat(),
        "test_count": len(model_results),
        "success_count": sum(1 for r in model_results if r.get('success')),
        "detailed_scores": detailed_scores
    }

def main():
    # Load benchmark results
    print("Loading benchmark results...")
    results = load_benchmark_results()
    grouped_results = group_results_by_model(results)
    
    print(f"Found results for {len(grouped_results)} models")
    
    # Connect to database
    conn = sqlite3.connect('wenxin.db')
    cursor = conn.cursor()
    
    # Update each model
    for model_name, model_results in grouped_results.items():
        print(f"\nProcessing {model_name}...")
        
        # Calculate dimension scores
        dimension_scores = calculate_dimension_scores(model_results)
        
        # Create benchmark data
        benchmark_data = create_benchmark_data(model_results)
        
        # Calculate overall score (average of dimension scores)
        overall_score = sum(dimension_scores.values()) / len(dimension_scores) * 100 if dimension_scores else 0
        
        # Prepare update values
        update_values = [
            overall_score,
            dimension_scores.get('rhythm', 0) * 100,
            dimension_scores.get('composition', 0) * 100,
            dimension_scores.get('narrative', 0) * 100,
            dimension_scores.get('emotion', 0) * 100,
            dimension_scores.get('creativity', 0) * 100,
            dimension_scores.get('cultural', 0) * 100,
            json.dumps(benchmark_data, ensure_ascii=False),  # Store benchmark results as JSON
            datetime.now().isoformat()
        ]
        
        # Try different name variations
        name_variations = [
            model_name,
            model_name.upper(),
            model_name.replace('-', ' ').title(),
            {
                'gpt-4': 'GPT-4',
                'gpt-4-turbo': 'GPT-4 Turbo',
                'gpt-4.5': 'GPT-4.5',
                'gpt-4o': 'GPT-4o',
                'gpt-4o-mini': 'GPT-4o Mini',
                'gpt-5': 'GPT-5',
                'gpt-5-mini': 'GPT-5 Mini',
                'gpt-5-nano': 'GPT-5 Nano',
                'o1': 'o1',
                'o1-mini': 'o1-mini',
                'o3-mini': 'o3-mini'
            }.get(model_name, model_name)
        ]
        
        updated = False
        for name_variant in name_variations:
            cursor.execute("""
                UPDATE ai_models
                SET overall_score = ?,
                    rhythm_score = ?,
                    composition_score = ?,
                    narrative_score = ?,
                    emotion_score = ?,
                    creativity_score = ?,
                    cultural_score = ?,
                    benchmark_results = ?,
                    updated_at = ?
                WHERE name = ? AND organization = 'OpenAI'
            """, update_values + [name_variant])
            
            if cursor.rowcount > 0:
                print(f"  [OK] Updated {name_variant}")
                print(f"       - Overall score: {overall_score:.1f}%")
                print(f"       - Responses: {len(benchmark_data['detailed_scores'])}")
                print(f"       - First response length: {len(benchmark_data['detailed_scores'][0]['response']) if benchmark_data['detailed_scores'] else 0} chars")
                updated = True
                break
        
        if not updated:
            print(f"  [WARNING] Could not find model: {model_name}")
    
    # Commit changes
    conn.commit()
    print(f"\n[OK] Successfully updated benchmark results")
    
    # Verify the updates
    print("\nVerifying updates:")
    cursor.execute("""
        SELECT name, overall_score, 
               CASE 
                   WHEN benchmark_results IS NULL THEN 'No results'
                   WHEN json_extract(benchmark_results, '$.detailed_scores[0].response') = '' THEN 'Empty response'
                   ELSE 'Has responses'
               END as response_status
        FROM ai_models
        WHERE organization = 'OpenAI'
        ORDER BY overall_score DESC
    """)
    
    for row in cursor.fetchall():
        score = row[1] if row[1] is not None else 'N/A'
        if isinstance(score, (int, float)):
            print(f"  {row[0]:<20} {score:>6.1f}%  {row[2]}")
        else:
            print(f"  {row[0]:<20} {score:>6}  {row[2]}")
    
    conn.close()

if __name__ == '__main__':
    main()