import os
import re

html_dir = 'html'
files = [f for f in os.listdir(html_dir) if f.endswith('.html')]

# We'll also do index.html
files_to_process = [os.path.join(html_dir, f) for f in files]
files_to_process.append('index.html')

header_pattern = re.compile(r'<header.*?</header>', re.DOTALL)

for file_path in files_to_process:
    if not os.path.exists(file_path):
        continue
    
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Identify if it's a tool page (in html/) or index.html
    is_tool = 'html/' in file_path.replace('\\', '/') or file_path != 'index.html'
    
    if is_tool:
        # For tools, we add a back button at the start of main
        back_btn = '<a href="../index.html" class="back-btn" style="margin-bottom: 40px;"><span class="arrow">←</span> BACK TO ALL TOOLS</a>'
        # Some tools might be in the root (like donation-toast.html, but that's a fragment?)
        # Let's assume all tools are in html/
        
        # New content: remove header, add back button inside main
        new_content = header_pattern.sub('', content)
        
        # Add back button after <main class="main"> or equivalent
        main_pattern = re.compile(r'(<main[^>]*>)')
        if main_pattern.search(new_content):
            new_content = main_pattern.sub(r'\1\n    ' + back_btn, new_content)
        else:
            # If no main, just put it after body
            new_content = re.sub(r'(<body[^>]*>)', r'\1\n    ' + back_btn, new_content)
    else:
        # For index.html, we just remove the header
        new_content = header_pattern.sub('', content)

    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(new_content)

print(f"Processed {len(files_to_process)} files.")
