@echo off
echo Starting Cloud SQL Proxy...
cd /d I:\website\wenxin-backend
cloud_sql_proxy.exe -instances=wenxin-moyun-prod-new:asia-east1:wenxin-postgres=tcp:5432