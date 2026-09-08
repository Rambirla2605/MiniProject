import pandas as pd
import numpy as np
import os
from sklearn.ensemble import RandomForestRegressor
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_absolute_error, root_mean_squared_error, r2_score
import pickle

class MLService:
    def __init__(self, data_path='data/demo_energy.csv', model_path='models/rf_model.pkl'):
        self.data_path = data_path
        self.model_path = model_path
        self.model = None
        self.metrics = {}
        self.df = None
        
        # Ensure directories exist
        os.makedirs(os.path.dirname(self.model_path), exist_ok=True)
        
    def load_data(self):
        if not os.path.exists(self.data_path):
            return False
            
        self.df = pd.read_csv(self.data_path)
        self.df['timestamp'] = pd.to_datetime(self.df['timestamp'])
        # Sort chronologically just in case
        self.df = self.df.sort_values('timestamp').reset_index(drop=True)
        return True
        
    def _create_features(self, df):
        # We need features that can be available at prediction time.
        # We want to predict 'total_power'
        
        features = df.copy()
        
        # Lags
        features['power_lag_1h'] = features['total_power'].shift(1)
        features['power_lag_24h'] = features['total_power'].shift(24)
        
        # Rolling averages
        features['power_roll_avg_24h'] = features['total_power'].shift(1).rolling(window=24).mean()
        
        # Drop NaN rows due to shifting
        features = features.dropna()
        
        return features

    def train_model(self):
        if self.df is None:
            if not self.load_data():
                return False, "Data not found"
                
        print("Creating features...")
        df_features = self._create_features(self.df)
        
        # Define features and target
        X = df_features[['hour', 'day_of_week', 'month', 'is_weekend', 'is_working_day',
                         'temperature', 'humidity', 'occupancy', 
                         'power_lag_1h', 'power_lag_24h', 'power_roll_avg_24h']]
        y = df_features['total_power']
        
        # Chronological split (80/20)
        split_idx = int(len(df_features) * 0.8)
        
        X_train, X_test = X.iloc[:split_idx], X.iloc[split_idx:]
        y_train, y_test = y.iloc[:split_idx], y.iloc[split_idx:]
        
        print("Training Random Forest model...")
        self.model = RandomForestRegressor(n_estimators=100, max_depth=15, random_state=42, n_jobs=-1)
        self.model.fit(X_train, y_train)
        
        print("Evaluating model...")
        y_pred = self.model.predict(X_test)
        
        self.metrics = {
            'mae': float(mean_absolute_error(y_test, y_pred)),
            'rmse': float(root_mean_squared_error(y_test, y_pred)),
            'r2': float(r2_score(y_test, y_pred))
        }
        
        # Save model
        with open(self.model_path, 'wb') as f:
            pickle.dump(self.model, f)
            
        return True, "Model trained successfully"
        
    def load_model(self):
        if os.path.exists(self.model_path):
            with open(self.model_path, 'rb') as f:
                self.model = pickle.load(f)
            return True
        return False
        
    def predict_next_hour(self, current_features):
        """
        current_features should be a dictionary containing:
        hour, day_of_week, month, is_weekend, is_working_day,
        temperature, humidity, occupancy, power_lag_1h, power_lag_24h, power_roll_avg_24h
        """
        if self.model is None:
            if not self.load_model():
                # If model is not loaded and doesn't exist, try training
                self.train_model()
                
        if self.model is None:
            return None # Still none
            
        df_pred = pd.DataFrame([current_features])
        prediction = self.model.predict(df_pred)[0]
        return float(prediction)

    def calculate_risk(self, predicted_load, safe_limit):
        ratio = predicted_load / safe_limit
        if ratio < 0.7:
            risk_level = "LOW"
            probability = ratio * 30 # roughly 0-21%
        elif ratio < 0.85:
            risk_level = "MEDIUM"
            probability = ratio * 70 # roughly 49-60%
        elif ratio <= 1.0:
            risk_level = "HIGH"
            probability = ratio * 90 # roughly 76-90%
        else:
            risk_level = "CRITICAL"
            probability = 99.0
            
        # Ensure prob is bounded
        probability = min(max(probability, 1.0), 99.9)
        
        return risk_level, round(probability, 1)

# Instance for singleton usage
ml_service = MLService()

if __name__ == "__main__":
    ml_service.train_model()
    print(ml_service.metrics)
