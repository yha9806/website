@echo off
echo ========================================
echo   文心墨韵 - 简化启动脚本
echo ========================================
echo.

echo [1/3] 初始化数据库...
cd wenxin-backend
python init_db.py
if %errorlevel% neq 0 (
    echo ⚠️  数据库初始化失败（可能已存在数据）
    echo    继续启动服务...
)
echo ✅ 数据库准备完成

echo.
echo [2/3] 启动后端服务...
start cmd /k "cd /d %cd% && python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8001"
echo ✅ 后端服务启动中（端口 8001）...

echo.
echo [3/3] 启动前端服务...
cd ..\wenxin-moyun
start cmd /k "npm run dev"
echo ✅ 前端服务启动中（端口 5173）...

echo.
echo ========================================
echo   所有服务已启动！
echo ========================================
echo.
echo 📍 访问地址：
echo    前端：http://localhost:5173
echo    后端 API：http://localhost:8001
echo    API 文档：http://localhost:8001/docs
echo.
echo 📝 默认管理员账号：
echo    用户名：admin
echo    密码：admin123
echo.
echo 按任意键关闭此窗口...
pause > nul