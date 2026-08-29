import re

with open('dashboard_app.html', 'r', encoding='utf-8') as f:
    html = f.read()

# Delete duplicate functions from legacy block
html = re.sub(r'function isFieldEvent\(name\).*?\}\s*', '', html, count=1, flags=re.DOTALL|re.MULTILINE)
html = re.sub(r'function isMiddleDistance\(name\).*?\}\s*', '', html, count=1, flags=re.DOTALL|re.MULTILINE)
html = re.sub(r'function estimateDuration\(nomeGara.*?\}\s*', '', html, count=1, flags=re.DOTALL|re.MULTILINE)

# The legacy block is at the bottom, so we can just delete from initSidebar up to generateField
match = re.search(r'(function initSidebar\(\) \{.*?)(function generateField\()', html, flags=re.DOTALL|re.MULTILINE)
if match:
    bad_part = match.group(1)
    html = html.replace(bad_part, '')
    print("Deleted initSidebar and friends!")
else:
    print("Could not find initSidebar")

with open('dashboard_app.html', 'w', encoding='utf-8') as f:
    f.write(html)
