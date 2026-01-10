import { test, expect } from '@playwright/test';

test.describe('View按钮功能测试', () => {
  test('测试View按钮跳转和模型详情页', async ({ page }) => {
    console.log('🔍 专门测试View按钮功能...\n');
    
    // 1. 访问排行榜页面
    console.log('1. 访问排行榜页面 http://localhost:5173/#/leaderboard');
    await page.goto('http://localhost:5173/#/leaderboard', { waitUntil: 'networkidle' });
    await page.waitForTimeout(3000);
    
    // 2. 查找第一个View按钮
    const viewButtons = page.locator('text=View');
    const viewButtonCount = await viewButtons.count();
    console.log(`   找到${viewButtonCount}个View按钮`);
    
    if (viewButtonCount > 0) {
      // 3. 获取第一个模型的信息
      const firstModelRow = page.locator('table tbody tr').first();
      const modelName = await firstModelRow.locator('td').nth(1).textContent();
      console.log(`   第一个模型: ${modelName}`);
      
      // 4. 点击第一个View按钮
      console.log('   点击第一个View按钮...');
      const currentUrl = page.url();
      console.log(`   点击前URL: ${currentUrl}`);
      
      await viewButtons.first().click();
      await page.waitForTimeout(2000);
      
      const newUrl = page.url();
      console.log(`   点击后URL: ${newUrl}`);
      
      // 5. 验证URL变化
      if (currentUrl !== newUrl) {
        console.log('   ✅ URL发生变化，跳转成功');
        
        // 检查是否跳转到模型详情页
        if (newUrl.includes('/model/')) {
          console.log('   ✅ 成功跳转到模型详情页');
          
          // 等待页面加载
          await page.waitForTimeout(2000);
          
          // 检查页面内容
          const pageTitle = await page.title();
          console.log(`   页面标题: ${pageTitle}`);
          
          // 查找模型详情相关元素
          const modelDetailElements = await page.locator('h1, h2, .model-name, [class*="model"]').count();
          console.log(`   找到模型详情相关元素: ${modelDetailElements}个`);
          
          // 检查是否有返回按钮或导航
          const backButtons = await page.locator('text=/Back|返回|上一页/i').count();
          const homeLinks = await page.locator('text=/Home|首页/i').count();
          console.log(`   找到返回/导航按钮: ${backButtons + homeLinks}个`);
          
          // 截图保存详情页
          await page.screenshot({ path: 'model_detail_page.png', fullPage: true });
          console.log('   📸 已保存模型详情页截图: model_detail_page.png');
          
        } else {
          console.log(`   ⚠️ 未跳转到模型详情页，而是跳转到: ${newUrl}`);
        }
      } else {
        console.log('   ❌ URL未变化，View按钮可能无效');
      }
      
    } else {
      console.log('   ❌ 未找到View按钮');
      
      // 检查是否有其他类型的链接按钮
      const allLinks = await page.locator('a').count();
      console.log(`   总链接数量: ${allLinks}`);
      
      const allButtons = await page.locator('button').count();
      console.log(`   总按钮数量: ${allButtons}`);
    }
    
    console.log('\n✅ View按钮测试完成');
  });
});