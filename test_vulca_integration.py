#!/usr/bin/env python3
"""
VULCA集成测试脚本 - 为Top 5模型生成VULCA评估数据
"""

import asyncio
import httpx
import json
from datetime import datetime

API_BASE_URL = "http://localhost:8001/api/v1"

# 测试内容
TEST_CONTENT = {
    "poem": """明月几时有，把酒问青天。
不知天上宫阙，今夕是何年。
我欲乘风归去，又恐琼楼玉宇，高处不胜寒。
起舞弄清影，何似在人间。""",
    
    "story": """在一个遥远的王国里，住着一位勇敢的骑士。他听说邻国的公主被恶龙困在高塔上，
决定踏上营救之旅。经过重重考验，骑士终于到达高塔，与恶龙展开激烈战斗。
最终，他用智慧和勇气战胜了恶龙，救出了公主。""",
    
    "painting": "一幅展现江南水乡的画作：小桥流水，白墙黛瓦，柳树依依，渔船点点。"
}

# Top 5 模型名称（会通过名称查找实际ID）
TOP_MODEL_NAMES = [
    "GPT-4o",
    "Claude 3.5 Sonnet",
    "o1-preview",
    "Llama 3.1 405B",
    "GPT-4 Turbo"
]

async def get_models():
    """获取所有模型列表"""
    async with httpx.AsyncClient(follow_redirects=True) as client:
        response = await client.get(f"{API_BASE_URL}/models")
        if response.status_code == 200:
            return response.json()
        else:
            print(f"Failed to get models: {response.status_code}")
            return []

async def evaluate_model(model_id: str, model_name: str):
    """为单个模型生成VULCA评估"""
    print(f"\n[EVALUATING] {model_name} (ID: {model_id})...")
    
    # 模拟6维基础评分（实际应从模型的metrics获取）
    mock_scores_6d = {
        "creativity": 85 + (hash(model_name) % 15),  # 85-99
        "technique": 80 + (hash(model_name + "t") % 20),  # 80-99
        "emotion": 82 + (hash(model_name + "e") % 18),  # 82-99
        "context": 78 + (hash(model_name + "c") % 22),  # 78-99
        "innovation": 83 + (hash(model_name + "i") % 17),  # 83-99
        "impact": 81 + (hash(model_name + "m") % 19)  # 81-99
    }
    
    evaluation_data = {
        "model_id": model_id,
        "model_name": model_name,
        "scores_6d": mock_scores_6d
    }
    
    async with httpx.AsyncClient(timeout=30.0) as client:
        try:
            response = await client.post(
                f"{API_BASE_URL}/vulca/evaluate",
                json=evaluation_data
            )
            
            if response.status_code == 200:
                result = response.json()
                print(f"[SUCCESS] Successfully evaluated {model_name}")
                print(f"   - 6D Scores: {json.dumps(result.get('scores_6d', {}), indent=2)}")
                print(f"   - 47D Dimensions: {len(result.get('scores_47d', {}))} dimensions")
                print(f"   - Cultural Perspectives: {len(result.get('cultural_perspectives', {}))} perspectives")
                return result
            else:
                print(f"[ERROR] Failed to evaluate {model_name}: {response.status_code}")
                print(f"   Error: {response.text}")
                return None
                
        except httpx.TimeoutException:
            print(f"[TIMEOUT] Timeout evaluating {model_name}")
            return None
        except Exception as e:
            print(f"[ERROR] Error evaluating {model_name}: {str(e)}")
            return None

async def check_vulca_data(model_id: str):
    """检查模型的VULCA数据是否已同步"""
    async with httpx.AsyncClient() as client:
        response = await client.get(
            f"{API_BASE_URL}/models/{model_id}",
            params={"include_vulca": True}
        )
        
        if response.status_code == 200:
            model_data = response.json()
            has_vulca = bool(model_data.get("vulca_scores_47d"))
            
            if has_vulca:
                print(f"[SYNCED] Model {model_id} has VULCA data synced")
                print(f"   - Evaluation Date: {model_data.get('vulca_evaluation_date', 'N/A')}")
                print(f"   - Sync Status: {model_data.get('vulca_sync_status', 'N/A')}")
            else:
                print(f"[PENDING] Model {model_id} does not have VULCA data yet")
            
            return has_vulca
        else:
            print(f"Failed to check model {model_id}: {response.status_code}")
            return False

async def main():
    print("=" * 60)
    print("VULCA Integration Test - Generating Test Data")
    print("=" * 60)
    
    # 获取模型列表
    print("\n[STEP 1] Fetching model list...")
    models = await get_models()
    
    if not models:
        print("[ERROR] No models found. Make sure the backend is running.")
        return
    
    print(f"[INFO] Found {len(models)} models in the system")
    
    # 筛选Top 5模型（通过名称匹配）
    top_models_info = []
    for model in models:
        if model["name"] in TOP_MODEL_NAMES:
            top_models_info.append({
                "id": model["id"],
                "name": model["name"],
                "organization": model.get("organization", "Unknown")
            })
    
    print(f"\n[STEP 2] Testing with Top {len(top_models_info)} models:")
    for model in top_models_info:
        print(f"   - {model['name']} ({model['organization']})")
    
    # 为每个模型生成VULCA评估
    print("\n[STEP 3] Generating VULCA evaluations...")
    results = []
    for model in top_models_info:
        result = await evaluate_model(model["id"], model["name"])
        if result:
            results.append({
                "model": model,
                "evaluation": result
            })
        await asyncio.sleep(1)  # 避免请求过快
    
    # 检查数据同步状态
    print("\n[STEP 4] Checking data synchronization...")
    await asyncio.sleep(2)  # 等待同步完成
    
    sync_status = []
    for model in top_models_info:
        is_synced = await check_vulca_data(model["id"])
        sync_status.append({
            "model_id": model["id"],
            "model_name": model["name"],
            "synced": is_synced
        })
    
    # 总结
    print("\n" + "=" * 60)
    print("Test Summary")
    print("=" * 60)
    
    successful = len([r for r in results if r])
    synced = len([s for s in sync_status if s["synced"]])
    
    print(f"[RESULT] Successfully evaluated: {successful}/{len(top_models_info)} models")
    print(f"[RESULT] Data synced to ai_models: {synced}/{len(top_models_info)} models")
    
    if successful == len(top_models_info) and synced == len(top_models_info):
        print("\n[PASSED] Integration test PASSED! All models evaluated and synced.")
        print("\nNext steps:")
        print("   1. Open http://localhost:5173/#/leaderboard")
        print("   2. Look for the '47D' button on evaluated models")
        print("   3. Click to expand and see the VULCA radar chart")
    else:
        print("\n[WARNING] Some evaluations or syncs failed. Check the logs above.")
    
    # 保存测试结果
    with open("vulca_test_results.json", "w", encoding="utf-8") as f:
        json.dump({
            "timestamp": datetime.now().isoformat(),
            "models_tested": len(top_models_info),
            "evaluations": results,
            "sync_status": sync_status
        }, f, indent=2, ensure_ascii=False)
    
    print(f"\n[SAVED] Test results saved to vulca_test_results.json")

if __name__ == "__main__":
    asyncio.run(main())