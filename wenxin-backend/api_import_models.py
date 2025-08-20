"""
通过生产API导入模型数据
使用授权账号通过API进行数据导入
"""
import asyncio
import aiohttp
import json
import sys
import io
from typing import Dict, Any, List

# 设置UTF-8编码
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

class APIImporter:
    def __init__(self):
        self.api_url = 'https://wenxin-moyun-api-229980166599.asia-east1.run.app/api/v1'
        self.token = None
    
    def generate_highlights(self, model_name: str, dimensions: Dict) -> List[str]:
        """根据维度分数生成高亮"""
        highlights = []
        if dimensions.get('composition', 0) > 85:
            highlights.append("优秀的结构设计")
        if dimensions.get('creativity', 0) > 85:
            highlights.append("富有创造力")
        if dimensions.get('cultural', 0) > 85:
            highlights.append("文化理解深刻")
        if dimensions.get('emotion', 0) > 80:
            highlights.append("情感表达丰富")
        if not highlights:
            highlights.append("综合表现良好")
        return highlights[:2]  # 最多返回2个
    
    def generate_weaknesses(self, model_name: str, dimensions: Dict) -> List[str]:
        """根据维度分数生成弱点"""
        weaknesses = []
        if dimensions.get('emotion', 0) < 70:
            weaknesses.append("情感深度不足")
        if dimensions.get('narrative', 0) < 75:
            weaknesses.append("叙事能力有待提升")
        if dimensions.get('creativity', 0) < 75:
            weaknesses.append("创新性不足")
        if not weaknesses:
            weaknesses.append("部分细节可改进")
        return weaknesses[:2]  # 最多返回2个
        
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
    
    async def get_current_models(self) -> List[Dict]:
        """获取当前模型列表"""
        try:
            print("\n📋 获取当前模型列表...")
            async with aiohttp.ClientSession() as session:
                headers = {}
                if self.token:
                    headers['Authorization'] = f'Bearer {self.token}'
                    
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
    
    async def delete_model(self, model_id: str) -> bool:
        """删除单个模型"""
        try:
            async with aiohttp.ClientSession() as session:
                headers = {'Authorization': f'Bearer {self.token}'}
                
                async with session.delete(
                    f'{self.api_url}/models/{model_id}',
                    headers=headers
                ) as resp:
                    return resp.status == 200
        except:
            return False
    
    async def clean_benchmark_models(self):
        """清理benchmark数据"""
        try:
            print("\n🗑️ 清理旧benchmark数据...")
            
            # 获取当前所有模型
            models = await self.get_current_models()
            benchmark_models = [m for m in models if m.get('data_source') == 'benchmark']
            
            if benchmark_models:
                print(f"  发现 {len(benchmark_models)} 个benchmark模型，开始删除...")
                deleted = 0
                for model in benchmark_models:
                    if await self.delete_model(model['id']):
                        deleted += 1
                        if deleted % 5 == 0:
                            print(f"    已删除 {deleted} 个模型...")
                print(f"  ✅ 成功删除 {deleted} 个模型")
            else:
                print("  没有找到benchmark模型")
                
        except Exception as e:
            print(f"❌ 清理失败: {e}")
    
    async def create_model(self, model_data: Dict) -> bool:
        """创建单个模型"""
        try:
            async with aiohttp.ClientSession() as session:
                headers = {
                    'Authorization': f'Bearer {self.token}',
                    'Content-Type': 'application/json'
                }
                
                async with session.post(
                    f'{self.api_url}/models/',
                    headers=headers,
                    json=model_data
                ) as resp:
                    if resp.status in [200, 201]:
                        return True
                    else:
                        text = await resp.text()
                        print(f"    创建失败: {resp.status} - {text[:100]}")
                        return False
        except Exception as e:
            print(f"    创建错误: {e}")
            return False
    
    async def import_models(self):
        """导入新模型数据"""
        try:
            print("\n📥 导入新模型数据...")
            
            # 读取comprehensive_v2.json
            with open('I:/website/wenxin-backend/benchmark_results/reports/comprehensive_v2.json', 'r', encoding='utf-8') as f:
                data = json.load(f)
            
            # 从global_rankings获取模型
            models = data.get('global_rankings', [])
            # 只导入有分数的模型
            valid_models = [m for m in models if m.get('average_score', 0) > 0]
            print(f"  准备导入 {len(valid_models)} 个模型")
            
            created = 0
            failed = 0
            
            for model_data in valid_models:
                # 准备模型数据 - 适应新的数据结构
                dimensions = model_data.get('average_dimensions', {})
                model = {
                    'name': model_data['display_name'],
                    'organization': model_data['provider'],
                    'version': '1.0',
                    'category': 'text',
                    'description': f"{model_data['provider']} {model_data['display_name']} - Advanced AI Model",
                    
                    # 分数
                    'overall_score': model_data['average_score'],
                    'rhythm_score': dimensions.get('rhythm', 0),
                    'composition_score': dimensions.get('composition', 0),
                    'narrative_score': dimensions.get('narrative', 0),
                    'emotion_score': dimensions.get('emotion', 0),
                    'creativity_score': dimensions.get('creativity', 0),
                    'cultural_score': dimensions.get('cultural', 0),
                    
                    # 元数据
                    'metrics': dimensions,
                    'data_source': 'benchmark',
                    'benchmark_score': model_data['average_score'],
                    'benchmark_metadata': {
                        'rank': model_data.get('rank', 0),
                        'tests_completed': model_data.get('tests_completed', 0),
                        'test_coverage': model_data.get('test_coverage', [])
                    },
                    'scoring_details': {
                        'total_score': model_data['average_score'],
                        'dimensions': dimensions
                    },
                    
                    # 高亮和弱点 - 根据分数生成
                    'score_highlights': self.generate_highlights(model_data['display_name'], dimensions),
                    'score_weaknesses': self.generate_weaknesses(model_data['display_name'], dimensions),
                    
                    # 状态
                    'is_active': True,
                    'is_verified': True,
                    'verification_count': model_data.get('tests_completed', 1),
                    'confidence_level': model_data.get('confidence', 0.95),
                    
                    # 其他
                    'release_date': '2024-01',
                    'tags': ['benchmark', 'tested', model_data['provider'].lower()]
                }
                
                # 创建模型
                if await self.create_model(model):
                    created += 1
                    print(f"  ✅ {model['name']} ({model['organization']}): {model['overall_score']:.1f}分")
                else:
                    failed += 1
                    print(f"  ❌ {model['name']} 创建失败")
                
                # 批量提交进度
                if (created + failed) % 5 == 0:
                    print(f"    进度: {created + failed}/{len(valid_models)}")
            
            print(f"\n✅ 导入完成!")
            print(f"  成功: {created} 个模型")
            print(f"  失败: {failed} 个模型")
            
            return created > 0
            
        except Exception as e:
            print(f"❌ 导入失败: {e}")
            import traceback
            traceback.print_exc()
            return False
    
    async def verify_import(self):
        """验证导入结果"""
        try:
            print("\n✅ 验证导入结果...")
            
            # 获取当前模型
            models = await self.get_current_models()
            benchmark_models = [m for m in models if m.get('data_source') == 'benchmark']
            
            print(f"  总计: {len(benchmark_models)} 个benchmark模型")
            
            # 排序并显示前5名
            benchmark_models.sort(key=lambda x: x.get('overall_score', 0), reverse=True)
            
            print("\n  🏆 Top 5 模型:")
            for i, model in enumerate(benchmark_models[:5], 1):
                print(f"    {i}. {model['name']} ({model['organization']}): {model.get('overall_score', 0):.1f}分")
                if model.get('score_highlights'):
                    print(f"       高亮: {model['score_highlights'][:2]}")
            
            return True
            
        except Exception as e:
            print(f"❌ 验证失败: {e}")
            return False
    
    async def run(self):
        """执行完整的导入流程"""
        print("="*60)
        print("🚀 通过API导入生产环境数据")
        print("="*60)
        
        # 1. 登录
        if not await self.login():
            print("❌ 无法登录，请检查账号密码")
            return False
        
        # 2. 清理旧数据
        await self.clean_benchmark_models()
        
        # 3. 导入新数据
        if not await self.import_models():
            return False
        
        # 4. 验证结果
        await self.verify_import()
        
        print("\n✅ 导入完成！")
        return True

async def main():
    importer = APIImporter()
    success = await importer.run()
    
    if success:
        print("\n🎉 数据已成功导入生产环境!")
        print("📱 请访问前端查看效果:")
        print("   https://storage.googleapis.com/wenxin-moyun-prod-new-static/index.html#/")
    else:
        print("\n❌ 导入失败，请检查错误信息")
        sys.exit(1)

if __name__ == "__main__":
    import os
    os.chdir('I:\\website\\wenxin-backend')
    asyncio.run(main())