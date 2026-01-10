@echo off
echo Starting Cloud SQL Proxy...
echo Project: wenxin-moyun-prod-new
echo Instance: wenxin-postgres
echo Port: 5432
echo.
cloud_sql_proxy.exe --instances=wenxin-moyun-prod-new:asia-east1:wenxin-postgres=tcp:5432
pause