@echo off
cd /d E:\SIPESDA-deploy\frontend
start cmd /k "npm run dev"
timeout /t 4 >nul
start http://localhost:5173
