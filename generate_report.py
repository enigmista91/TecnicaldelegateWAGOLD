import json
import re

def convert_time_to_seconds(time_str):
    if not time_str or time_str.strip() == "":
        return 999999.0
    time_str = time_str.strip()
    try:
        if ':' in time_str:
            parts = time_str.split(':')
            return int(parts[0]) * 60 + float(parts[1])
        else:
            return float(time_str)
    except:
        return 999999.0

def parse_measure(measure_str):
    if not measure_str or measure_str.strip() == "":
        return 0.0
    try:
        return float(measure_str.strip())
    except:
        return 0.0

def main():
    with open('iscritti_meeting.json', 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    report_lines = []
    report_lines.append("# Report Tecnico Iscrizioni - Meeting San Giuliano")
    report_lines.append("\n## Tabella Riassuntiva Iscritti per Gara")
    report_lines.append("| Nome Gara | Numero Iscritti |")
    report_lines.append("|-----------|-----------------|")
    
    total_iscritti = 0
    for race in data:
        report_lines.append(f"| {race['nome_gara']} | {race['numero_iscritti']} |")
        total_iscritti += race['numero_iscritti']
        
    report_lines.append(f"| **Totale** | **{total_iscritti}** |")
    
    report_lines.append("\n## Stima Numero di Serie (Velocità / Mezzofondo)")
    report_lines.append("| Nome Gara | Iscritti | Stima Serie | Note |")
    report_lines.append("|-----------|----------|-------------|------|")
    
    for race in data:
        name = race['nome_gara'].lower()
        iscritti = race['numero_iscritti']
        
        # Identify type
        is_velocita = any(x in name for x in ['50 metri', '60 metri', '80 metri', '100 metri', '150 metri', '200 metri', '300 metri', '400 metri', 'hs', 'ostacoli'])
        is_mezzofondo = any(x in name for x in ['600 metri', '800 metri', '1000 metri', '1200 metri', '1500 metri', '2000 metri', '3000 metri', '5000 metri', 'siepi', 'marcia'])
        
        stima = ""
        note = ""
        if is_velocita:
            serie = (iscritti + 5) // 6
            stima = str(serie)
            note = "Calcolato su 6 corsie per serie"
        elif is_mezzofondo:
            if iscritti > 0:
                serie = (iscritti + 11) // 12
                stima = str(serie)
                note = "Calcolato max 12 atleti per serie"
            else:
                stima = "0"
        
        if stima:
            report_lines.append(f"| {race['nome_gara']} | {iscritti} | {stima} | {note} |")

    report_lines.append("\n## Top 3 Accrediti per Gara (Migliori Prestazioni)")
    report_lines.append("> *Nota: Il calcolo esatto del punteggio tabellare FIDAL non è incluso automaticamente in quanto richiede l'integrazione delle tabelle ufficiali WA/FIDAL. I punteggi andranno ricavati tramite le tabelle cartacee/PDF vigenti.*")
    
    for race in data:
        name = race['nome_gara'].lower()
        iscritti = race['iscritti']
        
        # Filter valid accrediti
        valid_iscritti = [x for x in iscritti if x['accredito'].strip() != ""]
        
        if not valid_iscritti:
            continue
            
        # Determine if it's a running event (lower is better) or field event (higher is better)
        is_field = any(x in name for x in ['salto', 'lungo', 'alto', 'asta', 'triplo', 'peso', 'disco', 'martello', 'giavellotto', 'vortex'])
        
        if is_field:
            sorted_iscritti = sorted(valid_iscritti, key=lambda x: parse_measure(x['accredito']), reverse=True)
        else:
            sorted_iscritti = sorted(valid_iscritti, key=lambda x: convert_time_to_seconds(x['accredito']))
            
        top3 = sorted_iscritti[:3]
        
        report_lines.append(f"\n### {race['nome_gara']}")
        for idx, atleta in enumerate(top3):
            report_lines.append(f"{idx+1}. {atleta['nominativo']} ({atleta['societa']}) - **{atleta['accredito']}**")

    with open('report_tecnico.md', 'w', encoding='utf-8') as f:
        f.write("\n".join(report_lines))
        
    print("Report generato: report_tecnico.md")

if __name__ == '__main__':
    main()
