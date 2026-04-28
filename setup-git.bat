@echo off
cd /d "%~dp0"
git init
git add .
git commit -m "Initial commit - Complete Construction Management System with Material Request Workflow"
git branch -M main
git remote add origin https://github.com/DhamsaniyaPrince/Construction-Management.git
git push -u origin main
pause
