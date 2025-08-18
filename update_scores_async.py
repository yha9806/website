#!/usr/bin/env python3
"""
Async script to update AI model scores with authentication support
Improved version using aiohttp for better performance

Usage:
    python update_scores_async.py --login admin admin123
    python update_scores_async.py --token <token> --model GPT-4o --overall 95.0
    python update_scores_async.py --token <token> --batch scores.json
    python update_scores_async.py --token <token> --reset-to-seed
"""

import argparse
import json
import asyncio
import aiohttp
from typing import Dict, Any, Optional


# API configuration
API_BASE_URL = "http://localhost:8001/api/v1"
ADMIN_ENDPOINT = f"{API_BASE_URL}/admin"
AUTH_ENDPOINT = f"{API_BASE_URL}/auth"


async def login(username: str, password: str) -> Optional[str]:
    """Login and get access token"""
    url = f"{AUTH_ENDPOINT}/login"
    
    # OAuth2 requires form data, not JSON
    data = aiohttp.FormData()
    data.add_field('username', username)
    data.add_field('password', password)
    
    async with aiohttp.ClientSession() as session:
        async with session.post(url, data=data) as response:
            if response.status == 200:
                result = await response.json()
                token = result.get('access_token')
                print(f"[SUCCESS] Logged in as {username}")
                print(f"[INFO] Access token: {token}")
                return token
            else:
                text = await response.text()
                print(f"[ERROR] Login failed: {text}")
                return None


async def update_single_model(
    model_id: str, 
    scores: Dict[str, float],
    token: str
) -> None:
    """Update scores for a single model"""
    url = f"{ADMIN_ENDPOINT}/models/{model_id}/scores"
    headers = {"Authorization": f"Bearer {token}"}
    
    async with aiohttp.ClientSession() as session:
        async with session.put(url, json=scores, headers=headers) as response:
            if response.status == 200:
                result = await response.json()
                print(f"[SUCCESS] Successfully updated {model_id}")
                print(f"   Updated fields: {', '.join(result['updated_fields'])}")
            elif response.status == 401:
                print("[ERROR] Authentication failed. Please login first or check your token.")
            elif response.status == 403:
                print("[ERROR] Permission denied. Admin access required.")
            else:
                text = await response.text()
                print(f"[ERROR] Failed to update {model_id}: {text}")


async def batch_update_models(
    updates_file: str,
    token: str
) -> None:
    """Batch update models from a JSON file"""
    
    # Load updates from file
    with open(updates_file, 'r', encoding='utf-8') as f:
        updates = json.load(f)
    
    url = f"{ADMIN_ENDPOINT}/models/batch-update-scores"
    headers = {"Authorization": f"Bearer {token}"}
    
    # Ensure correct format
    if isinstance(updates, list):
        updates = {"updates": updates}
    
    async with aiohttp.ClientSession() as session:
        async with session.post(url, json=updates, headers=headers) as response:
            if response.status == 200:
                result = await response.json()
                print(f"[SUCCESS] Batch update completed")
                print(f"   Successful: {len(result['successful_updates'])}")
                print(f"   Errors: {len(result['errors'])}")
                
                if result['errors']:
                    print("\n[ERROR] Errors:")
                    for error in result['errors']:
                        print(f"   - {error}")
            elif response.status == 401:
                print("[ERROR] Authentication failed. Please login first or check your token.")
            elif response.status == 403:
                print("[ERROR] Permission denied. Admin access required.")
            else:
                text = await response.text()
                print(f"[ERROR] Batch update failed: {text}")


async def reset_to_seed(token: str) -> None:
    """Reset all models to seed data scores"""
    url = f"{ADMIN_ENDPOINT}/models/reset-to-seed"
    headers = {"Authorization": f"Bearer {token}"}
    
    async with aiohttp.ClientSession() as session:
        async with session.post(url, headers=headers) as response:
            if response.status == 200:
                result = await response.json()
                print(f"[SUCCESS] {result['message']}")
            elif response.status == 401:
                print("[ERROR] Authentication failed. Please login first or check your token.")
            elif response.status == 403:
                print("[ERROR] Permission denied. Admin access required.")
            else:
                text = await response.text()
                print(f"[ERROR] Reset failed: {text}")


async def get_model_scores(model_id: str, token: Optional[str] = None) -> None:
    """Get current scores for a model"""
    url = f"{ADMIN_ENDPOINT}/models/{model_id}/scores"
    headers = {}
    if token:
        headers["Authorization"] = f"Bearer {token}"
    
    async with aiohttp.ClientSession() as session:
        async with session.get(url, headers=headers) as response:
            if response.status == 200:
                result = await response.json()
                print(f"\n[INFO] Scores for {result['name']} ({model_id}):")
                print(f"   Overall Score: {result['overall_score']}")
                print(f"   Individual Scores:")
                for key, value in result['scores'].items():
                    print(f"      - {key}: {value}")
            else:
                text = await response.text()
                print(f"[ERROR] Failed to get scores: {text}")


async def main():
    parser = argparse.ArgumentParser(description="Update AI model scores (async version)")
    
    # Authentication
    parser.add_argument("--login", nargs=2, metavar=("USERNAME", "PASSWORD"),
                       help="Login and get access token")
    parser.add_argument("--token", help="Access token for authentication")
    
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
        global API_BASE_URL, ADMIN_ENDPOINT, AUTH_ENDPOINT
        API_BASE_URL = f"{args.api_url}/api/v1"
        ADMIN_ENDPOINT = f"{API_BASE_URL}/admin"
        AUTH_ENDPOINT = f"{API_BASE_URL}/auth"
    
    # Handle login
    if args.login:
        username, password = args.login
        await login(username, password)
        return
    
    # For operations that require auth, check token
    if args.reset_to_seed or args.batch or (args.model and not args.get):
        if not args.token:
            print("[ERROR] Authentication required. Use --login to get a token or provide --token")
            print("Example: python update_scores_async.py --login admin admin123")
            return
    
    # Handle different operations
    if args.reset_to_seed:
        print("[INFO] Resetting all models to seed data scores...")
        await reset_to_seed(args.token)
    
    elif args.batch:
        print(f"[INFO] Batch updating models from {args.batch}...")
        await batch_update_models(args.batch, args.token)
    
    elif args.get:
        await get_model_scores(args.get, args.token)
    
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
            await update_single_model(args.model, scores, args.token)
        else:
            print("[ERROR] No scores provided to update")
    
    else:
        parser.print_help()


if __name__ == "__main__":
    asyncio.run(main())