import streamlit as st
import pandas as pd
import json
import math
import random

st.set_page_config(page_title="WA Gold TD Dashboard", layout="wide")

def time_to_seconds(t_str):
    if not t_str or pd.isna(t_str) or t_str.strip() == "":
        return 999999.0
    t_str = str(t_str).strip()
    try:
        if ':' in t_str:
            parts = t_str.split(':')
            return int(parts[0]) * 60 + float(parts[1])
        else:
            return float(t_str)
    except:
        return 999999.0

def load_data():
    try:
        with open('iscritti_meeting.json', 'r', encoding='utf-8') as f:
            data = json.load(f)
        return data
    except Exception as e:
        st.error(f"Errore nel caricamento del file JSON: {e}")
        return []

def main():
    st.title("🥇 World Athletics Gold Level - Technical Delegate Dashboard")
    st.markdown("Sistema avanzato di supporto decisionale per la composizione di serie, batterie e ordine di partenza secondo il **Regolamento Tecnico WA (TR 20 & TR 25)**.")
    
    data = load_data()
    if not data:
        st.warning("Nessun dato trovato. Esegui prima lo scraping.")
        return

    st.sidebar.header("Pannello di Controllo TD")
    view_mode = st.sidebar.radio("Seleziona Vista:", ["Panoramica Meeting", "Gestione Singola Gara"])
    
    if view_mode == "Panoramica Meeting":
        show_overview(data)
    else:
        manage_race(data)

def show_overview(data):
    st.header("Panoramica Generale Meeting")
    
    total_athletes = sum([len(r['iscritti']) for r in data])
    
    col1, col2, col3 = st.columns(3)
    col1.metric("Totale Gare", len(data))
    col2.metric("Totale Iscritti Complessivi", total_athletes)
    
    summary = []
    for r in data:
        is_field = any(x in r['nome_gara'].lower() for x in ['salto', 'lungo', 'alto', 'asta', 'triplo', 'peso', 'disco', 'martello', 'giavellotto', 'vortex'])
        summary.append({
            "Gara": r['nome_gara'],
            "Iscritti": r['numero_iscritti'],
            "Tipo": "Concorsi (Field)" if is_field else "Corse (Track)",
            "Anomalie (Senza Accredito)": sum(1 for a in r['iscritti'] if not a['accredito'].strip())
        })
    df = pd.DataFrame(summary)
    
    st.dataframe(df, height=400)
    
    st.subheader("⚠️ Attenzione Richiesta (Anomalie di Iscrizione)")
    anomalies = df[df['Anomalie (Senza Accredito)'] > 0]
    if not anomalies.empty:
        st.warning("Alcuni atleti non hanno un tempo/misura di accredito (SB). Il regolamento WA prevede l'inserimento con rank minimo (No Time/No Mark). Controllare le seguenti gare:")
        st.dataframe(anomalies)
    else:
        st.success("Tutti gli atleti hanno un accredito valido. Perfetto per il calcolo delle teste di serie!")

def manage_race(data):
    st.header("Configurazione Seeding e Corsie (WA TR 20/25)")
    race_names = [r['nome_gara'] for r in data]
    selected_race = st.sidebar.selectbox("Seleziona Gara", race_names)
    
    race_data = next(r for r in data if r['nome_gara'] == selected_race)
    iscritti = race_data['iscritti']
    
    if not iscritti:
        st.info("Nessun iscritto per questa gara.")
        return
        
    df = pd.DataFrame(iscritti)
    name_lower = selected_race.lower()
    is_field = any(x in name_lower for x in ['salto', 'lungo', 'alto', 'asta', 'triplo', 'peso', 'disco', 'martello', 'giavellotto', 'vortex'])
    
    if is_field:
        manage_field_event(selected_race, df)
    else:
        manage_track_event(selected_race, df)

def manage_track_event(race_name, df):
    st.subheader(f"Track Event: {race_name}")
    
    df['SB_Seconds'] = df['accredito'].apply(time_to_seconds)
    df = df.sort_values('SB_Seconds').reset_index(drop=True)
    df['Rank'] = range(1, len(df) + 1)
    
    st.markdown("### 1. Impostazioni Impianto (WA TR 20.4.1)")
    col1, col2 = st.columns(2)
    lanes = col1.number_input("Numero di Corsie nell'anello/rettilineo", min_value=4, max_value=10, value=6)
    
    is_mezzofondo = any(x in race_name.lower() for x in ['600', '800', '1000', '1200', '1500', '2000', '3000', '5000', 'siepi', 'marcia'])
    
    if is_mezzofondo:
        max_per_heat = col2.number_input("Max atleti per serie", min_value=8, max_value=25, value=12)
    else:
        max_per_heat = lanes
        col2.info(f"Massimo atleti per serie vincolato a {lanes} (1 atleta per corsia).")
        
    total_athletes = len(df)
    heats_count = math.ceil(total_athletes / max_per_heat)
    
    st.info(f"**Atleti totali:** {total_athletes} | **Serie generate matematicamente:** {heats_count}")
    
    if st.button("Genera Start List Ufficiali (Algoritmo Zig-Zag)"):
        heats = {i: [] for i in range(1, heats_count + 1)}
        
        direction = 1
        current_heat = 1
        
        for idx, row in df.iterrows():
            heats[current_heat].append(row)
            if direction == 1:
                if current_heat < heats_count:
                    current_heat += 1
                else:
                    direction = -1
            else:
                if current_heat > 1:
                    current_heat -= 1
                else:
                    direction = 1
                    
        # Preferred lanes based on WA rules
        if lanes == 6:
            preferred = [3, 4, 5, 6, 2, 1]
        elif lanes == 8:
            preferred = [4, 5, 3, 6, 2, 7, 1, 8]
        else:
            preferred = list(range(1, lanes + 1))
            
        st.markdown("---")
        st.write("### Start List Generate (Da esportare per la Call Room)")
        
        for i in range(1, heats_count + 1):
            st.markdown(f"#### **Serie {i}**")
            heat_df = pd.DataFrame(heats[i])
            if not heat_df.empty:
                if not is_mezzofondo:
                    assigned_lanes = []
                    for j in range(len(heat_df)):
                        assigned_lanes.append(preferred[j] if j < len(preferred) else "-")
                    heat_df['Corsia (Draw)'] = assigned_lanes
                    heat_df = heat_df.sort_values(by=['Corsia (Draw)'], ascending=True).reset_index(drop=True)
                else:
                    heat_df['Posizione (Draw)'] = range(1, len(heat_df) + 1)
                    
                heat_df = heat_df.drop(columns=['SB_Seconds'])
                st.dataframe(heat_df, use_container_width=True)

def manage_field_event(race_name, df):
    st.subheader(f"Field Event: {race_name}")
    
    def measure_to_float(m):
        try:
            return float(str(m).strip())
        except:
            return -1.0
            
    df['Measure'] = df['accredito'].apply(measure_to_float)
    
    st.markdown("### 1. Metodo di Ordinamento Pedana (WA TR 25.6)")
    order_method = st.radio("Seleziona il criterio di sorteggio per i salti/lanci:", [
        "Ordine Inverso di Accredito (I migliori saltano per ultimi - consigliato per Finali dirette)",
        "Ordine Casuale / Random Draw (Consigliato per Qualificazioni)"
    ])
    
    if st.button("Genera Ordine di Pedana"):
        if order_method.startswith("Ordine Inverso"):
            df = df.sort_values('Measure').reset_index(drop=True)
        else:
            df = df.sample(frac=1).reset_index(drop=True)
            
        df['Ordine Ingresso in Pedana'] = range(1, len(df) + 1)
        
        st.markdown("---")
        st.write("### Start List Pedana (Da esportare per il Giudice Arbitro)")
        st.dataframe(df.drop(columns=['Measure']), use_container_width=True)

if __name__ == '__main__':
    main()
