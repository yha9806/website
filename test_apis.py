#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
API端点测试脚本
批量测试文心墨韵平台的所有API端点
"""

import requests
import json
from typing import Dict, Any, List
from datetime import datetime

# API基础配置
BASE_URL = "http://localhost:8001/api/v1"
HEADERS = {"accept": "application/json", "Content-Type": "application/json"}

# 测试结果收集
test_results = []

def test_endpoint(name: str, method: str, url: str, **kwargs) -> Dict[str, Any]:
    """测试单个API端点"""
    print(f"\n测试: {name}")
    print(f"  方法: {method}")
    print(f"  URL: {url}")
    
    try:
        response = requests.request(method, url, headers=HEADERS, **kwargs)
        status = "[OK] 成功" if response.status_code < 400 else "[FAIL] 失败"
        
        # 尝试解析JSON
        try:
            data = response.json()
            # 只显示前200个字符避免输出过长
            data_preview = json.dumps(data, ensure_ascii=False, indent=2)[:200]
        except:
            data_preview = response.text[:200]
        
        result = {
            "name": name,
            "status": status,
            "code": response.status_code,
            "time": response.elapsed.total_seconds()
        }
        
        print(f"  状态: {status} ({response.status_code})")
        print(f"  响应时间: {response.elapsed.total_seconds():.3f}秒")
        print(f"  数据预览: {data_preview}...")
        
        test_results.append(result)
        return result
        
    except Exception as e:
        print(f"  [ERROR] 错误: {str(e)}")
        test_results.append({
            "name": name,
            "status": "[ERROR] 错误",
            "error": str(e)
        })
        return {"error": str(e)}

def main():
    """运行所有API测试"""
    print("=" * 60)
    print("文心墨韵 API 测试套件")
    print("=" * 60)
    
    # 1. 测试模型相关API
    print("\n【模型管理 API】")
    test_endpoint(
        "获取模型列表",
        "GET",
        f"{BASE_URL}/models/"
    )
    
    # 获取第一个模型的ID用于后续测试
    models_response = requests.get(f"{BASE_URL}/models/")
    if models_response.status_code == 200:
        models = models_response.json()
        if models and len(models) > 0:
            first_model_id = models[0]["id"]
            
            test_endpoint(
                "获取单个模型详情",
                "GET",
                f"{BASE_URL}/models/{first_model_id}"
            )
    
    # 2. 测试对战相关API
    print("\n【对战系统 API】")
    test_endpoint(
        "获取对战列表",
        "GET",
        f"{BASE_URL}/battles/",
        params={"page": 1, "page_size": 5}
    )
    
    test_endpoint(
        "获取随机对战",
        "GET",
        f"{BASE_URL}/battles/random"
    )
    
    # 获取第一个对战的ID用于测试
    battles_response = requests.get(f"{BASE_URL}/battles/")
    if battles_response.status_code == 200:
        battles_data = battles_response.json()
        if battles_data.get("battles") and len(battles_data["battles"]) > 0:
            first_battle_id = battles_data["battles"][0]["id"]
            
            test_endpoint(
                "获取单个对战详情",
                "GET",
                f"{BASE_URL}/battles/{first_battle_id}"
            )
    
    # 3. 测试作品相关API
    print("\n【作品管理 API】")
    test_endpoint(
        "获取作品列表",
        "GET",
        f"{BASE_URL}/artworks/",
        params={"page": 1, "page_size": 5}
    )
    
    # 按类型获取作品
    test_endpoint(
        "获取诗歌作品",
        "GET",
        f"{BASE_URL}/artworks/",
        params={"type": "poem", "page": 1, "page_size": 3}
    )
    
    # 获取第一个作品的ID
    artworks_response = requests.get(f"{BASE_URL}/artworks/")
    if artworks_response.status_code == 200:
        artworks_data = artworks_response.json()
        if artworks_data.get("artworks") and len(artworks_data["artworks"]) > 0:
            first_artwork_id = artworks_data["artworks"][0]["id"]
            
            test_endpoint(
                "获取单个作品详情",
                "GET",
                f"{BASE_URL}/artworks/{first_artwork_id}"
            )
    
    # 4. 测试认证相关API（不需要登录的部分）
    print("\n【认证系统 API】")
    
    # 登录API使用form-data格式
    login_headers = {"accept": "application/json"}
    test_endpoint(
        "测试登录（错误凭证）",
        "POST",
        f"{BASE_URL}/auth/login",
        data={"username": "test_user", "password": "wrong_password"},
        headers=login_headers
    )
    
    # 使用正确的管理员账号测试
    test_endpoint(
        "管理员登录",
        "POST",
        f"{BASE_URL}/auth/login",
        data={"username": "admin", "password": "admin123"},
        headers=login_headers
    )
    
    # 5. 生成测试报告
    print("\n" + "=" * 60)
    print("测试结果汇总")
    print("=" * 60)
    
    success_count = sum(1 for r in test_results if "[OK]" in r.get("status", ""))
    fail_count = sum(1 for r in test_results if "[FAIL]" in r.get("status", "") or "[ERROR]" in r.get("status", ""))
    
    print(f"\n总测试数: {len(test_results)}")
    print(f"[OK] 成功: {success_count}")
    print(f"[FAIL] 失败: {fail_count}")
    
    if fail_count > 0:
        print("\n失败的测试:")
        for result in test_results:
            if "[FAIL]" in result.get("status", "") or "[ERROR]" in result.get("status", ""):
                error_msg = result.get('error', f"HTTP {result.get('code', '')}")
                print(f"  - {result['name']}: {error_msg}")
    
    # 性能统计
    response_times = [r.get("time", 0) for r in test_results if "time" in r]
    if response_times:
        avg_time = sum(response_times) / len(response_times)
        max_time = max(response_times)
        min_time = min(response_times)
        
        print(f"\n性能统计:")
        print(f"  平均响应时间: {avg_time:.3f}秒")
        print(f"  最快响应: {min_time:.3f}秒")
        print(f"  最慢响应: {max_time:.3f}秒")
    
    print("\n测试完成！")
    
    # 保存详细报告到文件
    report = {
        "test_time": datetime.now().isoformat(),
        "base_url": BASE_URL,
        "summary": {
            "total": len(test_results),
            "success": success_count,
            "failed": fail_count
        },
        "results": test_results
    }
    
    with open("api_test_report.json", "w", encoding="utf-8") as f:
        json.dump(report, f, ensure_ascii=False, indent=2)
    
    print(f"\n详细报告已保存到: api_test_report.json")

if __name__ == "__main__":
    main()