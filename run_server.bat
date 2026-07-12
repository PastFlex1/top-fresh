@echo off
:: Cerramos cualquier proceso de Node/Servidor que haya quedado abierto antes
taskkill /F /IM node.exe >nul 2>&1
cd /d "C:\Users\Alex Palma\Desktop\top-fresh"
npm run dev:all
