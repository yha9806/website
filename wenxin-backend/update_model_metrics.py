"""
Update database with real benchmark scores from scoring results
"""
import json
import sqlite3
from datetime import datetime
import os

def load_scoring_results():
    """Load all scoring results"""
    scoring_dir = "scoring_results"
    results = {}
    
    # Load individual model scores
    for filename in os.listdir(scoring_dir):
        if filename.endswith("_scored.json") and filename != "all_scored_results.json":
            model_id = filename.replace("_scored.json", "")
            with open(os.path.join(scoring_dir, filename), "r", encoding="utf-8") as f:
                data = json.load(f)
                results[model_id] = data
    
    return results

def update_database(results):
    """Update database with scoring results"""
    conn = sqlite3.connect("wenxin.db")
    cursor = conn.cursor()
    
    updated_count = 0
    
    for model_id, data in results.items():
        # Extract metrics
        metrics = data.get("metrics", {})
        overall_score = data.get("overall_score", 0)
        
        # Get detailed metrics for description
        detailed_metrics = data.get("detailed_metrics", {})
        
        # Build description from analysis
        description_parts = []
        for dimension, details in detailed_metrics.items():
            if details.get("common_strengths"):
                description_parts.append(f"{dimension.capitalize()}: {details['common_strengths'][0]}")
        
        description = " | ".join(description_parts[:3]) if description_parts else f"AI model with overall score {overall_score:.1f}"
        
        # Generate tags based on performance
        tags = []
        if overall_score > 85:
            tags.append("top-performer")
        if metrics.get("creativity", 0) > 85:
            tags.append("creative")
        if metrics.get("cultural", 0) > 85:
            tags.append("cultural-aware")
        if metrics.get("emotion", 0) > 85:
            tags.append("emotional")
        
        # Prepare benchmark results with full response text
        benchmark_results = {
            "timestamp": data.get("scoring_time", datetime.now().isoformat()),
            "test_count": data.get("stats", {}).get("total_responses", 18),
            "success_count": data.get("stats", {}).get("successful_scores", 0),
            "detailed_scores": []
        }
        
        # Add detailed scores with full responses
        for score_detail in data.get("detailed_scores", []):
            benchmark_results["detailed_scores"].append({
                "dimension": score_detail.get("dimension"),
                "test_id": score_detail.get("test_id"),
                "prompt": score_detail.get("prompt"),
                "response": score_detail.get("response"),  # Full response text
                "score": score_detail.get("score", 0),
                "analysis": score_detail.get("analysis", {}),
                "response_time": score_detail.get("response_time", 0),
                "tokens_used": score_detail.get("tokens_used", 0)
            })
        
        # Update database
        try:
            # Map scoring model IDs to database names
            name_mapping = {
                "gpt-4-turbo": "GPT-4 Turbo",
                "gpt-4o-mini": "GPT-4o Mini",
                "gpt-4o": "GPT-4o",
                "gpt-4": "GPT-4",
                "gpt-4.5": "GPT-4.5",
                "gpt-5": "GPT-5",
                "gpt-5-mini": "GPT-5 Mini",
                "gpt-5-nano": "GPT-5 Nano",
                "o1": "o1",
                "o1-mini": "o1-mini",
                "o3-mini": "o3-mini"
            }
            
            db_name = name_mapping.get(model_id, model_id)
            
            # Check if model exists
            cursor.execute("SELECT id FROM ai_models WHERE name = ?", (db_name,))
            result = cursor.fetchone()
            
            if result:
                model_db_id = result[0]
                
                # Update metrics and other fields
                cursor.execute("""
                    UPDATE ai_models 
                    SET rhythm_score = ?,
                        composition_score = ?,
                        narrative_score = ?,
                        emotion_score = ?,
                        creativity_score = ?,
                        cultural_score = ?,
                        overall_score = ?,
                        description = ?,
                        tags = ?,
                        benchmark_results = ?,
                        data_source = 'benchmark',
                        updated_at = CURRENT_TIMESTAMP
                    WHERE id = ?
                """, (
                    metrics.get("rhythm", 0),
                    metrics.get("composition", 0),
                    metrics.get("narrative", 0),
                    metrics.get("emotion", 0),
                    metrics.get("creativity", 0),
                    metrics.get("cultural", 0),
                    overall_score,
                    description,
                    json.dumps(tags),
                    json.dumps(benchmark_results, ensure_ascii=False),
                    model_db_id
                ))
                
                updated_count += 1
                print(f"Updated {model_id}: Overall={overall_score:.1f}, Metrics={metrics}")
            else:
                print(f"Model {model_id} not found in database")
                
        except Exception as e:
            print(f"Error updating {model_id}: {e}")
    
    conn.commit()
    conn.close()
    
    return updated_count

def add_sample_artworks():
    """Add sample artworks for models with good scores"""
    conn = sqlite3.connect("wenxin.db")
    cursor = conn.cursor()
    
    # Get models with good scores
    cursor.execute("""
        SELECT id, name, overall_score 
        FROM ai_models 
        WHERE overall_score > 80 
        ORDER BY overall_score DESC
        LIMIT 5
    """)
    
    models = cursor.fetchall()
    
    artwork_prompts = [
        "春天的早晨，樱花盛开",
        "月下独酌，诗意盎然",
        "山水之间，云雾缭绕",
        "秋天的枫叶，层林尽染",
        "冬日暖阳，梅花初绽"
    ]
    
    for model in models:
        model_id, model_name, score = model
        
        # Check if artwork already exists
        cursor.execute("SELECT COUNT(*) FROM artworks WHERE creator_model_id = ?", (model_id,))
        if cursor.fetchone()[0] > 0:
            continue
            
        # Add sample artwork
        for i, prompt in enumerate(artwork_prompts[:2]):  # Add 2 artworks per model
            cursor.execute("""
                INSERT INTO artworks (
                    title, 
                    prompt, 
                    creator_model_id,
                    creation_time,
                    image_url,
                    likes,
                    shares,
                    status
                ) VALUES (?, ?, ?, CURRENT_TIMESTAMP, ?, ?, ?, 'completed')
            """, (
                f"{prompt} - by {model_name}",
                prompt,
                model_id,
                f"https://picsum.photos/seed/{model_id}_{i}/400/300",
                int(score * 10 + i * 5),  # Simulated likes based on score
                int(score * 2 + i)  # Simulated shares
            ))
    
    conn.commit()
    conn.close()
    print("Added sample artworks for top models")

def main():
    print("Loading scoring results...")
    results = load_scoring_results()
    print(f"Found {len(results)} model results")
    
    print("\nUpdating database...")
    updated = update_database(results)
    print(f"Updated {updated} models in database")
    
    print("\nAdding sample artworks...")
    add_sample_artworks()
    
    print("\nVerifying update...")
    conn = sqlite3.connect("wenxin.db")
    cursor = conn.cursor()
    
    cursor.execute("""
        SELECT name, overall_score, rhythm_score, composition_score,
               narrative_score, emotion_score, creativity_score, cultural_score
        FROM ai_models
        WHERE rhythm_score IS NOT NULL
        ORDER BY overall_score DESC
    """)
    
    print("\nUpdated models:")
    print("-" * 80)
    for row in cursor.fetchall():
        print(f"{row[0]:<20} Overall: {row[1]:.1f} | R:{row[2]:.1f} C:{row[3]:.1f} N:{row[4]:.1f} E:{row[5]:.1f} Cr:{row[6]:.1f} Cu:{row[7]:.1f}")
    
    conn.close()

if __name__ == "__main__":
    main()