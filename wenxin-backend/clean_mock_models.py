"""
清理生产环境的Mock模型数据
只保留benchmark数据源的模型
"""
import asyncio
import aiohttp
import json
import sys
import io
from typing import Dict, Any, List

# 设置UTF-8编码
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

class MockModelCleaner:
    def __init__(self):
        self.api_url = 'https://wenxin-moyun-api-229980166599.asia-east1.run.app/api/v1'
        self.token = None
        
    async def login(self):
        """登录获取token"""
        try:
            print("🔐 登录admin账号...")
            async with aiohttp.ClientSession() as session:
                # 使用form-data格式
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
                        text = await resp.text()
                        print(f"❌ 登录失败: {resp.status} - {text}")
                        return False
        except Exception as e:
            print(f"❌ 登录错误: {e}")
            return False
    
    async def get_all_models(self) -> List[Dict]:
        """获取所有模型列表"""
        try:
            print("\n📋 获取所有模型列表...")
            async with aiohttp.ClientSession() as session:
                headers = {}
                if self.token:
                    headers['Authorization'] = f'Bearer {self.token}'
                    
                async with session.get(
                    f'{self.api_url}/models',
                    headers=headers
                ) as resp:
                    if resp.status == 200:
                        models = await resp.json()
                        print(f"  找到总计 {len(models)} 个模型")
                        return models
                    else:
                        print(f"  获取失败: {resp.status}")
                        return []
        except Exception as e:
            print(f"❌ 获取模型错误: {e}")
            return []
    
    async def delete_model(self, model_id: str) -> bool:
        """删除单个模型"""
        try:
            async with aiohttp.ClientSession() as session:
                headers = {'Authorization': f'Bearer {self.token}'}
                
                async with session.delete(
                    f'{self.api_url}/models/{model_id}',
                    headers=headers
                ) as resp:
                    return resp.status in [200, 204]
        except:
            return False
    
    async def clean_mock_models(self):
        """清理所有mock模型，只保留benchmark模型"""
        try:
            # 获取所有模型
            all_models = await self.get_all_models()
            
            # 分类模型
            benchmark_models = []
            mock_models = []
            
            for model in all_models:
                if model.get('data_source') == 'benchmark':
                    benchmark_models.append(model)
                else:
                    mock_models.append(model)
            
            print(f"\n📊 模型分析:")
            print(f"  Benchmark模型: {len(benchmark_models)} 个")
            print(f"  Mock模型: {len(mock_models)} 个")
            
            if benchmark_models:
                print("\n✅ Benchmark模型列表（将保留）:")
                for i, model in enumerate(benchmark_models[:5], 1):
                    score = model.get('overall_score', 0)
                    if score is None:
                        score = 0
                    print(f"  {i}. {model['name']} ({model['organization']}): {score:.1f}分")
                if len(benchmark_models) > 5:
                    print(f"  ... 还有 {len(benchmark_models) - 5} 个")
            
            if mock_models:
                print(f"\n🗑️ 准备删除 {len(mock_models)} 个Mock模型...")
                
                # 显示将要删除的模型
                print("  将删除的Mock模型:")
                for i, model in enumerate(mock_models[:5], 1):
                    score = model.get('overall_score', 0)
                    if score is None:
                        score = 0
                    print(f"    {i}. {model['name']} ({model['organization']}): {score:.1f}分")
                if len(mock_models) > 5:
                    print(f"    ... 还有 {len(mock_models) - 5} 个")
                
                # 确认删除
                print("\n⚠️ 即将删除所有Mock模型，此操作不可恢复！")
                
                # 执行删除
                deleted = 0
                failed = 0
                
                for model in mock_models:
                    model_id = model.get('id')
                    model_name = model.get('name', 'Unknown')
                    
                    if await self.delete_model(model_id):
                        deleted += 1
                        print(f"  ✅ 删除成功: {model_name}")
                    else:
                        failed += 1
                        print(f"  ❌ 删除失败: {model_name}")
                    
                    # 显示进度
                    if (deleted + failed) % 10 == 0:
                        print(f"    进度: {deleted + failed}/{len(mock_models)}")
                
                print(f"\n📊 删除结果:")
                print(f"  成功删除: {deleted} 个")
                print(f"  删除失败: {failed} 个")
                
                return deleted > 0
            else:
                print("\n✅ 没有Mock模型需要删除")
                return True
                
        except Exception as e:
            print(f"❌ 清理失败: {e}")
            import traceback
            traceback.print_exc()
            return False
    
    async def verify_result(self):
        """验证清理结果"""
        try:
            print("\n🔍 验证清理结果...")
            
            # 获取当前所有模型
            models = await self.get_all_models()
            
            # 分类统计
            benchmark_count = 0
            mock_count = 0
            
            for model in models:
                if model.get('data_source') == 'benchmark':
                    benchmark_count += 1
                else:
                    mock_count += 1
            
            print(f"\n📊 最终统计:")
            print(f"  总模型数: {len(models)}")
            print(f"  Benchmark模型: {benchmark_count} 个")
            print(f"  Mock模型: {mock_count} 个")
            
            if mock_count == 0 and benchmark_count > 0:
                print("\n✅ 清理成功！只剩Benchmark模型")
                
                # 显示前5名
                benchmark_models = [m for m in models if m.get('data_source') == 'benchmark']
                benchmark_models.sort(key=lambda x: x.get('overall_score', 0), reverse=True)
                
                print("\n🏆 Top 5 Benchmark模型:")
                for i, model in enumerate(benchmark_models[:5], 1):
                    score = model.get('overall_score', 0)
                    if score is None:
                        score = 0
                    print(f"  {i}. {model['name']} ({model['organization']}): {score:.1f}分")
                
                return True
            else:
                print(f"\n⚠️ 还有 {mock_count} 个Mock模型未清理")
                return False
                
        except Exception as e:
            print(f"❌ 验证失败: {e}")
            return False
    
    async def run(self):
        """执行完整的清理流程"""
        print("="*60)
        print("🧹 清理Mock模型数据")
        print("="*60)
        
        # 1. 登录
        if not await self.login():
            print("❌ 无法登录，请检查账号密码")
            return False
        
        # 2. 清理Mock模型
        if not await self.clean_mock_models():
            print("⚠️ 清理过程中有错误")
        
        # 3. 验证结果
        success = await self.verify_result()
        
        if success:
            print("\n✅ 清理完成！")
        else:
            print("\n⚠️ 清理未完全成功，请检查")
        
        return success

async def main():
    cleaner = MockModelCleaner()
    success = await cleaner.run()
    
    if success:
        print("\n🎉 Mock模型已成功清理!")
        print("📱 请访问前端查看效果:")
        print("   https://storage.googleapis.com/wenxin-moyun-prod-new-static/index.html#/")
        print("\n预期效果:")
        print("  - 只显示28个Benchmark模型")
        print("  - 排名第一：gpt-5 (88.5分)")
        print("  - 排名第二：o1 (88.3分)")
        print("  - 排名第三：gpt-4o (87.3分)")
    else:
        print("\n❌ 清理失败，请检查错误信息")
        sys.exit(1)

if __name__ == "__main__":
    import os
    os.chdir('I:\\website\\wenxin-backend')
    asyncio.run(main())