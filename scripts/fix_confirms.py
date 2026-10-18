import os
import re

def fix_confirms():
    count = 0
    for root, dirs, files in os.walk('src'):
        for f in files:
            if f.endswith('.tsx') or f.endswith('.ts'):
                path = os.path.join(root, f)
                with open(path, 'r', encoding='utf-8', errors='ignore') as file:
                    content = file.read()
                
                orig = content
                
                # Replace if (!window.confirm(...)) return; across newlines
                content = re.sub(r'if\s*\(\s*!?\s*(?:window\.)?confirm\([^)]*\)\s*\)\s*return\s*;?', '', content)
                content = re.sub(r'if\s*\(\s*(?:window\.)?confirm\([^)]*\)\s*\)\s*\{', 'if (true) {', content)
                
                if content != orig:
                    with open(path, 'w', encoding='utf-8') as file:
                        file.write(content)
                    count += 1
                    print(f"Fixed: {path}")

    print(f"Total fixed: {count}")

if __name__ == '__main__':
    fix_confirms()
