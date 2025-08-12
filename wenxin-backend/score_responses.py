"""
响应评分器 - 第二阶段：对收集的响应进行评分
读取已收集的模型响应，使用GPT-4o-mini进行评分和分析
"""
import asyncio
import json
import os
from datetime import datetime
from typing import Dict, List, Any, Optional
from app.services.intelligent_scoring.ai_scorer import IntelligentScorer

# 导入测试用例定义以获取维度信息
from enhanced_benchmark import DIMENSION_TEST_CASES

class ResponseScorer:
    def __init__(self, response_dir="collected_responses", output_dir="scoring_results"):
        self.scorer = IntelligentScorer()
        self.response_dir = response_dir
        self.output_dir = output_dir
        self.checkpoint_file = "scoring_checkpoint.json"
        
        # 创建输出目录
        os.makedirs(self.output_dir, exist_ok=True)
        
        print(f"Initialized ResponseScorer")
        print(f"  Response directory: {self.response_dir}")
        print(f"  Output directory: {self.output_dir}")
    
    def load_checkpoint(self) -> Dict:
        """加载评分检查点"""
        if os.path.exists(self.checkpoint_file):
            print(f"Loading checkpoint from {self.checkpoint_file}")
            with open(self.checkpoint_file, "r", encoding="utf-8") as f:
                return json.load(f)
        
        # 初始化检查点
        return {
            "start_time": datetime.now().isoformat(),
            "scored_models": [],
            "pending_models": self.get_available_models(),
            "failed_models": []
        }
    
    def save_checkpoint(self, checkpoint: Dict):
        """保存评分检查点"""
        checkpoint["last_updated"] = datetime.now().isoformat()
        with open(self.checkpoint_file, "w", encoding="utf-8") as f:
            json.dump(checkpoint, f, indent=2, ensure_ascii=False)
    
    def get_available_models(self) -> List[str]:
        """获取可用的模型响应文件列表"""
        models = []
        if os.path.exists(self.response_dir):
            for filename in os.listdir(self.response_dir):
                if filename.endswith("_responses.json") and filename != "all_responses.json":
                    model_id = filename.replace("_responses.json", "")
                    models.append(model_id)
        return models
    
    async def score_single_response(self, response_data: Dict) -> Dict:
        """对单个响应进行评分"""
        try:
            # 如果响应失败，直接返回0分
            if not response_data.get("api_success", False) or not response_data.get("response"):
                return {
                    **response_data,
                    "score": 0,
                    "analysis": {
                        "strengths": [],
                        "weaknesses": ["No response generated"],
                        "suggestions": [],
                        "highlights": []
                    },
                    "scoring_success": False
                }
            
            # 使用GPT-4o-mini评分
            score = await self.scorer.score(
                prompt=response_data["prompt"],
                response=response_data["response"],
                criteria=response_data.get("evaluation_criteria", []),
                scoring_prompt=response_data.get("scoring_prompt", "Rate this response from 0-100")
            )
            
            # 获取详细分析
            analysis = await self.scorer.analyze_response(
                response_data["response"],
                response_data.get("evaluation_criteria", [])
            )
            
            return {
                **response_data,
                "score": score,
                "analysis": analysis,
                "scoring_success": True,
                "scoring_timestamp": datetime.now().isoformat()
            }
            
        except Exception as e:
            print(f"    Error scoring response: {e}")
            return {
                **response_data,
                "score": 0,
                "analysis": {"error": str(e)},
                "scoring_success": False
            }
    
    def calculate_metrics(self, scored_responses: List[Dict]) -> Dict[str, float]:
        """计算6维度的平均分"""
        metrics = {}
        
        for dimension in DIMENSION_TEST_CASES.keys():
            # 获取该维度的所有分数
            dimension_scores = [
                r["score"] for r in scored_responses 
                if r["dimension"] == dimension and r.get("scoring_success", False)
            ]
            
            if dimension_scores:
                metrics[dimension] = sum(dimension_scores) / len(dimension_scores)
            else:
                metrics[dimension] = 0.0
        
        return metrics
    
    def calculate_detailed_metrics(self, scored_responses: List[Dict]) -> Dict:
        """计算详细的维度指标，包括子分数"""
        detailed_metrics = {}
        
        for dimension in DIMENSION_TEST_CASES.keys():
            dimension_responses = [
                r for r in scored_responses 
                if r["dimension"] == dimension
            ]
            
            if dimension_responses:
                # 基础分数
                scores = [r["score"] for r in dimension_responses if r.get("scoring_success", False)]
                avg_score = sum(scores) / len(scores) if scores else 0
                
                # 收集所有优点和缺点
                all_strengths = []
                all_weaknesses = []
                all_highlights = []
                
                for r in dimension_responses:
                    if r.get("analysis"):
                        all_strengths.extend(r["analysis"].get("strengths", []))
                        all_weaknesses.extend(r["analysis"].get("weaknesses", []))
                        all_highlights.extend(r["analysis"].get("highlights", []))
                
                detailed_metrics[dimension] = {
                    "score": avg_score,
                    "test_count": len(dimension_responses),
                    "success_count": len(scores),
                    "common_strengths": list(set(all_strengths))[:5],  # 前5个常见优点
                    "common_weaknesses": list(set(all_weaknesses))[:3],  # 前3个常见缺点
                    "best_highlights": all_highlights[:3]  # 前3个亮点
                }
            else:
                detailed_metrics[dimension] = {
                    "score": 0,
                    "test_count": 0,
                    "success_count": 0
                }
        
        return detailed_metrics
    
    async def score_model_responses(self, model_id: str) -> Dict:
        """对单个模型的所有响应进行评分"""
        print(f"\nScoring responses for model: {model_id}")
        print("-" * 40)
        
        # 加载模型响应数据
        response_file = f"{self.response_dir}/{model_id}_responses.json"
        if not os.path.exists(response_file):
            print(f"Response file not found: {response_file}")
            return None
        
        with open(response_file, "r", encoding="utf-8") as f:
            model_data = json.load(f)
        
        print(f"Loaded {len(model_data['responses'])} responses")
        
        # 评分每个响应
        scored_responses = []
        for i, response_data in enumerate(model_data["responses"], 1):
            print(f"  Scoring {i}/{len(model_data['responses'])}: {response_data['test_id']}")
            scored = await self.score_single_response(response_data)
            scored_responses.append(scored)
            
            # 添加延迟避免API限流
            if i % 5 == 0:  # 每5个请求后延迟
                await asyncio.sleep(1)
        
        # 计算维度分数
        metrics = self.calculate_metrics(scored_responses)
        detailed_metrics = self.calculate_detailed_metrics(scored_responses)
        
        # 计算总分
        overall_score = sum(metrics.values()) / len(metrics) if metrics else 0
        
        # 构建评分结果
        scored_result = {
            "model_id": model_id,
            "scoring_time": datetime.now().isoformat(),
            "metrics": metrics,
            "detailed_metrics": detailed_metrics,
            "overall_score": overall_score,
            "detailed_scores": scored_responses,
            "stats": {
                "total_responses": len(scored_responses),
                "successful_scores": sum(1 for r in scored_responses if r.get("scoring_success", False)),
                "failed_scores": sum(1 for r in scored_responses if not r.get("scoring_success", False))
            }
        }
        
        # 保存评分结果
        output_file = f"{self.output_dir}/{model_id}_scored.json"
        with open(output_file, "w", encoding="utf-8") as f:
            json.dump(scored_result, f, indent=2, ensure_ascii=False)
        
        print(f"Scoring completed for {model_id}:")
        print(f"  Overall score: {overall_score:.2f}")
        print(f"  Metrics: {', '.join([f'{k}:{v:.1f}' for k, v in metrics.items()])}")
        print(f"  Results saved to: {output_file}")
        
        return scored_result
    
    async def score_all_responses(self):
        """对所有收集的响应进行评分"""
        print("\n" + "="*50)
        print("RESPONSE SCORING PHASE")
        print("="*50)
        
        # 加载检查点
        checkpoint = self.load_checkpoint()
        
        # 创建汇总结果
        summary = {
            "scoring_id": f"score_{datetime.now().strftime('%Y%m%d_%H%M%S')}",
            "scorer_model": "gpt-4o-mini",
            "start_time": datetime.now().isoformat(),
            "models": {},
            "rankings": []
        }
        
        # 评分每个模型
        for model_id in checkpoint["pending_models"]:
            try:
                print(f"\nProcessing model: {model_id}")
                scored_result = await self.score_model_responses(model_id)
                
                if scored_result:
                    summary["models"][model_id] = scored_result
                    
                    # 更新检查点
                    checkpoint["scored_models"].append(model_id)
                    checkpoint["pending_models"].remove(model_id)
                    self.save_checkpoint(checkpoint)
                else:
                    checkpoint["failed_models"].append(model_id)
                    
            except Exception as e:
                print(f"Error scoring model {model_id}: {e}")
                checkpoint["failed_models"].append(model_id)
                continue
        
        # 生成排名
        rankings = []
        for model_id, data in summary["models"].items():
            rankings.append({
                "rank": 0,  # 稍后计算
                "model_id": model_id,
                "overall_score": data["overall_score"],
                "metrics": data["metrics"]
            })
        
        # 按总分排序
        rankings.sort(key=lambda x: x["overall_score"], reverse=True)
        
        # 添加排名
        for i, item in enumerate(rankings, 1):
            item["rank"] = i
        
        summary["rankings"] = rankings
        summary["end_time"] = datetime.now().isoformat()
        
        # 保存汇总结果
        summary_file = f"{self.output_dir}/all_scored_results.json"
        with open(summary_file, "w", encoding="utf-8") as f:
            json.dump(summary, f, indent=2, ensure_ascii=False)
        
        # 打印排名摘要
        print("\n" + "="*50)
        print("SCORING COMPLETED - MODEL RANKINGS")
        print("="*50)
        
        for item in rankings[:10]:  # 显示前10名
            print(f"{item['rank']}. {item['model_id']:<15} Overall: {item['overall_score']:.2f}")
            if item["metrics"]:
                metrics_str = " | ".join([f"{k}:{v:.1f}" for k, v in item["metrics"].items()])
                print(f"   {metrics_str}")
        
        print(f"\nFull results saved to: {summary_file}")
        
        # 生成简化的排名报告
        self.generate_ranking_report(rankings)
        
        return summary
    
    def generate_ranking_report(self, rankings: List[Dict]):
        """生成排名报告"""
        report_file = f"{self.output_dir}/ranking_report.md"
        
        with open(report_file, "w", encoding="utf-8") as f:
            f.write("# OpenAI Model Benchmark Rankings\n\n")
            f.write(f"Generated: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n\n")
            
            f.write("## Overall Rankings\n\n")
            f.write("| Rank | Model | Overall Score | Rhythm | Composition | Narrative | Emotion | Creativity | Cultural |\n")
            f.write("|------|-------|--------------|--------|-------------|-----------|---------|------------|----------|\n")
            
            for item in rankings:
                m = item["metrics"]
                f.write(f"| {item['rank']} | {item['model_id']} | {item['overall_score']:.2f} | ")
                f.write(f"{m.get('rhythm', 0):.1f} | {m.get('composition', 0):.1f} | ")
                f.write(f"{m.get('narrative', 0):.1f} | {m.get('emotion', 0):.1f} | ")
                f.write(f"{m.get('creativity', 0):.1f} | {m.get('cultural', 0):.1f} |\n")
            
            f.write("\n## Dimension Analysis\n\n")
            
            for dimension in DIMENSION_TEST_CASES.keys():
                f.write(f"### {dimension.capitalize()}\n\n")
                
                # 按该维度排序
                dim_rankings = sorted(rankings, key=lambda x: x["metrics"].get(dimension, 0), reverse=True)
                
                f.write("| Rank | Model | Score |\n")
                f.write("|------|-------|-------|\n")
                
                for i, item in enumerate(dim_rankings[:5], 1):  # 每个维度显示前5
                    f.write(f"| {i} | {item['model_id']} | {item['metrics'].get(dimension, 0):.1f} |\n")
                
                f.write("\n")
        
        print(f"Ranking report saved to: {report_file}")

async def main():
    scorer = ResponseScorer()
    await scorer.score_all_responses()

if __name__ == "__main__":
    asyncio.run(main())