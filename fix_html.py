import re

with open('dashboard_app.html', 'r', encoding='utf-8') as f:
    html = f.read()

bad_string = """                                <li class="list-group-item d-flex justify-content-between align-items-center">
                                    <strong>Strada e Cross</strong>
                                    <span class="badge bg-primary rounded-pill">Max 40 mm</span>
                                </li                            <div class="p-2 bg-light border-top">
                                <small class="text-muted"><i class="fw-bold text-warning">Nota:</i> Dal 1 Novembre 2024 è in vigore la regola armonizzata a 20mm per tutte le gare su pista (velocità e mezzofondo).</small>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            `;
            
            document.getElementById('main-content').innerHTML = html;
        }n-content').innerHTML = html;
        }"""

good_string = """                                <li class="list-group-item d-flex justify-content-between align-items-center">
                                    <strong>Strada e Cross</strong>
                                    <span class="badge bg-primary rounded-pill">Max 40 mm</span>
                                </li>
                            </ul>
                            <div class="p-2 bg-light border-top">
                                <small class="text-muted"><i class="fw-bold text-warning">Nota:</i> Dal 1 Novembre 2024 è in vigore la regola armonizzata a 20mm per tutte le gare su pista (velocità e mezzofondo).</small>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            `;
            
            document.getElementById('main-content').innerHTML = html;
        }"""

if bad_string in html:
    html = html.replace(bad_string, good_string)
    with open('dashboard_app.html', 'w', encoding='utf-8') as f:
        f.write(html)
    print("Fixed!")
else:
    print("Not found! Looking for something similar...")
    # fallback
    pass

