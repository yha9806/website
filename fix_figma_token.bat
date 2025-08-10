@echo off
echo =====================================
echo Figma Token 修复脚本
echo =====================================
echo.

echo 第1步：生成新的Figma Token
echo -------------------------------
echo 1. 打开浏览器访问: https://www.figma.com/settings
echo 2. 登录您的账户（如果需要）
echo 3. 在左侧菜单找到 "Personal access tokens"
echo 4. 点击 "Generate new token"
echo 5. 输入名称: Claude_MCP_Full_Access
echo 6. 选择过期时间: 90 days
echo.
echo 重要：必须选择以下所有权限：
echo   [x] current_user:read
echo   [x] file_content:read
echo   [x] file_content:write（如果可用）
echo   [x] file_variables:read
echo   [x] file_variables:write
echo   [x] file_comments:read
echo   [x] file_comments:write
echo   [x] webhooks:write
echo   [x] library_analytics:read
echo   [x] file_dev_resources:read
echo   [x] file_dev_resources:write
echo   [x] code_connect:write（如果可用）
echo.
echo 7. 点击 "Generate token"
echo 8. 立即复制Token（只显示一次！）
echo.
pause

echo.
echo 第2步：输入新Token
echo -------------------------------
set /p NEW_TOKEN=请粘贴您的新Token: 
echo.

echo 第3步：验证Token
echo -------------------------------
echo 正在测试Token...
curl -s -H "X-Figma-Token: %NEW_TOKEN%" https://api.figma.com/v1/me > temp_result.txt
findstr "email" temp_result.txt > nul
if %errorlevel% == 0 (
    echo [成功] Token验证通过！
    echo.
    type temp_result.txt
) else (
    echo [错误] Token验证失败！
    echo 响应内容：
    type temp_result.txt
    echo.
    echo 请确保选择了所有权限，特别是 current_user:read
    del temp_result.txt
    pause
    exit /b 1
)
del temp_result.txt

echo.
echo 第4步：保存Token
echo -------------------------------
echo %NEW_TOKEN% > FIGMA_TOKEN_NEW.txt
echo Token已保存到 FIGMA_TOKEN_NEW.txt

echo.
echo 第5步：更新MCP配置
echo -------------------------------
echo 正在更新Claude Code MCP配置...

REM 移除旧的figma配置
claude mcp remove figma 2>nul

REM 添加新配置
echo 添加新的MCP配置...
claude mcp add figma -- cmd /c npx -y @modelcontextprotocol/server-figma

REM 设置环境变量
claude mcp update figma --env FIGMA_PERSONAL_ACCESS_TOKEN=%NEW_TOKEN%

echo.
echo 第6步：测试MCP连接
echo -------------------------------
claude mcp health figma

echo.
echo 第7步：测试文件访问
echo -------------------------------
echo 测试访问您的Figma文件...
curl -s -H "X-Figma-Token: %NEW_TOKEN%" https://api.figma.com/v1/files/QXOBuLdzm7zy2CSnGqArEl > file_test.txt
findstr "name" file_test.txt > nul
if %errorlevel% == 0 (
    echo [成功] 可以访问文件！
) else (
    echo [警告] 无法访问该文件，可能需要其他权限
    echo 响应内容：
    type file_test.txt
)
del file_test.txt

echo.
echo =====================================
echo 配置完成！
echo =====================================
echo.
echo 后续步骤：
echo 1. 重启Claude Code: 
echo    taskkill /F /IM claude.exe
echo    claude
echo.
echo 2. 在Claude Code中测试：
echo    使用 mcp__figma__add_figma_file 工具
echo.
echo 3. 如果仍有问题，尝试使用社区版MCP：
echo    claude mcp add figma -- cmd /c npx -y figma-developer-mcp --figma-api-key=%NEW_TOKEN% --stdio
echo.
pause