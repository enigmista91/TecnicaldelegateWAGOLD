with open('dashboard_app.html', 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace('\\`', '`')
content = content.replace('\\${', '${')

with open('dashboard_app.html', 'w', encoding='utf-8') as f:
    f.write(content)

print("Unescaped all backticks and dollars!")
