import re

with open('dashboard_app.html', 'r', encoding='utf-8') as f:
    html = f.read()

match = re.search(r'<script>\s*(.*?)\s*</script>', html, re.DOTALL)
if match:
    with open('temp_script.js', 'w', encoding='utf-8') as f:
        f.write(match.group(1))
    print("Extracted JS to temp_script.js")
else:
    print("Could not find <script> tag")
