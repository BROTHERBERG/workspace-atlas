// This script will directly update all yellow colors in the codebase to use the exact hex value #facc14
// This bypasses any issues with Tailwind's custom color processing

const fs = require('fs');
const path = require('path');
const glob = require('glob');

const YELLOW_HEX = '#facc14';
const ROOT_DIR = '/Users/ericntabi/Downloads/workscape-atlas';

// Get all relevant files
const files = glob.sync(`${ROOT_DIR}/**/*.{tsx,jsx,css}`, {
  ignore: ['**/node_modules/**', '**/.next/**']
});

console.log(`Found ${files.length} files to process`);

// Patterns to replace
const replacements = [
  // Replace Tailwind yellow classes with direct hex values
  { from: /bg-yellow-400/g, to: `bg-[${YELLOW_HEX}]` },
  { from: /bg-yellow-300/g, to: `bg-[${YELLOW_HEX}]` },
  { from: /bg-yellow-500/g, to: `bg-[${YELLOW_HEX}]` },
  { from: /bg-yellow-600/g, to: `bg-[${YELLOW_HEX}]` },
  { from: /bg-yellow/g, to: `bg-[${YELLOW_HEX}]` },
  
  { from: /text-yellow-400/g, to: `text-[${YELLOW_HEX}]` },
  { from: /text-yellow-300/g, to: `text-[${YELLOW_HEX}]` },
  { from: /text-yellow-500/g, to: `text-[${YELLOW_HEX}]` },
  { from: /text-yellow-600/g, to: `text-[${YELLOW_HEX}]` },
  { from: /text-yellow/g, to: `text-[${YELLOW_HEX}]` },
  
  { from: /hover:bg-yellow-400/g, to: `hover:bg-[${YELLOW_HEX}]` },
  { from: /hover:bg-yellow-300/g, to: `hover:bg-[${YELLOW_HEX}]` },
  { from: /hover:bg-yellow-500/g, to: `hover:bg-[${YELLOW_HEX}]` },
  { from: /hover:bg-yellow-600/g, to: `hover:bg-[${YELLOW_HEX}]` },
  { from: /hover:bg-yellow/g, to: `hover:bg-[${YELLOW_HEX}]` },
  
  { from: /hover:text-yellow-400/g, to: `hover:text-[${YELLOW_HEX}]` },
  { from: /hover:text-yellow-300/g, to: `hover:text-[${YELLOW_HEX}]` },
  { from: /hover:text-yellow-500/g, to: `hover:text-[${YELLOW_HEX}]` },
  { from: /hover:text-yellow-600/g, to: `hover:text-[${YELLOW_HEX}]` },
  { from: /hover:text-yellow/g, to: `hover:text-[${YELLOW_HEX}]` },
  
  { from: /border-yellow-400/g, to: `border-[${YELLOW_HEX}]` },
  { from: /border-yellow-300/g, to: `border-[${YELLOW_HEX}]` },
  { from: /border-yellow-500/g, to: `border-[${YELLOW_HEX}]` },
  { from: /border-yellow-600/g, to: `border-[${YELLOW_HEX}]` },
  { from: /border-yellow/g, to: `border-[${YELLOW_HEX}]` },
  
  { from: /fill-yellow-400/g, to: `fill-[${YELLOW_HEX}]` },
  { from: /fill-yellow-300/g, to: `fill-[${YELLOW_HEX}]` },
  { from: /fill-yellow-500/g, to: `fill-[${YELLOW_HEX}]` },
  { from: /fill-yellow-600/g, to: `fill-[${YELLOW_HEX}]` },
  { from: /fill-yellow/g, to: `fill-[${YELLOW_HEX}]` },
  
  // Replace any hardcoded hex values
  { from: /#e8bf17/g, to: YELLOW_HEX },
  { from: /\[232 \/ 255, 191 \/ 255, 23 \/ 255\]/g, to: '[250 / 255, 204 / 255, 20 / 255]' },
];

// Process each file
files.forEach(filePath => {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;
    
    replacements.forEach(({ from, to }) => {
      if (from.test(content)) {
        content = content.replace(from, to);
        modified = true;
      }
    });
    
    if (modified) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`Updated: ${filePath}`);
    }
  } catch (error) {
    console.error(`Error processing ${filePath}:`, error);
  }
});

console.log('Yellow color standardization complete!');
