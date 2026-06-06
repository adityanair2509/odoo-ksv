#!/bin/bash

# VendorBridge Database Initialization Script for Linux/Mac

echo "========================================"
echo "VendorBridge Database Setup"
echo "========================================"
echo ""

# Check if PostgreSQL is installed
if ! command -v psql &> /dev/null; then
    echo "ERROR: PostgreSQL is not installed or not in PATH"
    echo "Please install PostgreSQL and add it to your PATH"
    exit 1
fi

echo "PostgreSQL found successfully"
echo ""

# Prompt for database credentials
read -p "Enter PostgreSQL username (default: postgres): " DB_USER
DB_USER=${DB_USER:-postgres}

read -s -p "Enter PostgreSQL password: " DB_PASSWORD
echo ""

read -p "Enter database name (default: vendorbridge): " DB_NAME
DB_NAME=${DB_NAME:-vendorbridge}

echo ""
echo "Creating database..."
echo ""

# Set PGPASSWORD environment variable for non-interactive login
export PGPASSWORD=$DB_PASSWORD

# Check if database exists and drop it if requested
echo "Checking if database '$DB_NAME' exists..."
DB_EXISTS=$(psql -U $DB_USER -tc "SELECT 1 FROM pg_database WHERE datname = '$DB_NAME'" | tr -d '[:space:]')

if [ "$DB_EXISTS" = "1" ]; then
    echo "Database '$DB_NAME' already exists."
    read -p "Do you want to drop and recreate it? (y/n): " DROP_DB
    if [ "$DROP_DB" = "y" ] || [ "$DROP_DB" = "Y" ]; then
        echo "Dropping existing database..."
        psql -U $DB_USER -c "DROP DATABASE $DB_NAME"
        if [ $? -ne 0 ]; then
            echo "ERROR: Failed to drop database"
            exit 1
        fi
        echo "Database dropped successfully"
    else
        echo "Using existing database"
    fi
fi

echo ""
echo "Creating database '$DB_NAME'..."
psql -U $DB_USER -c "CREATE DATABASE $DB_NAME"
if [ $? -ne 0 ]; then
    echo "ERROR: Failed to create database"
    exit 1
fi

echo "Database created successfully"
echo ""

# Run the schema
echo "Applying database schema..."
psql -U $DB_USER -d $DB_NAME -f schema.sql
if [ $? -ne 0 ]; then
    echo "ERROR: Failed to apply schema"
    exit 1
fi

echo ""
echo "========================================"
echo "Database setup completed successfully!"
echo "========================================"
echo ""
echo "Database: $DB_NAME"
echo "User: $DB_USER"
echo ""
echo "You can now connect to the database using:"
echo "psql -U $DB_USER -d $DB_NAME"
echo ""

# Clear the password from environment
unset PGPASSWORD
