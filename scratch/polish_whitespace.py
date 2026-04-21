import os
import re

html_dir = 'html'
files = [f for f in os.listdir(html_dir) if f.endswith('.html')]
files_to_process = [os.path.join(html_dir, f) for f in files]
files_to_process.append('index.html')

for file_path in files_to_process:
    if not os.path.exists(file_path):
        continue
    
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Remove multiple empty lines after <main class="main">
    content = re.sub(r'(<main[^>]*>)\s+', r'\1\n    ', content)
    
    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(content)

print(f"Polished {len(files_to_process)} files.")
