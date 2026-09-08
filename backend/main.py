from fastapi import FastAPI, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from services.ml_service import ml_service
from services.live_simulator import live_simulator
from datetime import datetime
import pandas as pd
import json

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
    # Simulated breakdown
    return [
        {"name": "HVAC / Fans", "value": 42},
        {"name": "Lighting", "value": 23},
        {"name": "Computers", "value": 14},
        {"name": "Laboratory", "value": 11},
        {"name": "Pumps", "value": 5},
        {"name": "Other", "value": 5}
    ]

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
