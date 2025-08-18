#!/usr/bin/env python3
"""
Script to update AI model scores
Can be used to update individual or batch scores via the API

Usage:
    python update_scores.py --model GPT-4o --overall 95.0 --creativity 96.0
    python update_scores.py --batch scores.json
    python update_scores.py --reset-to-seed
"""

import argparse
import json
import requests
from typing import Dict, Any, Optional


# API configuration
API_BASE_URL = "http://localhost:8001/api/v1"
ADMIN_ENDPOINT = f"{API_BASE_URL}/admin"


def update_single_model(model_id: str, scores: Dict[str, float]) -> None:
    """Update scores for a single model"""
    url = f"{ADMIN_ENDPOINT}/models/{model_id}/scores"
    
    response = requests.put(url, json=scores)
    
    if response.status_code == 200:
        result = response.json()
        print(f"[SUCCESS] Successfully updated {model_id}")
        print(f"   Updated fields: {', '.join(result['updated_fields'])}")
    else:
        print(f"[ERROR] Failed to update {model_id}: {response.text}")


def batch_update_models(updates_file: str) -> None:
    """Batch update models from a JSON file"""
    
    # Load updates from file
    with open(updates_file, 'r', encoding='utf-8') as f:
        updates = json.load(f)
    
    url = f"{ADMIN_ENDPOINT}/models/batch-update-scores"
    
    # Ensure correct format
    if isinstance(updates, list):
        updates = {"updates": updates}
    
    response = requests.post(url, json=updates)
    
    if response.status_code == 200:
        result = response.json()
        print(f"[SUCCESS] Batch update completed")
        print(f"   Successful: {len(result['successful_updates'])}")
        print(f"   Errors: {len(result['errors'])}")
        
        if result['errors']:
            print("\n[ERROR] Errors:")
            for error in result['errors']:
                print(f"   - {error}")
    else:
        print(f"[ERROR] Batch update failed: {response.text}")


def reset_to_seed() -> None:
    """Reset all models to seed data scores"""
    url = f"{ADMIN_ENDPOINT}/models/reset-to-seed"
    
    response = requests.post(url)
    
    if response.status_code == 200:
        result = response.json()
        print(f"[SUCCESS] {result['message']}")
    else:
        print(f"[ERROR] Reset failed: {response.text}")


def get_model_scores(model_id: str) -> None:
    """Get current scores for a model"""
    url = f"{ADMIN_ENDPOINT}/models/{model_id}/scores"
    
    response = requests.get(url)
    
    if response.status_code == 200:
        result = response.json()
        print(f"\n[INFO] Scores for {result['name']} ({model_id}):")
        print(f"   Overall Score: {result['overall_score']}")
        print(f"   Individual Scores:")
        for key, value in result['scores'].items():
            print(f"      - {key}: {value}")
    else:
        print(f"[ERROR] Failed to get scores: {response.text}")


def main():
    parser = argparse.ArgumentParser(description="Update AI model scores")
    
    # Single model update
    parser.add_argument("--model", help="Model ID to update")
    parser.add_argument("--overall", type=float, help="Overall score")
    parser.add_argument("--rhythm", type=float, help="Rhythm score")
    parser.add_argument("--composition", type=float, help="Composition score")
    parser.add_argument("--narrative", type=float, help="Narrative score")
    parser.add_argument("--emotion", type=float, help="Emotion score")
    parser.add_argument("--creativity", type=float, help="Creativity score")
    parser.add_argument("--cultural", type=float, help="Cultural score")
    
    # Batch update
    parser.add_argument("--batch", help="JSON file with batch updates")
    
    # Reset to seed
    parser.add_argument("--reset-to-seed", action="store_true", 
                       help="Reset all models to seed data scores")
    
    # Get scores
    parser.add_argument("--get", help="Get scores for a model")
    
    # API URL override
    parser.add_argument("--api-url", default="http://localhost:8001",
                       help="API base URL (default: http://localhost:8001)")
    
    args = parser.parse_args()
    
    # Update API URL if provided
    if args.api_url:
        global API_BASE_URL, ADMIN_ENDPOINT
        API_BASE_URL = f"{args.api_url}/api/v1"
        ADMIN_ENDPOINT = f"{API_BASE_URL}/admin"
    
    # Handle different operations
    if args.reset_to_seed:
        print("[INFO] Resetting all models to seed data scores...")
        reset_to_seed()
    
    elif args.batch:
        print(f"[INFO] Batch updating models from {args.batch}...")
        batch_update_models(args.batch)
    
    elif args.get:
        get_model_scores(args.get)
    
    elif args.model:
        # Build scores dict from arguments
        scores = {}
        if args.overall is not None:
            scores["overall_score"] = args.overall
        if args.rhythm is not None:
            scores["rhythm_score"] = args.rhythm
        if args.composition is not None:
            scores["composition_score"] = args.composition
        if args.narrative is not None:
            scores["narrative_score"] = args.narrative
        if args.emotion is not None:
            scores["emotion_score"] = args.emotion
        if args.creativity is not None:
            scores["creativity_score"] = args.creativity
        if args.cultural is not None:
            scores["cultural_score"] = args.cultural
        
        if scores:
            print(f"[INFO] Updating {args.model}...")
            update_single_model(args.model, scores)
        else:
            print("[ERROR] No scores provided to update")
    
    else:
        parser.print_help()


if __name__ == "__main__":
    main()