with open('dashboard_app.html', 'r', encoding='utf-8') as f:
    html = f.read()

# 1. Unescape backticks and dollars
html = html.replace('\\`', '`')
html = html.replace('\\${', '${')

# 2. Fix the missing backtick block
bad_str = """                    </div>
                </div>
                                const lapStyleEl = document.getElementById('lap-style-' + index);"""
good_str = """                    </div>
                </div>
                `;
                const lapStyleEl = document.getElementById('lap-style-' + index);"""
if bad_str in html:
    html = html.replace(bad_str, good_str)

# 3. Truncate after first </html>
idx = html.find('</html>')
if idx != -1:
    html = html[:idx + len('</html>')]

# 4. Remove duplicate legacy functions manually (safer)
import re
# We know the legacy block starts with "// ====== LEGACY FUNCTIONS ======"
legacy_start = html.find('// ====== LEGACY FUNCTIONS ======')
if legacy_start != -1:
    generate_field_start = html.find('function generateField(', legacy_start)
    if generate_field_start != -1:
        # replace the middle garbage with just the legacy functions header
        html = html[:legacy_start] + "// ====== LEGACY FUNCTIONS ======\n        " + html[generate_field_start:]

with open('dashboard_app.html', 'w', encoding='utf-8') as f:
    f.write(html)

print("Fixed everything cleanly!")
