import re

with open('dashboard_app.html', 'r', encoding='utf-8') as f:
    content = f.read()

# find first </html>
idx = content.find('</html>')
if idx != -1:
    clean_content = content[:idx + len('</html>')]
    with open('dashboard_app.html', 'w', encoding='utf-8') as f:
        f.write(clean_content)
    print("Truncated successfully!")
else:
    print("Could not find </html>")

