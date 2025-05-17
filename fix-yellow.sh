#!/bin/bash

# This script will directly update all yellow colors in the codebase to use the exact hex value #facc14
# This bypasses any issues with Tailwind's custom color processing

YELLOW_HEX="#facc14"
ROOT_DIR="/Users/ericntabi/Downloads/workscape-atlas"

echo "Fixing all yellow colors to use $YELLOW_HEX..."

# Replace Tailwind yellow classes with direct hex values
find $ROOT_DIR -type f \( -name "*.tsx" -o -name "*.jsx" -o -name "*.css" \) -not -path "*/node_modules/*" -not -path "*/.next/*" | xargs sed -i '' -e "s/bg-yellow-400/bg-\[$YELLOW_HEX\]/g"
find $ROOT_DIR -type f \( -name "*.tsx" -o -name "*.jsx" -o -name "*.css" \) -not -path "*/node_modules/*" -not -path "*/.next/*" | xargs sed -i '' -e "s/bg-yellow-300/bg-\[$YELLOW_HEX\]/g"
find $ROOT_DIR -type f \( -name "*.tsx" -o -name "*.jsx" -o -name "*.css" \) -not -path "*/node_modules/*" -not -path "*/.next/*" | xargs sed -i '' -e "s/bg-yellow-500/bg-\[$YELLOW_HEX\]/g"
find $ROOT_DIR -type f \( -name "*.tsx" -o -name "*.jsx" -o -name "*.css" \) -not -path "*/node_modules/*" -not -path "*/.next/*" | xargs sed -i '' -e "s/bg-yellow-600/bg-\[$YELLOW_HEX\]/g"
find $ROOT_DIR -type f \( -name "*.tsx" -o -name "*.jsx" -o -name "*.css" \) -not -path "*/node_modules/*" -not -path "*/.next/*" | xargs sed -i '' -e "s/bg-yellow/bg-\[$YELLOW_HEX\]/g"

find $ROOT_DIR -type f \( -name "*.tsx" -o -name "*.jsx" -o -name "*.css" \) -not -path "*/node_modules/*" -not -path "*/.next/*" | xargs sed -i '' -e "s/text-yellow-400/text-\[$YELLOW_HEX\]/g"
find $ROOT_DIR -type f \( -name "*.tsx" -o -name "*.jsx" -o -name "*.css" \) -not -path "*/node_modules/*" -not -path "*/.next/*" | xargs sed -i '' -e "s/text-yellow-300/text-\[$YELLOW_HEX\]/g"
find $ROOT_DIR -type f \( -name "*.tsx" -o -name "*.jsx" -o -name "*.css" \) -not -path "*/node_modules/*" -not -path "*/.next/*" | xargs sed -i '' -e "s/text-yellow-500/text-\[$YELLOW_HEX\]/g"
find $ROOT_DIR -type f \( -name "*.tsx" -o -name "*.jsx" -o -name "*.css" \) -not -path "*/node_modules/*" -not -path "*/.next/*" | xargs sed -i '' -e "s/text-yellow-600/text-\[$YELLOW_HEX\]/g"
find $ROOT_DIR -type f \( -name "*.tsx" -o -name "*.jsx" -o -name "*.css" \) -not -path "*/node_modules/*" -not -path "*/.next/*" | xargs sed -i '' -e "s/text-yellow/text-\[$YELLOW_HEX\]/g"

find $ROOT_DIR -type f \( -name "*.tsx" -o -name "*.jsx" -o -name "*.css" \) -not -path "*/node_modules/*" -not -path "*/.next/*" | xargs sed -i '' -e "s/hover:bg-yellow-400/hover:bg-\[$YELLOW_HEX\]/g"
find $ROOT_DIR -type f \( -name "*.tsx" -o -name "*.jsx" -o -name "*.css" \) -not -path "*/node_modules/*" -not -path "*/.next/*" | xargs sed -i '' -e "s/hover:bg-yellow-300/hover:bg-\[$YELLOW_HEX\]/g"
find $ROOT_DIR -type f \( -name "*.tsx" -o -name "*.jsx" -o -name "*.css" \) -not -path "*/node_modules/*" -not -path "*/.next/*" | xargs sed -i '' -e "s/hover:bg-yellow-500/hover:bg-\[$YELLOW_HEX\]/g"
find $ROOT_DIR -type f \( -name "*.tsx" -o -name "*.jsx" -o -name "*.css" \) -not -path "*/node_modules/*" -not -path "*/.next/*" | xargs sed -i '' -e "s/hover:bg-yellow-600/hover:bg-\[$YELLOW_HEX\]/g"
find $ROOT_DIR -type f \( -name "*.tsx" -o -name "*.jsx" -o -name "*.css" \) -not -path "*/node_modules/*" -not -path "*/.next/*" | xargs sed -i '' -e "s/hover:bg-yellow/hover:bg-\[$YELLOW_HEX\]/g"

find $ROOT_DIR -type f \( -name "*.tsx" -o -name "*.jsx" -o -name "*.css" \) -not -path "*/node_modules/*" -not -path "*/.next/*" | xargs sed -i '' -e "s/hover:text-yellow-400/hover:text-\[$YELLOW_HEX\]/g"
find $ROOT_DIR -type f \( -name "*.tsx" -o -name "*.jsx" -o -name "*.css" \) -not -path "*/node_modules/*" -not -path "*/.next/*" | xargs sed -i '' -e "s/hover:text-yellow-300/hover:text-\[$YELLOW_HEX\]/g"
find $ROOT_DIR -type f \( -name "*.tsx" -o -name "*.jsx" -o -name "*.css" \) -not -path "*/node_modules/*" -not -path "*/.next/*" | xargs sed -i '' -e "s/hover:text-yellow-500/hover:text-\[$YELLOW_HEX\]/g"
find $ROOT_DIR -type f \( -name "*.tsx" -o -name "*.jsx" -o -name "*.css" \) -not -path "*/node_modules/*" -not -path "*/.next/*" | xargs sed -i '' -e "s/hover:text-yellow-600/hover:text-\[$YELLOW_HEX\]/g"
find $ROOT_DIR -type f \( -name "*.tsx" -o -name "*.jsx" -o -name "*.css" \) -not -path "*/node_modules/*" -not -path "*/.next/*" | xargs sed -i '' -e "s/hover:text-yellow/hover:text-\[$YELLOW_HEX\]/g"

find $ROOT_DIR -type f \( -name "*.tsx" -o -name "*.jsx" -o -name "*.css" \) -not -path "*/node_modules/*" -not -path "*/.next/*" | xargs sed -i '' -e "s/border-yellow-400/border-\[$YELLOW_HEX\]/g"
find $ROOT_DIR -type f \( -name "*.tsx" -o -name "*.jsx" -o -name "*.css" \) -not -path "*/node_modules/*" -not -path "*/.next/*" | xargs sed -i '' -e "s/border-yellow-300/border-\[$YELLOW_HEX\]/g"
find $ROOT_DIR -type f \( -name "*.tsx" -o -name "*.jsx" -o -name "*.css" \) -not -path "*/node_modules/*" -not -path "*/.next/*" | xargs sed -i '' -e "s/border-yellow-500/border-\[$YELLOW_HEX\]/g"
find $ROOT_DIR -type f \( -name "*.tsx" -o -name "*.jsx" -o -name "*.css" \) -not -path "*/node_modules/*" -not -path "*/.next/*" | xargs sed -i '' -e "s/border-yellow-600/border-\[$YELLOW_HEX\]/g"
find $ROOT_DIR -type f \( -name "*.tsx" -o -name "*.jsx" -o -name "*.css" \) -not -path "*/node_modules/*" -not -path "*/.next/*" | xargs sed -i '' -e "s/border-yellow/border-\[$YELLOW_HEX\]/g"

find $ROOT_DIR -type f \( -name "*.tsx" -o -name "*.jsx" -o -name "*.css" \) -not -path "*/node_modules/*" -not -path "*/.next/*" | xargs sed -i '' -e "s/fill-yellow-400/fill-\[$YELLOW_HEX\]/g"
find $ROOT_DIR -type f \( -name "*.tsx" -o -name "*.jsx" -o -name "*.css" \) -not -path "*/node_modules/*" -not -path "*/.next/*" | xargs sed -i '' -e "s/fill-yellow-300/fill-\[$YELLOW_HEX\]/g"
find $ROOT_DIR -type f \( -name "*.tsx" -o -name "*.jsx" -o -name "*.css" \) -not -path "*/node_modules/*" -not -path "*/.next/*" | xargs sed -i '' -e "s/fill-yellow-500/fill-\[$YELLOW_HEX\]/g"
find $ROOT_DIR -type f \( -name "*.tsx" -o -name "*.jsx" -o -name "*.css" \) -not -path "*/node_modules/*" -not -path "*/.next/*" | xargs sed -i '' -e "s/fill-yellow-600/fill-\[$YELLOW_HEX\]/g"
find $ROOT_DIR -type f \( -name "*.tsx" -o -name "*.jsx" -o -name "*.css" \) -not -path "*/node_modules/*" -not -path "*/.next/*" | xargs sed -i '' -e "s/fill-yellow/fill-\[$YELLOW_HEX\]/g"

# Replace any hardcoded hex values
find $ROOT_DIR -type f \( -name "*.tsx" -o -name "*.jsx" -o -name "*.css" \) -not -path "*/node_modules/*" -not -path "*/.next/*" | xargs sed -i '' -e "s/#e8bf17/$YELLOW_HEX/g"

# Update the globe marker color
find $ROOT_DIR -type f -name "*.tsx" -not -path "*/node_modules/*" -not -path "*/.next/*" | xargs sed -i '' -e "s/\[232 \/ 255, 191 \/ 255, 23 \/ 255\]/\[250 \/ 255, 204 \/ 255, 20 \/ 255\]/g"

echo "Yellow color standardization complete! Restart the server to see the changes."
