import os
import re

html_dir = 'html'
files = [f for f in os.listdir(html_dir) if f.endswith('.html')]
files_to_process = [os.path.join(html_dir, f) for f in files]
files_to_process.append('index.html')

def get_tool_header(is_root=False):
    prefix = '' if is_root else '../'
    # Simplified header based on user request
    return f'''
  <header class="header">
    <div class="header-inner">
      <div style="display: flex; align-items: center; gap: 24px;">
        <a href="{prefix}index.html" class="logo">JC<span>T</span></a>
        {'' if is_root else f'<a href="{prefix}index.html" class="back-btn" style="font-size: 0.65rem;">← BACK</a>'}
      </div>
      <div class="header-right">
        <button class="theme-toggle" id="theme-toggle" title="Toggle theme">
          <span class="icon-moon">◐</span>
          <span class="icon-sun">◑</span>
        </button>
        <a href="https://www.buymeacoffee.com/gammem" target="_blank" rel="noopener" class="donate-btn">DONATE</a>
      </div>
    </div>
  </header>
'''

for file_path in files_to_process:
    if not os.path.exists(file_path):
        continue
    
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    is_root = file_path == 'index.html'
    
    # 1. Clean up previous attempt (remove header block if any, but now we'll overwrite it properly)
    # We also need to remove the back button that was added to <main>
    content = re.sub(r'<a href="\.\./index\.html" class="back-btn".*?</a>', '', content, flags=re.DOTALL)
    
    # 2. Insert new header after <body>
    header_html = get_tool_header(is_root)
    
    # Replace body tag to insert header immediately after it
    # We should search for any existing header and replace it, or just insert if missing
    if '<header' in content:
        content = re.sub(r'<header.*?</header>', header_html, content, flags=re.DOTALL)
    else:
        content = re.sub(r'(<body[^>]*>)', r'\1' + header_html, content)
    
    # 3. Clean up the footer (remove the duplicate theme/donate buttons we added in previous turn)
    if '<div class="footer-actions"' in content:
        content = re.sub(r'<div class="footer-actions".*?</div>', '', content, flags=re.DOTALL)

    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(content)

print(f"Processed {len(files_to_process)} files with minimal header.")
