@echo off
title Art Auction System Starter
chcp 65001 >nul
echo ==================================================
echo         正在启动艺术品拍卖系统...
echo ==================================================

echo.
echo [1/2] 正在启动后端服务 (Backend)...
start "Art Auction Backend" cmd /k "cd backend && npm run dev"

echo.
echo [2/2] 正在启动前端服务 (Frontend)...
start "Art Auction Frontend" cmd /k "cd frontend && npm run dev"

echo.
echo ==================================================
echo 启动指令已发送！
echo 前端和后端服务已在新的命令行窗口中运行。
echo 如果想停止服务，请关闭弹出的两个命令行窗口。
echo ==================================================
echo.
pause
