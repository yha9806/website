# Start Cloud SQL Proxy for WenXin MoYun
$env:GOOGLE_APPLICATION_CREDENTIALS = "$env:APPDATA\gcloud\application_default_credentials.json"

Write-Host "Starting Cloud SQL Proxy..." -ForegroundColor Green
Write-Host "Project: wenxin-moyun-prod-new" -ForegroundColor Yellow
Write-Host "Instance: asia-east1:wenxin-postgres" -ForegroundColor Yellow
Write-Host "Local Port: 5432" -ForegroundColor Yellow
Write-Host ""

# Start the proxy
& ".\cloud_sql_proxy.exe" --instances="wenxin-moyun-prod-new:asia-east1:wenxin-postgres=tcp:5432" --credential-file="$env:APPDATA\gcloud\application_default_credentials.json"