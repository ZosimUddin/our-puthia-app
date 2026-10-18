import os
import glob

def process_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    original = content
    
    # Replace common primary button combinations
    content = content.replace('bg-blue-600 hover:bg-blue-700', 'bg-[#006a4e] hover:bg-[#00523b]')
    content = content.replace('bg-blue-600 hover:bg-blue-700', 'bg-[#006a4e] hover:bg-[#00523b]')
    content = content.replace('bg-blue-600 text-white hover:bg-blue-700', 'bg-[#006a4e] text-white hover:bg-[#00523b]')
    content = content.replace('bg-blue-600 text-white', 'bg-[#006a4e] text-white')
    content = content.replace('bg-blue-500 hover:bg-blue-600', 'bg-[#006a4e] hover:bg-[#00523b]')
    
    if content != original:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"Updated: {filepath}")

for root, dirs, files in os.walk('src'):
    for file in files:
        if file.endswith('.tsx') or file.endswith('.ts'):
            process_file(os.path.join(root, file))

print("Button color update completed.")
