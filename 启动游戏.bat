@echo off
echo Starting CO2STER local server...
echo Game will open in your browser at http://localhost:3000
echo Close this window to stop the server.

:: 尝试用 Python 启动
where python >nul 2>nul
if %errorlevel%==0 (
    start http://localhost:3000
    python -m http.server 3000
    goto :eof
)

:: Python 不可用，尝试用 Node.js (npx serve) 启动
where npx >nul 2>nul
if %errorlevel%==0 (
    start http://localhost:3000
    npx serve -l 3000
    goto :eof
)

:: 都没有，提示用户安装
echo.
echo ========================================
echo  ERROR: Python or Node.js is required!
echo ========================================
echo.
echo  Please install one of the following:
echo   - Python: https://www.python.org/downloads/
echo   - Node.js: https://nodejs.org/
echo.
echo  After installation, restart this script.
echo.
pause
