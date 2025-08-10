@echo off
echo ==========================================
echo   Figma MCP Configuration Setup
echo ==========================================
echo.

set CONFIG_DIR=%APPDATA%\Claude
set CONFIG_FILE=%CONFIG_DIR%\claude_desktop_config.json

echo Checking for Claude configuration directory...
if not exist "%CONFIG_DIR%" (
    echo Creating directory: %CONFIG_DIR%
    mkdir "%CONFIG_DIR%"
)

echo.
echo Backing up existing configuration if present...
if exist "%CONFIG_FILE%" (
    copy "%CONFIG_FILE%" "%CONFIG_FILE%.backup" >nul
    echo Backup created: %CONFIG_FILE%.backup
)

echo.
echo Copying new configuration...
copy "figma-mcp-config-example.json" "%CONFIG_FILE%" >nul

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ✓ Configuration successfully installed!
    echo.
    echo Location: %CONFIG_FILE%
    echo.
    echo Next steps:
    echo 1. Close Claude Desktop completely (if running)
    echo 2. Restart Claude Desktop
    echo 3. The Figma MCP server will automatically initialize
    echo.
    echo You can now use Figma MCP commands like:
    echo - mcp__figma__add_figma_file
    echo - mcp__figma__view_node
    echo - mcp__figma__read_comments
    echo.
) else (
    echo.
    echo ✗ Error: Failed to copy configuration file
    echo Please manually copy figma-mcp-config-example.json to:
    echo %CONFIG_FILE%
)

echo ==========================================
echo.
pause