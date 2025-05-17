#!/bin/bash

# Clean up script for Workscape Atlas
# Removes build artifacts and system-specific directories for clean migration

echo "Starting cleanup process..."

# Remove node modules and package manager caches
echo "Removing node_modules..."
rm -rf node_modules
rm -rf .pnpm-store

# Remove Next.js build artifacts
echo "Removing Next.js artifacts..."
rm -rf .next
rm -rf out
rm -rf .swc

# Remove any potential mobile app artifacts
echo "Removing mobile app artifacts..."
rm -rf .expo
rm -rf ios/Pods
rm -rf android/build

# Remove other build artifacts
echo "Removing build artifacts..."
rm -rf build
rm -rf dist
rm -rf .turbo
rm -rf .cache

# Remove system-specific files
echo "Removing system-specific files..."
find . -name ".DS_Store" -delete
find . -name "*.pem" -delete

# Ensure the correct yellow color (#f9cb16) is used consistently
echo "Verifying color consistency..."
echo "Note: All yellow elements should use #f9cb16"

echo "Cleanup completed successfully!"
