// Google Cloud Console Automation Script
// Automates IAM permission configuration for GitHub Actions deployment

const { chromium } = require('playwright');

async function configureGCPPermissions() {
    console.log('🚀 Starting Google Cloud Console automation...');
    
    const browser = await chromium.launch({ 
        headless: false,  // Show browser for user authentication
        slowMo: 1000      // Slow down actions for visibility
    });
    
    const context = await browser.newContext();
    const page = await context.newPage();
    
    try {
        // Navigate to Google Cloud Console IAM page
        console.log('📋 Navigating to Google Cloud Console IAM...');
        await page.goto('https://console.cloud.google.com/iam-admin/iam?project=wenxin-moyun-prod');
        
        // Wait for authentication if needed
        console.log('⏳ Waiting for authentication (if required)...');
        await page.waitForTimeout(5000);
        
        // Take screenshot for verification
        await page.screenshot({ path: 'gcp-iam-page.png', fullPage: true });
        console.log('📸 Screenshot saved: gcp-iam-page.png');
        
        // Look for the service account
        console.log('🔍 Looking for service account: github-actions@wenxin-moyun-prod.iam.gserviceaccount.com');
        
        // Try to find the service account in the table
        const serviceAccountRow = await page.locator('tr').filter({ 
            hasText: 'github-actions@wenxin-moyun-prod.iam.gserviceaccount.com' 
        }).first();
        
        if (await serviceAccountRow.count() > 0) {
            console.log('✅ Service account found!');
            
            // Click on the service account to edit
            await serviceAccountRow.click();
            await page.waitForTimeout(2000);
            
            // Look for edit button or permissions panel
            const editButton = page.locator('button').filter({ hasText: /edit|编辑/i }).first();
            if (await editButton.isVisible()) {
                await editButton.click();
                console.log('📝 Clicked edit button');
                await page.waitForTimeout(2000);
            }
            
            // Look for "Add Role" or "添加角色" button
            const addRoleButton = page.locator('button').filter({ 
                hasText: /add role|添加角色|grant access/i 
            }).first();
            
            if (await addRoleButton.isVisible()) {
                await addRoleButton.click();
                console.log('➕ Clicked add role button');
                await page.waitForTimeout(2000);
                
                // Search for Artifact Registry Administrator role
                const roleSearchInput = page.locator('input[placeholder*="role"], input[placeholder*="角色"]').first();
                if (await roleSearchInput.isVisible()) {
                    await roleSearchInput.fill('Artifact Registry Administrator');
                    await page.waitForTimeout(1000);
                    
                    // Select the role from dropdown
                    const roleOption = page.locator('div, li').filter({ 
                        hasText: 'Artifact Registry Administrator' 
                    }).first();
                    
                    if (await roleOption.isVisible()) {
                        await roleOption.click();
                        console.log('✅ Selected Artifact Registry Administrator role');
                        
                        // Save the role assignment
                        const saveButton = page.locator('button').filter({ 
                            hasText: /save|保存|apply|应用/i 
                        }).first();
                        
                        if (await saveButton.isVisible()) {
                            await saveButton.click();
                            console.log('💾 Saved role assignment');
                            await page.waitForTimeout(3000);
                        }
                    }
                }
            }
        } else {
            console.log('❌ Service account not found in IAM list');
            console.log('📋 Listing all principals for debugging...');
            const allRows = await page.locator('tr').allTextContents();
            allRows.forEach((row, index) => {
                if (row.includes('@') || row.includes('service')) {
                    console.log(`Row ${index}: ${row.substring(0, 100)}...`);
                }
            });
        }
        
        // Navigate to Artifact Registry to create repository
        console.log('📦 Navigating to Artifact Registry...');
        await page.goto('https://console.cloud.google.com/artifacts?project=wenxin-moyun-prod');
        await page.waitForTimeout(3000);
        
        // Take screenshot of Artifact Registry page
        await page.screenshot({ path: 'gcp-artifact-registry.png', fullPage: true });
        console.log('📸 Screenshot saved: gcp-artifact-registry.png');
        
        // Check if repository already exists
        const existingRepo = await page.locator('a, div').filter({ 
            hasText: 'wenxin-images' 
        }).first();
        
        if (await existingRepo.count() > 0) {
            console.log('✅ wenxin-images repository already exists');
        } else {
            // Look for create repository button
            const createRepoButton = page.locator('button').filter({ 
                hasText: /create repository|创建代码库|create|创建/i 
            }).first();
            
            if (await createRepoButton.isVisible()) {
                await createRepoButton.click();
                console.log('➕ Clicked create repository button');
                await page.waitForTimeout(2000);
                
                // Fill repository details
                const nameInput = page.locator('input[name="name"], input[placeholder*="name"]').first();
                if (await nameInput.isVisible()) {
                    await nameInput.fill('wenxin-images');
                    console.log('📝 Entered repository name: wenxin-images');
                }
                
                // Select Docker format (should be default)
                const dockerOption = page.locator('input[value="DOCKER"], label').filter({ 
                    hasText: /docker/i 
                }).first();
                if (await dockerOption.isVisible()) {
                    await dockerOption.click();
                    console.log('🐳 Selected Docker format');
                }
                
                // Select asia-east1 region
                const regionDropdown = page.locator('select, input').filter({ 
                    hasText: /region|location|区域/i 
                }).first();
                if (await regionDropdown.isVisible()) {
                    await regionDropdown.selectOption('asia-east1');
                    console.log('🌏 Selected asia-east1 region');
                }
                
                // Submit the form
                const submitButton = page.locator('button').filter({ 
                    hasText: /create|创建|submit|提交/i 
                }).last();
                if (await submitButton.isVisible()) {
                    await submitButton.click();
                    console.log('✅ Submitted repository creation form');
                    await page.waitForTimeout(5000);
                }
            } else {
                console.log('❌ Create repository button not found');
            }
        }
        
        console.log('🎉 Google Cloud Console automation completed!');
        console.log('📋 Manual verification required:');
        console.log('   1. Check if Artifact Registry Administrator role was added');
        console.log('   2. Verify wenxin-images repository was created');
        console.log('   3. Trigger GitHub Actions deployment to test');
        
        // Keep browser open for 30 seconds for manual verification
        console.log('🔍 Keeping browser open for 30 seconds for manual verification...');
        await page.waitForTimeout(30000);
        
    } catch (error) {
        console.error('❌ Error during automation:', error);
        await page.screenshot({ path: 'gcp-error-screenshot.png', fullPage: true });
        console.log('📸 Error screenshot saved: gcp-error-screenshot.png');
    } finally {
        await browser.close();
        console.log('🔚 Browser closed');
    }
}

// Run the automation
configureGCPPermissions().catch(console.error);