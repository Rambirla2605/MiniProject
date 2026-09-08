from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from services.ml_service import ml_service
from services.live_simulator import live_simulator
from datetime import datetime
import pandas as pd
import json
import copy

# ── Load Registry (Dr. N.G.P. Institute of Technology - A Block) ─────────────
# Real-world campus circuit departments (ECE, EEE, BME), 12 Smart Classrooms,
# Specialized Laboratories, Admin Offices (Principal, Dean, CoE, Admission), and East Seminar Hall.
_LOAD_REGISTRY = [
    # ── CRITICAL LOADS (Protected - Cannot be shed) ──────────────────────────
    {"id": "LD-C01", "name": "Admission & Student Affairs Office",   "zone": "A-Block Ground Floor", "type": "Office",     "floor": 1, "power_kw": 4.8, "critical": True,  "status": "ON"},
    {"id": "LD-C02", "name": "Principal's Office & Boardroom",       "zone": "A-Block Floor 1",       "type": "Office",     "floor": 1, "power_kw": 3.5, "critical": True,  "status": "ON"},
    {"id": "LD-C03", "name": "Dean & Administrative Office",         "zone": "A-Block Floor 1",       "type": "Office",     "floor": 1, "power_kw": 4.2, "critical": True,  "status": "ON"},
    {"id": "LD-C04", "name": "Controller of Examinations (CoE) Cell", "zone": "A-Block Floor 1",       "type": "Office",     "floor": 1, "power_kw": 3.2, "critical": True,  "status": "ON"},
    {"id": "LD-C05", "name": "Server Room & Central IT Hub",         "zone": "A-Block Core",          "type": "IT",         "floor": 1, "power_kw": 8.5, "critical": True,  "status": "ON"},
    {"id": "LD-C06", "name": "Campus Fire Safety & Hydrant System",  "zone": "All Floors",            "type": "Safety",     "floor": 0, "power_kw": 1.5, "critical": True,  "status": "ON"},
    {"id": "LD-C07", "name": "Emergency Staircase & Exit Lighting",  "zone": "All Floors",            "type": "Lighting",   "floor": 0, "power_kw": 2.5, "critical": True,  "status": "ON"},
    {"id": "LD-C08", "name": "CCTV Surveillance & Security Hub",     "zone": "Security Core",         "type": "Security",   "floor": 0, "power_kw": 2.0, "critical": True,  "status": "ON"},
    {"id": "LD-C09", "name": "Campus Health Centre & First Aid",     "zone": "A-Block Ground Floor", "type": "Medical",    "floor": 1, "power_kw": 2.8, "critical": True,  "status": "ON"},

    # ── FACULTY & DEPARTMENT OFFICES (Circuit Branches) ──────────────────────
    {"id": "LD-F1-HOD", "name": "ECE Department HoD & Faculty Lounge", "zone": "A-Block Floor 1", "type": "Office",     "floor": 1, "power_kw": 2.6, "critical": False, "status": "ON"},
    {"id": "LD-F2-HOD", "name": "EEE Department HoD & Faculty Lounge", "zone": "A-Block Floor 2", "type": "Office",     "floor": 2, "power_kw": 2.4, "critical": False, "status": "ON"},
    {"id": "LD-F3-HOD", "name": "BME Department HoD & Faculty Lounge", "zone": "A-Block Floor 3", "type": "Office",     "floor": 3, "power_kw": 2.4, "critical": False, "status": "ON"},

    # ── FLOOR 1: 4 CLASSROOMS & 3 LABS (ECE / EEE) ───────────────────────────
    {"id": "LD-F1-101", "name": "Classroom A-101 (Smart Class - ECE)", "zone": "A-Block Floor 1", "type": "Classroom",  "floor": 1, "power_kw": 2.4, "critical": False, "status": "ON"},
    {"id": "LD-F1-102", "name": "Classroom A-102 (Smart Class - ECE)", "zone": "A-Block Floor 1", "type": "Classroom",  "floor": 1, "power_kw": 2.2, "critical": False, "status": "ON"},
    {"id": "LD-F1-LAB1","name": "Circuits & Electronic Devices Lab",   "zone": "A-Block Floor 1", "type": "Laboratory", "floor": 1, "power_kw": 6.8, "critical": False, "status": "ON"},
    {"id": "LD-F1-103", "name": "Classroom A-103 (Multimedia - EEE)",  "zone": "A-Block Floor 1", "type": "Classroom",  "floor": 1, "power_kw": 2.4, "critical": False, "status": "ON"},
    {"id": "LD-F1-104", "name": "Classroom A-104 (Lecture Hall - EEE)", "zone": "A-Block Floor 1", "type": "Classroom",  "floor": 1, "power_kw": 2.5, "critical": False, "status": "ON"},
    {"id": "LD-F1-LAB2","name": "DSP & VLSI Design Laboratory",        "zone": "A-Block Floor 1", "type": "Laboratory", "floor": 1, "power_kw": 7.5, "critical": False, "status": "ON"},
    {"id": "LD-F1-LAB3","name": "Electrical Machines & Control Lab",    "zone": "A-Block Floor 1", "type": "Laboratory", "floor": 1, "power_kw": 13.5,"critical": False, "status": "ON"},

    # ── FLOOR 2: 4 CLASSROOMS & 3 LABS (ECE / EEE / BME) ─────────────────────
    {"id": "LD-F2-201", "name": "Classroom A-201 (Smart Class - ECE)", "zone": "A-Block Floor 2", "type": "Classroom",  "floor": 2, "power_kw": 2.4, "critical": False, "status": "ON"},
    {"id": "LD-F2-202", "name": "Classroom A-202 (Smart Class - ECE)", "zone": "A-Block Floor 2", "type": "Classroom",  "floor": 2, "power_kw": 2.2, "critical": False, "status": "ON"},
    {"id": "LD-F2-LAB1","name": "TI Innovation & Embedded Systems Lab", "zone": "A-Block Floor 2", "type": "Laboratory", "floor": 2, "power_kw": 6.2, "critical": False, "status": "ON"},
    {"id": "LD-F2-203", "name": "Classroom A-203 (Smart Class - BME)", "zone": "A-Block Floor 2", "type": "Classroom",  "floor": 2, "power_kw": 2.4, "critical": False, "status": "ON"},
    {"id": "LD-F2-204", "name": "Classroom A-204 (Lecture Hall - BME)","zone": "A-Block Floor 2", "type": "Classroom",  "floor": 2, "power_kw": 2.2, "critical": False, "status": "ON"},
    {"id": "LD-F2-LAB2","name": "Power Electronics & Drives Lab",       "zone": "A-Block Floor 2", "type": "Laboratory", "floor": 2, "power_kw": 11.2,"critical": False, "status": "ON"},
    {"id": "LD-F2-LAB3","name": "NI LabVIEW Virtual Instrumentation",   "zone": "A-Block Floor 2", "type": "Laboratory", "floor": 2, "power_kw": 8.4, "critical": False, "status": "ON"},

    # ── FLOOR 3: 4 CLASSROOMS & 3 LABS (BME & ADVANCED COMPUTING) ───────────
    {"id": "LD-F3-301", "name": "Classroom A-301 (Circuit Depts Hall)", "zone": "A-Block Floor 3", "type": "Classroom",  "floor": 3, "power_kw": 2.4, "critical": False, "status": "ON"},
    {"id": "LD-F3-302", "name": "Classroom A-302 (Digital Seminar Rm)", "zone": "A-Block Floor 3", "type": "Classroom",  "floor": 3, "power_kw": 2.4, "critical": False, "status": "ON"},
    {"id": "LD-F3-LAB1","name": "Biomedical Instrumentation & Diag Lab","zone": "A-Block Floor 3", "type": "Laboratory", "floor": 3, "power_kw": 7.8, "critical": False, "status": "ON"},
    {"id": "LD-F3-303", "name": "Classroom A-303 (Tutorial Hall)",      "zone": "A-Block Floor 3", "type": "Classroom",  "floor": 3, "power_kw": 1.8, "critical": False, "status": "ON"},
    {"id": "LD-F3-304", "name": "Classroom A-304 (CAD & Drawing Hall)", "zone": "A-Block Floor 3", "type": "Classroom",  "floor": 3, "power_kw": 3.6, "critical": False, "status": "ON"},
    {"id": "LD-F3-LAB2","name": "Bio-Signals & Medical Sensors Lab",    "zone": "A-Block Floor 3", "type": "Laboratory", "floor": 3, "power_kw": 7.2, "critical": False, "status": "ON"},
    {"id": "LD-F3-LAB3","name": "Computer Simulation & MATLAB EDA Lab", "zone": "A-Block Floor 3", "type": "Laboratory", "floor": 3, "power_kw": 9.5, "critical": False, "status": "ON"},

    # ── AUDITORIUM & COMMON CAMPUS FACILITIES (A-Block) ──────────────────────
    {"id": "LD-F0-SEM", "name": "East Seminar Hall (150-Seater AV/AC)",  "zone": "A-Block Ground Floor", "type": "Auditorium", "floor": 1, "power_kw": 11.5,"critical": False, "status": "ON"},
    {"id": "LD-F0-COR", "name": "A-Block Corridors & Stairway Lighting", "zone": "All Floors",            "type": "Lighting",   "floor": 0, "power_kw": 4.8, "critical": False, "status": "ON"},
    {"id": "LD-F0-HVAC","name": "A-Block Central Ventilation & Exhaust", "zone": "All Floors",            "type": "HVAC",       "floor": 0, "power_kw": 7.2, "critical": False, "status": "ON"},
    {"id": "LD-F0-WTR", "name": "RO Water Purifiers & Chillers (Floors 1-3)","zone": "All Floors",        "type": "Appliance",  "floor": 0, "power_kw": 4.2, "critical": False, "status": "ON"},
    {"id": "LD-F0-FAC", "name": "Exterior Facade & Walkway Lighting",    "zone": "A-Block Perimeter",     "type": "Lighting",   "floor": 0, "power_kw": 3.5, "critical": False, "status": "ON"},
]

# Mutable state dict keyed by id
_load_state: dict = {ld["id"]: copy.deepcopy(ld) for ld in _LOAD_REGISTRY}

app = FastAPI(title="SMART ENERGY AI Backend")

# Enable CORS for React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # In production, restrict this
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
async def startup_event():
    # Load model and start live simulation
    print("Loading ML model...")
    if not ml_service.load_model():
        print("Model not found. Training now...")
        ml_service.train_model()
    else:
        # Load data so we can calculate roll_avgs for predictions
        ml_service.load_data()
        
    print("Starting Live Simulator...")
    live_simulator.start()

@app.on_event("shutdown")
async def shutdown_event():
    print("Stopping Live Simulator...")
    live_simulator.stop()

@app.get("/")
def read_root():
    return {"status": "ONLINE", "mode": "DEMO DATA"}

@app.get("/api/current-data")
def get_current_data():
    return live_simulator.get_current_data()

@app.get("/api/prediction")
def get_prediction():
    # Get current state
    current = live_simulator.get_current_data()
    now = datetime.now()
    
    # We need to construct features for the model
    # hour, day_of_week, month, is_weekend, is_working_day, temperature, humidity, occupancy, power_lag_1h, power_lag_24h, power_roll_avg_24h
    
    # Approximation for demo: pull last rows from historical data to act as lags
    if ml_service.df is not None and not ml_service.df.empty:
        last_power = ml_service.df['total_power'].iloc[-1]
        power_lag_24h = ml_service.df['total_power'].iloc[-24]
        roll_avg = ml_service.df['total_power'].iloc[-24:].mean()
    else:
        last_power = current['power']
        power_lag_24h = current['power']
        roll_avg = current['power']
        
    # Occupancy assumption based on hour
    hour = now.hour
    is_weekend = 1 if now.weekday() >= 5 else 0
    is_working_day = 1 if (is_weekend == 0 and 8 <= hour <= 18) else 0
    occupancy = 0.8 if is_working_day else 0.1
    
    features = {
        'hour': hour,
        'day_of_week': now.weekday(),
        'month': now.month,
        'is_weekend': is_weekend,
        'is_working_day': is_working_day,
        'temperature': current['temperature'],
        'humidity': current['humidity'],
        'occupancy': occupancy,
        'power_lag_1h': last_power,
        'power_lag_24h': power_lag_24h,
        'power_roll_avg_24h': roll_avg
    }
    
    predicted_power = ml_service.predict_next_hour(features)
    if predicted_power is None:
        predicted_power = current['power'] * 1.05 # fallback
        
    # Safe limit (configurable in a real app)
    safe_limit = 75.0
    
    risk_level, probability = ml_service.calculate_risk(predicted_power, safe_limit)
    
    return {
        "current_load": current['power'],
        "predicted_load": round(predicted_power, 2),
        "safe_limit": safe_limit,
        "risk_level": risk_level,
        "probability": probability,
        "expected_time": "Next 60 minutes",
        "metrics": ml_service.metrics
    }

@app.get("/api/historical-data")
def get_historical_data(days: int = 7):
    # Return last N days of data for the main chart
    if ml_service.df is not None and not ml_service.df.empty:
        # Assuming 1 row = 1 hour
        hours = days * 24
        df_subset = ml_service.df.tail(hours).copy()
        
        # We need to simulate 'predicted' vs 'actual' for the chart
        # We'll just add some noise to actual to simulate what the model predicted historically
        import numpy as np
        df_subset['predicted_power'] = df_subset['total_power'] * (1 + pd.Series(np.random.normal(0, 0.05, len(df_subset))).values)
        
        # Convert timestamp to string
        df_subset['timestamp'] = df_subset['timestamp'].dt.strftime('%Y-%m-%d %H:%M')
        
        # Return as list of dicts
        return df_subset[['timestamp', 'total_power', 'predicted_power']].to_dict(orient='records')
    return []

@app.get("/api/energy-breakdown")
def get_energy_breakdown():
    # Campus building energy distribution for Dr. NGPIT A-Block
    return [
        {"name": "Laboratories", "value": 38},
        {"name": "Smart Classrooms", "value": 24},
        {"name": "Admin & Faculty", "value": 16},
        {"name": "HVAC & Ventilation", "value": 12},
        {"name": "Common & Safety", "value": 10}
    ]

@app.get("/api/loads")
def get_loads():
    """Return all loads with current ON/OFF state, grouped by criticality."""
    loads = list(_load_state.values())
    critical = [l for l in loads if l["critical"]]
    non_critical = [l for l in loads if not l["critical"]]
    total_on = sum(l["power_kw"] for l in loads if l["status"] == "ON")
    shed_available = sum(l["power_kw"] for l in non_critical if l["status"] == "ON")
    return {
        "critical": critical,
        "non_critical": non_critical,
        "total_active_kw": round(total_on, 2),
        "shed_available_kw": round(shed_available, 2),
    }

@app.post("/api/loads/{load_id}/toggle")
def toggle_load(load_id: str):
    """Toggle a non-critical load ON or OFF. Critical loads cannot be toggled."""
    if load_id not in _load_state:
        raise HTTPException(status_code=404, detail="Load not found")
    load = _load_state[load_id]
    if load["critical"]:
        raise HTTPException(status_code=403, detail="Critical loads cannot be toggled")
    load["status"] = "OFF" if load["status"] == "ON" else "ON"
    return {"id": load_id, "status": load["status"], "name": load["name"]}

@app.post("/api/loads/shed-suggested")
def shed_suggested():
    """Turn off AI-suggested non-critical loads (highest power consumers that are ON)."""
    non_critical_on = [
        l for l in _load_state.values()
        if not l["critical"] and l["status"] == "ON"
    ]
    # Sort by power descending, shed top loads until we save ≥ 25 kW
    non_critical_on.sort(key=lambda x: x["power_kw"], reverse=True)
    saved = 0.0
    shed = []
    for load in non_critical_on:
        if saved >= 25.0:
            break
        _load_state[load["id"]]["status"] = "OFF"
        saved += load["power_kw"]
        shed.append(load["id"])
    return {"shed_ids": shed, "saved_kw": round(saved, 2)}

@app.post("/api/loads/shed-all")
def shed_all():
    """Turn off ALL active non-critical loads immediately."""
    shed = []
    saved = 0.0
    for load in _load_state.values():
        if not load["critical"] and load["status"] == "ON":
            load["status"] = "OFF"
            saved += load["power_kw"]
            shed.append(load["id"])
    return {"shed_ids": shed, "saved_kw": round(saved, 2)}

@app.post("/api/loads/restore-all")
def restore_all():
    """Turn ON all loads back to active state."""
    restored = []
    for load in _load_state.values():
        if not load["critical"] and load["status"] == "OFF":
            load["status"] = "ON"
            restored.append(load["id"])
    return {"restored_ids": restored}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
