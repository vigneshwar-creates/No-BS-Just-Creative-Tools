import re
import os

def fix_file(file_path):
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Remove nav-toggle and nav-links within the header
    # But keep the logo and the rest of header-inner
    
    # 1. Remove nav-toggle button
    content = re.sub(r'<button class="nav-toggle".*?</button>', '', content, flags=re.DOTALL)
    
    # 2. Remove nav-links nav element
    content = re.sub(r'<nav class="nav-links".*?</nav>', '', content, flags=re.DOTALL)
    
    # 3. Clean up any weird literal backticks and newlines (like `n)
    content = content.replace('`n', '\n')
    
    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(content)

# Fix index.html
fix_file('index.html')

# Check other html files
html_dir = 'html'
if os.path.exists(html_dir):
    for f in os.listdir(html_dir):
        if f.endswith('.html'):
            fix_file(os.path.join(html_dir, f))

print("Fixed navigation in all files.")
