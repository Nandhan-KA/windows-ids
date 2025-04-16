@echo off
setlocal enabledelayedexpansion

:: Check if required parameters are provided
if "%~1"=="" (
    echo Usage: %~nx0 [attack_type]
    echo.
    echo Available attack types:
    echo - brute_force or brute
    echo - ddos
    echo - port_scan or portscan
    echo - malware
    echo - mitm or man_in_the_middle
    echo - trojan
    echo.
    goto :exit
)

:: Set default values
set TARGET=localhost
set PORT=5000
set SEVERITY=medium
set ATTACK=%~1

:: Check if server is running
echo Checking connection to %TARGET%:%PORT%...
curl -s -m 5 "http://%TARGET%:%PORT%/api/health" > nul

if %errorlevel% neq 0 (
    echo ERROR: Cannot connect to http://%TARGET%:%PORT%
    echo Possible reasons:
    echo - Server not running on target
    echo - Firewall blocking the connection
    echo - Incorrect IP or port
    echo.
    goto :exit
)
echo Connection successful.
echo.

:: Set start time
for /f "tokens=1-4 delims=:." %%a in ("%time%") do (
    set /a "start_time=(((%%a*60)+1%%b%%100)*60+1%%c%%100)*100+1%%d%%100"
)

:: Simulate the specified attack
call :simulate_attack %ATTACK%

:: Record end time and calculate duration
for /f "tokens=1-4 delims=:." %%a in ("%time%") do (
    set /a "end_time=(((%%a*60)+1%%b%%100)*60+1%%c%%100)*100+1%%d%%100"
)
set /a "duration=(end_time-start_time)/100"

echo --------------------------------------------------
echo Attack simulation completed
echo Total duration: %duration% seconds
echo.

:exit
exit /b 0

:: Enhanced Windows IDS Attack Simulator
echo Windows IDS Attack Simulator
echo --------------------------------------

:: Default values
set TARGET=localhost
set PORT=5000
set ATTACK=all
set SEVERITY=medium

:: Parse command line arguments
:parse_args
if "%~1"=="" goto :run
if /i "%~1"=="--target" (
    set TARGET=%~2
    shift
    shift
    goto :parse_args
)
if /i "%~1"=="-t" (
    set TARGET=%~2
    shift
    shift
    goto :parse_args
)
if /i "%~1"=="--port" (
    set PORT=%~2
    shift
    shift
    goto :parse_args
)
if /i "%~1"=="-p" (
    set PORT=%~2
    shift
    shift
    goto :parse_args
)
if /i "%~1"=="--attack" (
    set ATTACK=%~2
    shift
    shift
    goto :parse_args
)
if /i "%~1"=="-a" (
    set ATTACK=%~2
    shift
    shift
    goto :parse_args
)
if /i "%~1"=="--severity" (
    set SEVERITY=%~2
    shift
    shift
    goto :parse_args
)
if /i "%~1"=="-s" (
    set SEVERITY=%~2
    shift
    shift
    goto :parse_args
)
shift
goto :parse_args

:run
echo.
echo ╔══════════════════════════════════════════════╗
echo ║                                              ║
echo ║         Windows IDS Attack Simulator         ║
echo ║                                              ║
echo ╚══════════════════════════════════════════════╝
echo.
echo Target: %TARGET%:%PORT%
echo Attack: %ATTACK%
echo Severity: %SEVERITY%
echo --------------------------------------------------

:: Check if target is reachable
ping -n 1 %TARGET% > nul
if %errorlevel% neq 0 (
    echo ERROR: Cannot reach target %TARGET% - check network connection
    echo.
    goto :exit
)

:: Check if port is open
echo Testing connection to %TARGET%:%PORT%...
curl -s -m 5 "http://%TARGET%:%PORT%/" > nul
if %errorlevel% neq 0 (
    echo ERROR: Cannot connect to http://%TARGET%:%PORT%
    echo Possible reasons:
    echo - Server not running on target
    echo - Firewall blocking the connection
    echo - Incorrect IP or port
    echo.
    goto :exit
)
echo Connection successful.
echo.

:: Set start time
for /f "tokens=1-4 delims=:." %%a in ("%time%") do (
    set /a "start_time=(((%%a*60)+1%%b%%100)*60+1%%c%%100)*100+1%%d%%100"
)

:: Function to simulate an attack
:simulate_attack
set ATTACK_TYPE=%~1
echo Simulating %ATTACK_TYPE% attack...

:: Map attack types
if /i "%ATTACK_TYPE%"=="brute_force" set FULL_TYPE=Brute Force
if /i "%ATTACK_TYPE%"=="brute" set FULL_TYPE=Brute Force
if /i "%ATTACK_TYPE%"=="ddos" set FULL_TYPE=DDoS
if /i "%ATTACK_TYPE%"=="port_scan" set FULL_TYPE=Port Scan
if /i "%ATTACK_TYPE%"=="portscan" set FULL_TYPE=Port Scan
if /i "%ATTACK_TYPE%"=="malware" set FULL_TYPE=Malware
if /i "%ATTACK_TYPE%"=="mitm" set FULL_TYPE=Man in the Middle
if /i "%ATTACK_TYPE%"=="man_in_the_middle" set FULL_TYPE=Man in the Middle
if /i "%ATTACK_TYPE%"=="trojan" set FULL_TYPE=Trojan

:: If mapping didn't work, use original type
if "%FULL_TYPE%"=="" set FULL_TYPE=%ATTACK_TYPE%

:: Generate random ID and IP
set /a "RANDOM_NUM=!RANDOM! * 10000 / 32768 + 1000"
set /a "IP3=!RANDOM! * 254 / 32768 + 1"
set /a "IP4=!RANDOM! * 254 / 32768 + 1"

:: Generate random string for more unique ID
set "RANDOM_STRING="
for /L %%i in (1,1,6) do (
    set /a "RANDOM_CHAR=!RANDOM! %% 36"
    if !RANDOM_CHAR! lss 10 (
        set "RANDOM_STRING=!RANDOM_STRING!!RANDOM_CHAR!"
    ) else (
        set /a "RANDOM_CHAR=!RANDOM_CHAR! + 87"
        set "RANDOM_STRING=!RANDOM_STRING!!RANDOM_CHAR:~-1!"
    )
)

:: Get attack description
call :get_description "%FULL_TYPE%"
set DESCRIPTION=%DESCRIPTION_RESULT%

:: Format timestamp
for /f "tokens=2 delims==." %%a in ('wmic os get LocalDateTime /value') do set TIMESTAMP=%%a
set TIMESTAMP=%TIMESTAMP:~0,4%-%TIMESTAMP:~4,2%-%TIMESTAMP:~6,2%T%TIMESTAMP:~8,2%:%TIMESTAMP:~10,2%:%TIMESTAMP:~12,2%

:: Create attack event JSON with more unique ID
set JSON={^
"id":"sim-%TIMESTAMP:~0,10%-%RANDOM_STRING%-%RANDOM_NUM%",^
"timestamp":"%TIMESTAMP%",^
"type":"threat",^
"severity":"%SEVERITY%",^
"source_ip":"192.168.%IP3%.%IP4%",^
"target":"System",^
"title":"%FULL_TYPE% Attack Detected",^
"description":"%DESCRIPTION%",^
"threat_type":"%FULL_TYPE%",^
"status":"active"^
}

:: Try the direct API endpoint
echo Sending attack data to API...
curl -s -m 5 -X POST "http://%TARGET%:%PORT%/api/debug/simulate-attack" ^
  -H "Content-Type: application/json" ^
  -d "%JSON%" > attack_response.txt

:: Check for success in response
type attack_response.txt | findstr "success" > nul
if %errorlevel% neq 0 (
    echo API Request failed. Trying alternative endpoint...
    
    :: Try attack-tester API
    curl -s -m 5 -X POST "http://%TARGET%:%PORT%/debug/attack-tester/api/simulate" ^
      -H "Content-Type: application/json" ^
      -d "{\"attack\":%JSON%,\"simulateOnly\":false}" > attack_response.txt
    
    type attack_response.txt | findstr "success" > nul
    if %errorlevel% neq 0 (
        :: Try fallback - direct page visit
        echo Trying fallback method - direct page visit...
        curl -s -m 5 "http://%TARGET%:%PORT%/debug/attack-tester" > nul
        
        if %errorlevel% neq 0 (
            echo ERROR: All attack simulation methods failed.
            echo.
            goto :eof
        )
    )
)

del attack_response.txt > nul 2>&1

echo %FULL_TYPE% attack simulation successful
echo.
goto :eof

:: Get description for attack type
:get_description
set ATTACK_DESC=%~1
if "%ATTACK_DESC%"=="Brute Force" (
    set DESCRIPTION_RESULT=Multiple failed login attempts detected from single source
) else if "%ATTACK_DESC%"=="Port Scan" (
    set DESCRIPTION_RESULT=Systematic scan of multiple ports detected
) else if "%ATTACK_DESC%"=="DDoS" (
    set DESCRIPTION_RESULT=Unusual traffic pattern consistent with distributed denial of service
) else if "%ATTACK_DESC%"=="Man in the Middle" (
    set DESCRIPTION_RESULT=Abnormal network routing detected, possible man-in-the-middle attack
) else if "%ATTACK_DESC%"=="Malware" (
    set DESCRIPTION_RESULT=Suspicious process behavior consistent with malware activity detected
) else if "%ATTACK_DESC%"=="Trojan" (
    set DESCRIPTION_RESULT=Suspicious outbound connection from trusted application detected
) else (
    set DESCRIPTION_RESULT=Suspicious activity detected
)
goto :eof

:: Run all attacks or specific attack
if /i "%ATTACK%"=="all" (
    call :simulate_attack "brute_force"
    timeout /t 2 /nobreak > nul
    call :simulate_attack "ddos"
    timeout /t 2 /nobreak > nul
    call :simulate_attack "port_scan"
    timeout /t 2 /nobreak > nul
    call :simulate_attack "malware"
    timeout /t 2 /nobreak > nul
    call :simulate_attack "mitm"
    timeout /t 2 /nobreak > nul
    call :simulate_attack "trojan"
) else (
    call :simulate_attack "%ATTACK%"
)

:: Set end time and calculate duration
for /f "tokens=1-4 delims=:." %%a in ("%time%") do (
    set /a "end_time=(((%%a*60)+1%%b%%100)*60+1%%c%%100)*100+1%%d%%100"
)
set /a "duration=(%end_time%-%start_time%)/100"
echo --------------------------------------------------
echo Attack simulation completed
echo Total duration: %duration% seconds

:exit
endlocal 