const { chromium } = require('playwright');

async function testHomepageModels() {
  console.log('🚀 开始测试 WenXin MoYun 首页和模型功能...\n');
  
  const browser = await chromium.launch({ headless: false, slowMo: 1000 });
  const context = await browser.newContext();
  const page = await context.newPage();
  
  try {
    // 1. 访问首页
    console.log('1. 访问 http://localhost:5173/#/');
    await page.goto('http://localhost:5173/#/', { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);
    
    const title = await page.title();
    console.log('   ✅ 页面标题:', title);
    
    // 2. 查看首页的 "Model Rankings" 部分
    console.log('\n2. 查找首页的 "Model Rankings" 部分');
    
    // 等待页面加载并查找相关元素
    await page.waitForTimeout(3000);
    
    // 寻找Model Rankings相关的文本或元素
    const modelRankingsElements = await page.locator('text=Model').all();
    console.log('   找到包含"Model"的元素数量:', modelRankingsElements.length);
    
    const rankingElements = await page.locator('text=Ranking').all();
    console.log('   找到包含"Ranking"的元素数量:', rankingElements.length);
    
    // 查找可能的排行榜或表格元素
    const tables = await page.locator('table').all();
    console.log('   找到表格元素数量:', tables.length);
    
    const cards = await page.locator('[class*="card"], [class*="Card"]').all();
    console.log('   找到卡片元素数量:', cards.length);
    
    // 截取页面截图查看当前状态
    await page.screenshot({ path: 'I:/website/homepage_screenshot.png', fullPage: true });
    console.log('   📸 已保存页面截图: homepage_screenshot.png');
    
    // 3. 检查是否有AI模型数据显示
    console.log('\n3. 检查AI模型数据');
    
    // 查找OpenAI相关文本
    const openaiElements = await page.locator('text=/OpenAI|GPT|gpt/i').all();
    console.log('   找到OpenAI/GPT相关元素数量:', openaiElements.length);
    
    // 查找可能的模型名称
    const modelNames = ['GPT-4', 'GPT-3.5', 'Claude', 'Gemini', 'DALL-E'];
    for (const modelName of modelNames) {
      const elements = await page.locator(`text=${modelName}`).all();
      if (elements.length > 0) {
        console.log(`   ✅ 找到模型: ${modelName} (${elements.length}个元素)`);
      }
    }
    
    // 4. 查找并点击View按钮
    console.log('\n4. 查找View按钮');
    
    const viewButtons = await page.locator('text=View').all();
    console.log('   找到"View"按钮数量:', viewButtons.length);
    
    // 查找其他可能的按钮文本
    const buttonTexts = ['View', 'Details', '详情', '查看', 'See More'];
    let foundButton = null;
    
    for (const buttonText of buttonTexts) {
      const buttons = await page.locator(`text=${buttonText}`).all();
      if (buttons.length > 0) {
        console.log(`   找到"${buttonText}"按钮: ${buttons.length}个`);
        if (!foundButton && buttons.length > 0) {
          foundButton = buttons[0];
        }
      }
    }
    
    // 5. 如果找到按钮，尝试点击
    if (foundButton) {
      console.log('\n5. 点击第一个找到的按钮');
      const currentUrl = page.url();
      console.log('   点击前URL:', currentUrl);
      
      await foundButton.click();
      await page.waitForTimeout(2000);
      
      const newUrl = page.url();
      console.log('   点击后URL:', newUrl);
      
      if (currentUrl !== newUrl) {
        console.log('   ✅ URL发生变化，跳转成功');
        
        // 检查新页面内容
        const newTitle = await page.title();
        console.log('   新页面标题:', newTitle);
        
        // 截取新页面截图
        await page.screenshot({ path: 'I:/website/detail_page_screenshot.png', fullPage: true });
        console.log('   📸 已保存详情页截图: detail_page_screenshot.png');
        
      } else {
        console.log('   ⚠️ URL未变化，可能是页面内操作');
      }
    } else {
      console.log('\n5. ❌ 未找到可点击的View按钮');
    }
    
    // 6. 检查错误信息
    console.log('\n6. 检查控制台错误');
    
    // 监听控制台消息
    page.on('console', msg => {
      if (msg.type() === 'error') {
        console.log('   ❌ 控制台错误:', msg.text());
      }
    });
    
    // 检查网络错误
    page.on('response', response => {
      if (response.status() >= 400) {
        console.log(`   ❌ 网络错误: ${response.status()} ${response.url()}`);
      }
    });
    
    // 等待一段时间收集错误信息
    await page.waitForTimeout(3000);
    
    // 额外检查 - 尝试访问API端点
    console.log('\n7. 直接测试API端点');
    try {
      const response = await page.request.get('http://localhost:8001/api/models');
      const status = response.status();
      console.log('   API /api/models 状态码:', status);
      
      if (status === 200) {
        const data = await response.json();
        console.log('   ✅ API响应成功，模型数量:', data.length || '未知');
        if (data.length > 0) {
          console.log('   前3个模型:', data.slice(0, 3).map(m => m.name || m.id || '未知'));
        }
      }
    } catch (error) {
      console.log('   ❌ API测试失败:', error.message);
    }
    
  } catch (error) {
    console.log('❌ 测试过程中发生错误:', error.message);
  } finally {
    await browser.close();
  }
}

testHomepageModels().catch(console.error);