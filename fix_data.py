with open('dashboard_app.html', 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace('const race = data[index];', 'const race = currentMeeting.data[index];')

with open('dashboard_app.html', 'w', encoding='utf-8') as f:
    f.write(content)

print("Replaced data[index] with currentMeeting.data[index]")
