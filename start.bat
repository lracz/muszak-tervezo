@echo off
echo =========================================
echo  Muszak Beosztas Tervezo Inditasa...
echo =========================================

echo [1/2] C# .NET Backend inditasa...
start "Backend API" cmd /k "cd MuszakBeosztasAPI && dotnet run"

echo [2/2] React Frontend inditasa...
start "React UI" cmd /k "cd muszak-beosztas-ui && npm run dev"

echo.
echo A szerverek elindultak kulon ablakokban!
echo Megnyitom a bongeszot...
timeout /t 3 >nul
start http://localhost:5173