import os
import re

html_dir = 'html'
files = [f for f in os.listdir(html_dir) if f.endswith('.html')]
files_to_process = [os.path.join(html_dir, f) for f in files]
files_to_process.append('index.html')

header_pattern = re.compile(r'<header.*?</header>', re.DOTALL)
# Pattern to avoid duplicates in tool pages if already modified
back_btn_marker = 'class="back-btn"'

theme_toggle_html = '''
        <button class="theme-toggle" id="theme-toggle" title="Toggle theme">
          <span class="icon-moon">◐</span>
          <span class="icon-sun">◑</span>
        </button>
'''
donate_btn_html = '<a href="https://www.buymeacoffee.com/gammem" target="_blank" rel="noopener" class="donate-btn">DONATE</a>'

for file_path in files_to_process:
    if not os.path.exists(file_path):
        continue
    
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    is_tool = 'html/' in file_path.replace('\\', '/') or file_path != 'index.html'
    
    # 1. Always remove header
    new_content = header_pattern.sub('', content)
    
    # 2. Add Back button to tools (avoid duplicates)
    if is_tool:
        if back_btn_marker not in new_content:
            back_btn = '<a href="../index.html" class="back-btn" style="margin-bottom: 40px;"><span class="arrow">←</span> BACK TO ALL TOOLS</a>'
            main_pattern = re.compile(r'(<main[^>]*>)')
            if main_pattern.search(new_content):
                new_content = main_pattern.sub(r'\1\n    ' + back_btn, new_content)
            else:
                new_content = re.sub(r'(<body[^>]*>)', r'\1\n    ' + back_btn, new_content)
        else:
            # If already has back btn, ensure it's not duplicated/messy
            # We already fixed base64 in the previous step? No, let's just normalize it.
            # Replace any existing back-btn with a standard one
            new_content = re.sub(r'<a href="\.\./index\.html" class="back-btn".*?</a>', '', new_content, flags=re.DOTALL)
            back_btn = '<a href="../index.html" class="back-btn" style="margin-bottom: 40px;"><span class="arrow">←</span> BACK TO ALL TOOLS</a>'
            main_pattern = re.compile(r'(<main[^>]*>)')
            new_content = main_pattern.sub(r'\1\n    ' + back_btn, new_content)

    # 3. Add Theme Toggle and Donate to Footer (ensure buttons exist for JS)
    if 'id="theme-toggle"' not in new_content:
        footer_end_pattern = re.compile(r'</footer>')
        # Fix donate links in footer (making them buttons if needed)
        # But let's just append a div with buttons
        buttons_div = f'<div class="footer-actions" style="display:flex; gap:12px; align-items:center;">{theme_toggle_html}{donate_btn_html}</div>'
        new_content = footer_end_pattern.sub('\n    ' + buttons_div + '\n  </footer>', new_content)

    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(new_content)

print(f"Processed {len(files_to_process)} files and updated footers.")
