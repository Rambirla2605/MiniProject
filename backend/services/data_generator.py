import pandas as pd
import numpy as np
import os
from datetime import datetime, timedelta

def generate_historical_data(start_year=2021, num_years=5, file_path='demo_energy.csv'):
    print(f"Generating {num_years} years of simulated data...")
    
    start_date = datetime(start_year, 1, 1)
    end_date = datetime(start_year + num_years, 1, 1)
    
    # Generate hourly timestamps
    date_rng = pd.date_range(start=start_date, end=end_date, freq='h', inclusive='left')
    df = pd.DataFrame(date_rng, columns=['timestamp'])
    
    # Extract time features
    df['hour'] = df['timestamp'].dt.hour
    df['day_of_week'] = df['timestamp'].dt.dayofweek
    df['day_of_month'] = df['timestamp'].dt.day
    df['month'] = df['timestamp'].dt.month
    df['year'] = df['timestamp'].dt.year
    df['is_weekend'] = df['day_of_week'].isin([5, 6]).astype(int)
    
    # Working days: Not weekend, and hour between 8 and 18
    df['is_working_day'] = ((df['is_weekend'] == 0) & (df['hour'] >= 8) & (df['hour'] <= 18)).astype(int)
    
    # Base variations
    np.random.seed(42)
    
    # Temperature (Seasonal curve + daily curve + noise)
    # Seasonal: hottest in July (month 7), coldest in Jan (month 1)
    seasonal_temp = 15 - 10 * np.cos(2 * np.pi * (df['month'] - 1) / 12) 
    # Daily: hottest at 15:00, coldest at 03:00
    daily_temp = 5 * np.sin(2 * np.pi * (df['hour'] - 9) / 24)
    df['temperature'] = seasonal_temp + daily_temp + np.random.normal(0, 2, len(df))
    
    # Humidity (Inverse to temperature generally)
    df['humidity'] = 80 - (df['temperature'] * 1.5) + np.random.normal(0, 5, len(df))
    df['humidity'] = df['humidity'].clip(20, 100)
    
    # Occupancy (percentage 0-1)
    # High during working hours on weekdays, low otherwise
    base_occupancy = np.where(df['is_working_day'] == 1, 
                              np.random.normal(0.8, 0.1, len(df)), 
                              np.random.normal(0.05, 0.02, len(df)))
    
    # Adjust for exam periods (May and November)
    exam_multiplier = np.where(df['month'].isin([5, 11]), 1.2, 1.0)
    
    # Adjust for summer vacation (June, July)
    vacation_multiplier = np.where(df['month'].isin([6, 7]), 0.3, 1.0)
    
    df['occupancy'] = (base_occupancy * exam_multiplier * vacation_multiplier).clip(0, 1)
    
    # --- Loads (in kW) ---
    
    # 1. HVAC Load (Depends on temperature difference from ideal 22C and occupancy)
    temp_diff = np.abs(df['temperature'] - 22)
    df['HVAC_load'] = np.where(df['temperature'] > 24, temp_diff * 2.5, temp_diff * 1.5) # More power for cooling
    # Reduce HVAC when empty, but keep a base level
    df['HVAC_load'] = df['HVAC_load'] * (0.3 + 0.7 * df['occupancy']) + np.random.normal(2, 0.5, len(df))
    
    # 2. Lighting Load (Depends on hour and occupancy)
    # Lights on more in the morning and evening if occupied
    light_factor = np.where((df['hour'] < 8) | (df['hour'] > 17), 1.0, 0.4)
    df['lighting_load'] = 15 * df['occupancy'] * light_factor + 2 # Base lighting
    
    # 3. Equipment Load (Computers, Labs, etc.)
    df['equipment_load'] = 20 * df['occupancy'] + 5 # Base server/standby load
    
    # Total Power
    df['total_power'] = df['HVAC_load'] + df['lighting_load'] + df['equipment_load']
    
    # Add some random anomalies (spikes)
    anomaly_indices = np.random.choice(len(df), size=int(len(df) * 0.001), replace=False)
    df.loc[anomaly_indices, 'total_power'] *= np.random.uniform(1.5, 2.5, size=len(anomaly_indices))
    
    # Calculate Energy (kWh) - since frequency is hourly, power (kW) * 1h = energy (kWh)
    df['energy'] = df['total_power']
    
    # Save to CSV
    os.makedirs(os.path.dirname(file_path), exist_ok=True)
    df.to_csv(file_path, index=False)
    print(f"Data saved to {file_path}")

if __name__ == "__main__":
    generate_historical_data(start_year=2021, num_years=5, file_path='data/demo_energy.csv')
