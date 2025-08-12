"""
响应收集器 - 第一阶段：收集所有模型的生成响应
只负责调用模型生成内容，不进行评分
"""
import asyncio
import json
import time
import os
from datetime import datetime
from typing import Dict, List, Any, Optional
from app.services.models import UnifiedModelClient, load_all_models

# 从enhanced_benchmark.py导入测试用例定义
from enhanced_benchmark import DIMENSION_TEST_CASES

class ResponseCollector:
    def __init__(self, checkpoint_file="collection_checkpoint.json"):
        self.client = UnifiedModelClient()
        self.checkpoint_file = checkpoint_file
        self.output_dir = "collected_responses"
        self.models = [
            "gpt-5", "gpt-5-mini", "gpt-5-nano",
            "o1", "o1-mini", "o3-mini",
            "gpt-4o", "gpt-4o-mini", "gpt-4-turbo", 
            "gpt-4", "gpt-4.5"
        ]
        
        # 创建输出目录
        os.makedirs(self.output_dir, exist_ok=True)
        
        # 加载模型配置
        load_all_models()
        print(f"Initialized ResponseCollector with {len(self.models)} models")
    
    def generate_test_list(self) -> List[Dict]:
        """生成所有测试组合列表"""
        test_list = []
        for model_id in self.models:
            for dimension, config in DIMENSION_TEST_CASES.items():
                for test_case in config["test_cases"]:
                    test_list.append({
                        "model_id": model_id,
                        "dimension": dimension,
                        "test_id": test_case["id"],
                        "prompt": test_case["prompt"],
                        "max_tokens": test_case.get("max_tokens", 200),
                        "temperature": test_case.get("temperature", 0.7),
                        "evaluation_criteria": test_case.get("evaluation_criteria", []),
                        "scoring_prompt": test_case.get("scoring_prompt", "")
                    })
        return test_list
    
    def load_checkpoint(self) -> Dict:
        """加载检查点，支持断点续传"""
        if os.path.exists(self.checkpoint_file):
            print(f"Loading checkpoint from {self.checkpoint_file}")
            with open(self.checkpoint_file, "r", encoding="utf-8") as f:
                checkpoint = json.load(f)
                print(f"Checkpoint loaded: {len(checkpoint['completed'])} completed, {len(checkpoint['pending'])} pending")
                return checkpoint
        
        # 初始化检查点
        checkpoint = {
            "start_time": datetime.now().isoformat(),
            "completed": [],
            "pending": self.generate_test_list(),
            "failed": [],
            "stats": {
                "total_tests": len(self.models) * sum(len(c["test_cases"]) for c in DIMENSION_TEST_CASES.values()),
                "completed_count": 0,
                "failed_count": 0
            }
        }
        print(f"Created new checkpoint with {checkpoint['stats']['total_tests']} total tests")
        return checkpoint
    
    def save_checkpoint(self, checkpoint: Dict):
        """保存检查点"""
        checkpoint["last_updated"] = datetime.now().isoformat()
        checkpoint["stats"]["completed_count"] = len(checkpoint["completed"])
        checkpoint["stats"]["failed_count"] = len(checkpoint["failed"])
        
        with open(self.checkpoint_file, "w", encoding="utf-8") as f:
            json.dump(checkpoint, f, indent=2, ensure_ascii=False)
    
    async def collect_single_response(self, test_item: Dict) -> Optional[Dict]:
        """收集单个测试的响应"""
        try:
            print(f"  Collecting: {test_item['model_id']} - {test_item['test_id']}")
            
            # 调用模型生成响应
            start_time = time.time()
            response = await self.client.generate(
                model_id=test_item["model_id"],
                prompt=test_item["prompt"],
                max_tokens=test_item["max_tokens"],
                temperature=test_item["temperature"]
            )
            elapsed_time = time.time() - start_time
            
            # 构建响应数据
            response_data = {
                "model_id": test_item["model_id"],
                "dimension": test_item["dimension"],
                "test_id": test_item["test_id"],
                "prompt": test_item["prompt"],
                "response": response.get("content", ""),
                "response_time": elapsed_time,
                "tokens_used": response.get("tokens_used", 0),
                "timestamp": datetime.now().isoformat(),
                "evaluation_criteria": test_item["evaluation_criteria"],
                "scoring_prompt": test_item["scoring_prompt"],
                "api_success": True
            }
            
            print(f"    Success ({elapsed_time:.2f}s, {response_data['tokens_used']} tokens)")
            return response_data
            
        except Exception as e:
            print(f"    Failed: {e}")
            return {
                "model_id": test_item["model_id"],
                "dimension": test_item["dimension"],
                "test_id": test_item["test_id"],
                "prompt": test_item["prompt"],
                "response": None,
                "error": str(e),
                "timestamp": datetime.now().isoformat(),
                "api_success": False
            }
    
    async def collect_model_responses(self, model_id: str, checkpoint: Dict) -> Dict:
        """收集单个模型的所有响应"""
        print(f"\nCollecting responses for model: {model_id}")
        print("-" * 40)
        
        model_file = f"{self.output_dir}/{model_id}_responses.json"
        
        # 检查是否已有部分数据
        if os.path.exists(model_file):
            with open(model_file, "r", encoding="utf-8") as f:
                model_data = json.load(f)
            print(f"Found existing data with {len(model_data['responses'])} responses")
        else:
            model_data = {
                "model_id": model_id,
                "collection_time": datetime.now().isoformat(),
                "responses": [],
                "stats": {
                    "total_tests": 0,
                    "successful": 0,
                    "failed": 0,
                    "total_time": 0,
                    "total_tokens": 0
                }
            }
        
        # 收集该模型的待处理测试
        model_pending = [t for t in checkpoint["pending"] if t["model_id"] == model_id]
        
        for test_item in model_pending:
            # 收集响应
            response_data = await self.collect_single_response(test_item)
            
            if response_data:
                model_data["responses"].append(response_data)
                
                # 更新统计
                if response_data["api_success"]:
                    model_data["stats"]["successful"] += 1
                    model_data["stats"]["total_time"] += response_data["response_time"]
                    model_data["stats"]["total_tokens"] += response_data["tokens_used"]
                else:
                    model_data["stats"]["failed"] += 1
                    checkpoint["failed"].append(test_item)
                
                # 更新检查点
                checkpoint["completed"].append(test_item)
                checkpoint["pending"].remove(test_item)
                
                # 保存进度（每个测试后都保存）
                model_data["stats"]["total_tests"] = len(model_data["responses"])
                with open(model_file, "w", encoding="utf-8") as f:
                    json.dump(model_data, f, indent=2, ensure_ascii=False)
                
                self.save_checkpoint(checkpoint)
            
            # 添加延迟避免API限流
            await asyncio.sleep(1)
        
        print(f"Model {model_id} collection completed:")
        print(f"  Successful: {model_data['stats']['successful']}")
        print(f"  Failed: {model_data['stats']['failed']}")
        print(f"  Total time: {model_data['stats']['total_time']:.2f}s")
        print(f"  Total tokens: {model_data['stats']['total_tokens']}")
        
        return model_data
    
    async def collect_all_responses(self):
        """收集所有模型的响应"""
        print("\n" + "="*50)
        print("RESPONSE COLLECTION PHASE")
        print("="*50)
        
        # 加载检查点
        checkpoint = self.load_checkpoint()
        
        # 创建汇总文件
        summary = {
            "collection_id": f"collect_{datetime.now().strftime('%Y%m%d_%H%M%S')}",
            "start_time": datetime.now().isoformat(),
            "test_definitions": DIMENSION_TEST_CASES,
            "models": {},
            "stats": {
                "total_models": len(self.models),
                "total_tests": checkpoint["stats"]["total_tests"],
                "completed_tests": 0,
                "failed_tests": 0
            }
        }
        
        # 收集每个模型的响应
        for model_id in self.models:
            # 检查是否还有该模型的待处理测试
            model_pending = [t for t in checkpoint["pending"] if t["model_id"] == model_id]
            
            if not model_pending:
                print(f"\nModel {model_id} already completed, skipping...")
                # 加载已有数据到汇总
                model_file = f"{self.output_dir}/{model_id}_responses.json"
                if os.path.exists(model_file):
                    with open(model_file, "r", encoding="utf-8") as f:
                        summary["models"][model_id] = json.load(f)
                continue
            
            try:
                model_data = await self.collect_model_responses(model_id, checkpoint)
                summary["models"][model_id] = model_data
                
            except Exception as e:
                print(f"Error collecting responses for {model_id}: {e}")
                continue
        
        # 更新统计
        summary["end_time"] = datetime.now().isoformat()
        summary["stats"]["completed_tests"] = len(checkpoint["completed"])
        summary["stats"]["failed_tests"] = len(checkpoint["failed"])
        
        # 保存汇总文件
        summary_file = f"{self.output_dir}/all_responses.json"
        with open(summary_file, "w", encoding="utf-8") as f:
            json.dump(summary, f, indent=2, ensure_ascii=False)
        
        print("\n" + "="*50)
        print("COLLECTION COMPLETED")
        print("="*50)
        print(f"Total completed: {summary['stats']['completed_tests']}")
        print(f"Total failed: {summary['stats']['failed_tests']}")
        print(f"Results saved to: {summary_file}")
        
        # 如果有失败的测试，保存失败列表
        if checkpoint["failed"]:
            failed_file = f"{self.output_dir}/failed_tests.json"
            with open(failed_file, "w", encoding="utf-8") as f:
                json.dump(checkpoint["failed"], f, indent=2, ensure_ascii=False)
            print(f"Failed tests saved to: {failed_file}")
        
        return summary

async def main():
    collector = ResponseCollector()
    await collector.collect_all_responses()

if __name__ == "__main__":
    asyncio.run(main())