with open('dashboard_app.html', 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace('const race = data[index];', 'const race = currentMeeting.data[index];')
content = content.replace('const raceDataStr = localStorage.getItem(\'race_data_\' + currentMeeting.id + \'_\' + index);', 'const raceDataStr = localStorage.getItem(\'race_data_\' + currentMeeting.id + \'_\' + index);')

with open('dashboard_app.html', 'w', encoding='utf-8') as f:
    f.write(content)

print("Replaced data[index] with currentMeeting.data[index]")
