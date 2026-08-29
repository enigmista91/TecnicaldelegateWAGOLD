with open('dashboard_app.html', 'r', encoding='utf-8') as f:
    content = f.read()

print("Backticks:", content.count('\\`'))
print("Dollars:", content.count('\\${'))
