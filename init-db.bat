@echo off
REM VendorBridge Database Initialization Script for Windows

echo ========================================
echo VendorBridge Database Setup
echo ========================================
echo.

REM Check if PostgreSQL is installed
where psql >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: PostgreSQL is not installed or not in PATH
    echo Please install PostgreSQL and add it to your PATH
    pause
    exit /b 1
)

echo PostgreSQL found successfully
echo.

REM Prompt for database credentials
set /p DB_USER="Enter PostgreSQL username (default: postgres): "
if "%DB_USER%"=="" set DB_USER=postgres

set /p DB_PASSWORD="Enter PostgreSQL password: "
set /p DB_NAME="Enter database name (default: vendorbridge): "
if "%DB_NAME%"=="" set DB_NAME=vendorbridge

echo.
echo Creating database...
echo.

REM Set PGPASSWORD environment variable for non-interactive login
set PGPASSWORD=%DB_PASSWORD%

REM Check if database exists and drop it if requested
echo Checking if database '%DB_NAME%' exists...
psql -U %DB_USER% -tc "SELECT 1 FROM pg_database WHERE datname = '%DB_NAME%'" | findstr /C:"1" >nul
if %ERRORLEVEL% EQU 0 (
    echo Database '%DB_NAME%' already exists.
    set /p DROP_DB="Do you want to drop and recreate it? (y/n): "
    if /i "%DROP_DB%"=="y" (
        echo Dropping existing database...
        psql -U %DB_USER% -c "DROP DATABASE %DB_NAME%"
        if %ERRORLEVEL% NEQ 0 (
            echo ERROR: Failed to drop database
            pause
            exit /b 1
        )
        echo Database dropped successfully
    ) else (
        echo Using existing database
    )
)

echo.
echo Creating database '%DB_NAME%'...
psql -U %DB_USER% -c "CREATE DATABASE %DB_NAME%"
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Failed to create database
    pause
    exit /b 1
)

echo Database created successfully
echo.

REM Run the schema
echo Applying database schema...
psql -U %DB_USER% -d %DB_NAME% -f schema.sql
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Failed to apply schema
    pause
    exit /b 1
)

echo.
echo ========================================
echo Database setup completed successfully!
echo ========================================
echo.
echo Database: %DB_NAME%
echo User: %DB_USER%
echo.
echo You can now connect to the database using:
echo psql -U %DB_USER% -d %DB_NAME%
echo.

REM Clear the password from environment
set PGPASSWORD=

pause
