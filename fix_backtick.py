with open('dashboard_app.html', 'r', encoding='utf-8') as f:
    content = f.read()

bad_str = """                    </div>
                </div>
                                const lapStyleEl = document.getElementById('lap-style-' + index);"""

good_str = """                    </div>
                </div>
                `;
                const lapStyleEl = document.getElementById('lap-style-' + index);"""

if bad_str in content:
    content = content.replace(bad_str, good_str)
    with open('dashboard_app.html', 'w', encoding='utf-8') as f:
        f.write(content)
    print("Fixed missing backtick!")
else:
    print("Could not find bad string")
