@echo off
echo ========================================
echo Building Android APK
echo ========================================

cd /d "%~dp0"

echo.
echo Step 1: Checking EAS CLI...
call npx eas-cli --version
if %ERRORLEVEL% NEQ 0 (
    echo Installing EAS CLI...
    call npm install -g eas-cli
)

echo.
echo Step 2: Building APK (this may take 10-20 minutes)...
call npx eas build --platform android --profile preview --local

echo.
echo ========================================
echo Build Complete!
echo ========================================
echo APK location: Check the build output above
echo.
echo To upload to Google Drive:
echo 1. Open drive.google.com
echo 2. Upload the APK file
echo 3. Right-click and select "Get link"
echo 4. Share the link
echo.
pause
