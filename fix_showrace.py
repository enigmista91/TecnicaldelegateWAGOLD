import re

with open('old_dashboard.html', 'r', encoding='utf-16') as f:
    old_html = f.read()

match_old = re.search(r'(async function showRace\(index, btn\).*?)\s*</script>', old_html, re.DOTALL)
if match_old:
    full_showRace = match_old.group(1)
    full_showRace = full_showRace.replace('const race = data[index];', 'const race = currentMeeting.data[index];')
    
    with open('dashboard_app.html', 'r', encoding='utf-8') as f:
        curr_html = f.read()
    
    match_trunc = re.search(r'(async function showRace\(index, btn\).*?)(?=\s*function renderTrackHeats)', curr_html, re.DOTALL)
    if match_trunc:
        curr_html = curr_html.replace(match_trunc.group(1), full_showRace)
        with open('dashboard_app.html', 'w', encoding='utf-8') as f:
            f.write(curr_html)
        print("Successfully replaced truncated showRace with full showRace!")
    else:
        print("Could not find truncated showRace!")
else:
    print("Could not find full showRace in old_dashboard.html!")
