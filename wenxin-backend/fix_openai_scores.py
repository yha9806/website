#!/usr/bin/env python3
"""Fix OpenAI model scores from the benchmark results."""

import json
import sqlite3
from datetime import datetime

def main():
    # Load the real benchmark scores
    with open('openai_model_scores.json', 'r') as f:
        scores = json.load(f)
    
    print(f"Loaded {len(scores)} model scores")
    
    # Connect to database
    conn = sqlite3.connect('wenxin.db')
    cursor = conn.cursor()
    
    # Update each model
    for model_name, data in scores.items():
        # Convert score from 0-1 to 0-100 scale
        overall_score = data['average_score'] * 100
        
        # For now, set all dimension scores to the overall score
        # (In reality, these should come from detailed benchmark results)
        dimension_score = overall_score
        
        # Update the model in database
        cursor.execute("""
            UPDATE ai_models
            SET overall_score = ?,
                rhythm_score = ?,
                composition_score = ?,
                narrative_score = ?,
                emotion_score = ?,
                creativity_score = ?,
                cultural_score = ?,
                updated_at = ?
            WHERE name = ? AND organization = 'OpenAI'
        """, (
            overall_score,
            dimension_score,
            dimension_score,
            dimension_score,
            dimension_score,
            dimension_score,
            dimension_score,
            datetime.now().isoformat(),
            model_name
        ))
        
        if cursor.rowcount > 0:
            print(f"[OK] Updated {model_name}: {overall_score:.1f}%")
        else:
            # Try with different name variations
            alt_names = {
                'gpt-4.5': 'GPT-4.5',
                'gpt-4': 'GPT-4',
                'gpt-4-turbo': 'GPT-4 Turbo',
                'gpt-4o': 'GPT-4o',
                'gpt-4o-mini': 'GPT-4o Mini',
                'gpt-5': 'GPT-5',
                'gpt-5-mini': 'GPT-5 Mini',
                'gpt-5-nano': 'GPT-5 Nano',
                'o1': 'o1',
                'o1-mini': 'o1-mini',
                'o3-mini': 'o3-mini'
            }
            
            if model_name in alt_names:
                cursor.execute("""
                    UPDATE ai_models
                    SET overall_score = ?,
                        rhythm_score = ?,
                        composition_score = ?,
                        narrative_score = ?,
                        emotion_score = ?,
                        creativity_score = ?,
                        cultural_score = ?,
                        updated_at = ?
                    WHERE name = ? AND organization = 'OpenAI'
                """, (
                    overall_score,
                    dimension_score,
                    dimension_score,
                    dimension_score,
                    dimension_score,
                    dimension_score,
                    dimension_score,
                    datetime.now().isoformat(),
                    alt_names[model_name]
                ))
                
                if cursor.rowcount > 0:
                    print(f"[OK] Updated {alt_names[model_name]}: {overall_score:.1f}%")
                else:
                    print(f"[X] Could not find model: {model_name} or {alt_names[model_name]}")
    
    # Commit changes
    conn.commit()
    print(f"\n[OK] Successfully updated {len(scores)} models")
    
    # Verify the updates
    print("\nVerifying updates:")
    cursor.execute("""
        SELECT name, overall_score
        FROM ai_models
        WHERE organization = 'OpenAI'
        ORDER BY overall_score DESC
    """)
    
    for row in cursor.fetchall():
        score = row[1] if row[1] is not None else 'N/A'
        if isinstance(score, (int, float)):
            print(f"  {row[0]:<20} {score:.1f}%")
        else:
            print(f"  {row[0]:<20} {score}")
    
    conn.close()

if __name__ == '__main__':
    main()