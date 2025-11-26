@echo off
echo ========================================
echo Building Development APK
echo ========================================
echo.
echo This will create a development APK that you can install on any Android device.
echo The build process will take approximately 10-15 minutes.
echo.
echo Build Options:
echo 1. Local Build (requires Android device connected via USB or Android emulator)
echo 2. Cloud Build (EAS Build - no local setup required)
echo.
set /p choice="Enter your choice (1 or 2): "

if "%choice%"=="1" (
    echo.
    echo Starting LOCAL BUILD...
    echo.
    echo Make sure:
    echo - Android device is connected via USB with USB debugging enabled, OR
    echo - Android emulator is running
    echo.
    pause
    echo.
    echo Building...
    call npx expo run:android --variant debug
) else if "%choice%"=="2" (
    echo.
    echo Starting CLOUD BUILD with EAS...
    echo.
    echo This will:
    echo 1. Build the APK on Expo's cloud servers
    echo 2. Provide a download link when complete
    echo 3. You can install the APK on any Android device
    echo.
    pause
    echo.
    echo Building...
    call npx eas build --platform android --profile development
) else (
    echo Invalid choice. Please run the script again and select 1 or 2.
    pause
    exit /b 1
)

echo.
echo ========================================
echo Build process completed!
echo ========================================
pause
