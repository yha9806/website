"""
更新生产环境模型分数
使用comprehensive_v2.json的数据更新现有模型
"""
import asyncio
import aiohttp
import json
import sys
import io

# 设置UTF-8编码
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

class ScoreUpdater:
    def __init__(self):
        self.api_url = 'https://wenxin-moyun-api-229980166599.asia-east1.run.app/api/v1'
        self.token = None
        
    async def login(self):
        """登录获取token"""
        try:
            print("🔐 登录admin账号...")
            async with aiohttp.ClientSession() as session:
                form_data = aiohttp.FormData()
                form_data.add_field('username', 'admin')
                form_data.add_field('password', 'admin123')
                
                async with session.post(
                    f'{self.api_url}/auth/login',
                    data=form_data
                ) as resp:
                    if resp.status == 200:
                        data = await resp.json()
                        self.token = data.get('access_token')
                        print(f"✅ 登录成功")
                        return True
                    else:
                        print(f"❌ 登录失败: {resp.status}")
                        return False
        except Exception as e:
            print(f"❌ 登录错误: {e}")
            return False
    
    async def get_all_models(self):
        """获取所有模型"""
        try:
            print("\n📋 获取当前模型列表...")
            async with aiohttp.ClientSession() as session:
                headers = {'Authorization': f'Bearer {self.token}'}
                
                async with session.get(
                    f'{self.api_url}/models/',
                    headers=headers
                ) as resp:
                    if resp.status == 200:
                        models = await resp.json()
                        print(f"  找到 {len(models)} 个模型")
                        return models
                    else:
                        print(f"  获取失败: {resp.status}")
                        return []
        except Exception as e:
            print(f"❌ 获取模型错误: {e}")
            return []
    
    async def update_model_scores(self, model_id: str, scores: dict):
        """更新单个模型的分数"""
        try:
            async with aiohttp.ClientSession() as session:
                headers = {
                    'Authorization': f'Bearer {self.token}',
                    'Content-Type': 'application/json'
                }
                
                async with session.put(
                    f'{self.api_url}/admin/models/{model_id}/scores',
                    headers=headers,
                    json=scores
                ) as resp:
                    return resp.status in [200, 204]
        except:
            return False
    
    async def batch_update_scores(self):
        """批量更新所有模型的分数"""
        try:
            print("\n📊 准备更新模型分数...")
            
            # 读取comprehensive_v2.json
            with open('I:/website/wenxin-backend/benchmark_results/reports/comprehensive_v2.json', 'r', encoding='utf-8') as f:
                data = json.load(f)
            
            # 获取当前所有模型
            current_models = await self.get_all_models()
            if not current_models:
                print("❌ 没有找到模型")
                return False
            
            # 创建模型名称映射
            model_map = {model['name']: model for model in current_models}
            
            # 从global_rankings获取分数数据
            rankings = data.get('global_rankings', [])
            
            print(f"\n🔄 开始更新 {len(current_models)} 个模型的分数...")
            
            updated = 0
            failed = 0
            
            for ranking in rankings:
                model_name = ranking['display_name']
                
                if model_name in model_map:
                    model = model_map[model_name]
                    model_id = model['id']
                    
                    dimensions = ranking.get('average_dimensions', {})
                    
                    # 准备更新数据
                    update_data = {
                        'overall_score': ranking['average_score'],
                        'rhythm_score': dimensions.get('rhythm', 0),
                        'composition_score': dimensions.get('composition', 0),
                        'narrative_score': dimensions.get('narrative', 0),
                        'emotion_score': dimensions.get('emotion', 0),
                        'creativity_score': dimensions.get('creativity', 0),
                        'cultural_score': dimensions.get('cultural', 0),
                        'data_source': 'benchmark',
                        'benchmark_score': ranking['average_score'],
                        'benchmark_metadata': {
                            'rank': ranking.get('rank', 0),
                            'tests_completed': ranking.get('tests_completed', 0),
                            'test_coverage': ranking.get('test_coverage', [])
                        }
                    }
                    
                    # 更新模型
                    if await self.update_model_scores(model_id, update_data):
                        updated += 1
                        print(f"  ✅ {model_name}: {ranking['average_score']:.1f}分")
                    else:
                        failed += 1
                        print(f"  ❌ {model_name} 更新失败")
                else:
                    print(f"  ⚠️ {model_name} 不在数据库中")
            
            print(f"\n📊 更新结果:")
            print(f"  成功: {updated} 个")
            print(f"  失败: {failed} 个")
            
            return updated > 0
            
        except Exception as e:
            print(f"❌ 批量更新失败: {e}")
            import traceback
            traceback.print_exc()
            return False
    
    async def verify_update(self):
        """验证更新结果"""
        try:
            print("\n🔍 验证更新结果...")
            
            models = await self.get_all_models()
            
            # 过滤有分数的模型
            scored_models = [m for m in models if m.get('overall_score', 0) > 0]
            scored_models.sort(key=lambda x: x.get('overall_score', 0), reverse=True)
            
            print(f"\n📊 统计:")
            print(f"  总模型数: {len(models)}")
            print(f"  有分数的模型: {len(scored_models)}")
            
            if scored_models:
                print("\n🏆 Top 5 模型:")
                for i, model in enumerate(scored_models[:5], 1):
                    print(f"  {i}. {model['name']} ({model['organization']}): {model.get('overall_score', 0):.1f}分")
            
            return len(scored_models) > 0
            
        except Exception as e:
            print(f"❌ 验证失败: {e}")
            return False
    
    async def run(self):
        """执行完整的更新流程"""
        print("="*60)
        print("🚀 更新模型分数")
        print("="*60)
        
        # 1. 登录
        if not await self.login():
            print("❌ 无法登录")
            return False
        
        # 2. 批量更新分数
        if not await self.batch_update_scores():
            print("⚠️ 更新过程有错误")
        
        # 3. 验证结果
        success = await self.verify_update()
        
        if success:
            print("\n✅ 更新完成！")
        else:
            print("\n⚠️ 更新可能未完全成功")
        
        return success

async def main():
    updater = ScoreUpdater()
    success = await updater.run()
    
    if success:
        print("\n🎉 模型分数已成功更新!")
        print("📱 请访问前端查看效果:")
        print("   https://storage.googleapis.com/wenxin-moyun-prod-new-static/index.html#/")
        print("\n预期效果:")
        print("  - 显示28个Benchmark模型")
        print("  - 排名第一：gpt-5 (88.5分)")
        print("  - 排名第二：o1 (88.3分)")
        print("  - 排名第三：gpt-4o (87.3分)")
    else:
        print("\n❌ 更新失败")
        sys.exit(1)

if __name__ == "__main__":
    import os
    os.chdir('I:\\website\\wenxin-backend')
    asyncio.run(main())