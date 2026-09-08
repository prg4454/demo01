@echo off
echo Fixing Git index...
if exist .git\index.lock del /f /q .git\index.lock
if exist .git\index del /f /q .git\index
git reset
echo.
echo Git index successfully restored!

