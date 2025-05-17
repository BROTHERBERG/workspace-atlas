#!/bin/bash

# Update all instances of yellow-400, yellow-300, yellow-500, yellow-600 to the custom yellow
find /Users/ericntabi/Downloads/workscape-atlas -type f -name "*.tsx" -o -name "*.jsx" -o -name "*.css" | xargs sed -i '' -e 's/bg-yellow-400/bg-yellow/g'
find /Users/ericntabi/Downloads/workscape-atlas -type f -name "*.tsx" -o -name "*.jsx" -o -name "*.css" | xargs sed -i '' -e 's/bg-yellow-300/bg-yellow/g'
find /Users/ericntabi/Downloads/workscape-atlas -type f -name "*.tsx" -o -name "*.jsx" -o -name "*.css" | xargs sed -i '' -e 's/bg-yellow-500/bg-yellow/g'
find /Users/ericntabi/Downloads/workscape-atlas -type f -name "*.tsx" -o -name "*.jsx" -o -name "*.css" | xargs sed -i '' -e 's/bg-yellow-600/bg-yellow/g'

find /Users/ericntabi/Downloads/workscape-atlas -type f -name "*.tsx" -o -name "*.jsx" -o -name "*.css" | xargs sed -i '' -e 's/text-yellow-400/text-yellow/g'
find /Users/ericntabi/Downloads/workscape-atlas -type f -name "*.tsx" -o -name "*.jsx" -o -name "*.css" | xargs sed -i '' -e 's/text-yellow-300/text-yellow/g'
find /Users/ericntabi/Downloads/workscape-atlas -type f -name "*.tsx" -o -name "*.jsx" -o -name "*.css" | xargs sed -i '' -e 's/text-yellow-500/text-yellow/g'
find /Users/ericntabi/Downloads/workscape-atlas -type f -name "*.tsx" -o -name "*.jsx" -o -name "*.css" | xargs sed -i '' -e 's/text-yellow-600/text-yellow/g'

find /Users/ericntabi/Downloads/workscape-atlas -type f -name "*.tsx" -o -name "*.jsx" -o -name "*.css" | xargs sed -i '' -e 's/hover:bg-yellow-400/hover:bg-yellow/g'
find /Users/ericntabi/Downloads/workscape-atlas -type f -name "*.tsx" -o -name "*.jsx" -o -name "*.css" | xargs sed -i '' -e 's/hover:bg-yellow-300/hover:bg-yellow/g'
find /Users/ericntabi/Downloads/workscape-atlas -type f -name "*.tsx" -o -name "*.jsx" -o -name "*.css" | xargs sed -i '' -e 's/hover:bg-yellow-500/hover:bg-yellow/g'
find /Users/ericntabi/Downloads/workscape-atlas -type f -name "*.tsx" -o -name "*.jsx" -o -name "*.css" | xargs sed -i '' -e 's/hover:bg-yellow-600/hover:bg-yellow/g'

find /Users/ericntabi/Downloads/workscape-atlas -type f -name "*.tsx" -o -name "*.jsx" -o -name "*.css" | xargs sed -i '' -e 's/hover:text-yellow-400/hover:text-yellow/g'
find /Users/ericntabi/Downloads/workscape-atlas -type f -name "*.tsx" -o -name "*.jsx" -o -name "*.css" | xargs sed -i '' -e 's/hover:text-yellow-300/hover:text-yellow/g'
find /Users/ericntabi/Downloads/workscape-atlas -type f -name "*.tsx" -o -name "*.jsx" -o -name "*.css" | xargs sed -i '' -e 's/hover:text-yellow-500/hover:text-yellow/g'
find /Users/ericntabi/Downloads/workscape-atlas -type f -name "*.tsx" -o -name "*.jsx" -o -name "*.css" | xargs sed -i '' -e 's/hover:text-yellow-600/hover:text-yellow/g'

find /Users/ericntabi/Downloads/workscape-atlas -type f -name "*.tsx" -o -name "*.jsx" -o -name "*.css" | xargs sed -i '' -e 's/border-yellow-400/border-yellow/g'
find /Users/ericntabi/Downloads/workscape-atlas -type f -name "*.tsx" -o -name "*.jsx" -o -name "*.css" | xargs sed -i '' -e 's/border-yellow-300/border-yellow/g'
find /Users/ericntabi/Downloads/workscape-atlas -type f -name "*.tsx" -o -name "*.jsx" -o -name "*.css" | xargs sed -i '' -e 's/border-yellow-500/border-yellow/g'
find /Users/ericntabi/Downloads/workscape-atlas -type f -name "*.tsx" -o -name "*.jsx" -o -name "*.css" | xargs sed -i '' -e 's/border-yellow-600/border-yellow/g'

find /Users/ericntabi/Downloads/workscape-atlas -type f -name "*.tsx" -o -name "*.jsx" -o -name "*.css" | xargs sed -i '' -e 's/fill-yellow-400/fill-yellow/g'
find /Users/ericntabi/Downloads/workscape-atlas -type f -name "*.tsx" -o -name "*.jsx" -o -name "*.css" | xargs sed -i '' -e 's/fill-yellow-300/fill-yellow/g'
find /Users/ericntabi/Downloads/workscape-atlas -type f -name "*.tsx" -o -name "*.jsx" -o -name "*.css" | xargs sed -i '' -e 's/fill-yellow-500/fill-yellow/g'
find /Users/ericntabi/Downloads/workscape-atlas -type f -name "*.tsx" -o -name "*.jsx" -o -name "*.css" | xargs sed -i '' -e 's/fill-yellow-600/fill-yellow/g'

# Update any hardcoded hex values
find /Users/ericntabi/Downloads/workscape-atlas -type f -name "*.tsx" -o -name "*.jsx" -o -name "*.css" | xargs sed -i '' -e 's/#e8bf17/#facc14/g'
find /Users/ericntabi/Downloads/workscape-atlas -type f -name "*.tsx" -o -name "*.jsx" -o -name "*.css" | xargs sed -i '' -e 's/\[232 \/ 255, 191 \/ 255, 23 \/ 255\]/\[250 \/ 255, 204 \/ 255, 20 \/ 255\]/g'

echo "Updated all yellow colors to the universal yellow (#facc14)"
