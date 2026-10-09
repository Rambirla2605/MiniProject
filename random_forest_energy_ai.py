"""
====================================================================================================
CAMPUS DIGITAL TWIN: SMART ENERGY DEMAND FORECASTING USING RANDOM FOREST REGRESSOR
Institution: Dr. N.G.P. Institute of Technology (A-Block Smart Campus Twin)
Author: Department of ECE (II-ECE-B) / Antigravity AI
====================================================================================================
Description:
    This standalone script contains the complete machine learning pipeline:
      1. Loading Historical Energy Data (timestamp, temperature, humidity, occupancy, load types)
      2. Feature Engineering (time-based features, autoregressive lags, 24h rolling moving averages)
      3. Chronological Train/Test Splitting (80/20 train/test partition preserving temporal structure)
      4. Model Training via Random Forest Regressor (n_estimators=100, max_depth=15)
      5. Performance Evaluation (MAE, RMSE, R² Score) & Feature Importance Analysis
      6. Energy Overload Risk Assessment & Safe Operating Limit Checking
      7. Model Persistence (saving & loading .pkl weights)
      8. Interactive Inference / Prediction Routine
====================================================================================================
"""

import os
import pickle
import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestRegressor
from sklearn.metrics import mean_absolute_error, root_mean_squared_error, r2_score


class CampusEnergyRandomForestAI:
    """
    Random Forest AI Model for Campus Power Demand & Peak Load Forecasting.
    """

    def __init__(self, data_path: str = "backend/data/demo_energy.csv", model_path: str = "backend/models/rf_model.pkl"):
        self.data_path = data_path
        self.model_path = model_path
        self.model = None
        self.feature_columns = [
            'hour', 'day_of_week', 'month', 'is_weekend', 'is_working_day',
            'temperature', 'humidity', 'occupancy',
            'power_lag_1h', 'power_lag_24h', 'power_roll_avg_24h'
        ]
        self.metrics = {}

    def load_dataset(self, csv_path: str = None) -> pd.DataFrame:
        """Loads and sorts the historical energy time series data."""
        path = csv_path or self.data_path
        if not os.path.exists(path):
            raise FileNotFoundError(f"Dataset file not found at: {path}")

        print(f"[1/5] Loading energy dataset from: {path} ...")
        df = pd.read_csv(path)
        df['timestamp'] = pd.to_datetime(df['timestamp'])
        df = df.sort_values('timestamp').reset_index(drop=True)
        print(f"      Loaded {len(df):,} timestamp records across campus facilities.")
        return df

    def engineer_features(self, df: pd.DataFrame) -> pd.DataFrame:
        """
        Creates temporal and autoregressive features:
        - power_lag_1h: Load from 1 hour prior (immediate short-term trend)
        - power_lag_24h: Load from same hour yesterday (diurnal cycle)
        - power_roll_avg_24h: 24-hour moving average (baseline level)
        """
        print("[2/5] Performing Time-Series Feature Engineering...")
        feat = df.copy()

        # Autoregressive Lag Features
        feat['power_lag_1h'] = feat['total_power'].shift(1)
        feat['power_lag_24h'] = feat['total_power'].shift(24)

        # 24-Hour Rolling Moving Average
        feat['power_roll_avg_24h'] = feat['total_power'].shift(1).rolling(window=24).mean()

        # Drop initial NaN rows created by shifting
        feat = feat.dropna().reset_index(drop=True)
        print(f"      Feature matrix generated with shape: {feat.shape}")
        return feat

    def train_and_evaluate(self, df_features: pd.DataFrame, test_ratio: float = 0.2):
        """
        Splits data chronologically (80% train, 20% test) and trains the Random Forest Regressor.
        """
        print("[3/5] Splitting data chronologically & Training Random Forest Regressor...")
        X = df_features[self.feature_columns]
        y = df_features['total_power']

        split_idx = int(len(df_features) * (1 - test_ratio))
        X_train, X_test = X.iloc[:split_idx], X.iloc[split_idx:]
        y_train, y_test = y.iloc[:split_idx], y.iloc[split_idx:]

        print(f"      Training set size: {len(X_train):,} samples")
        print(f"      Testing set size:  {len(X_test):,} samples")

        # Initialize and fit Random Forest
        self.model = RandomForestRegressor(
            n_estimators=100,
            max_depth=15,
            min_samples_split=4,
            min_samples_leaf=2,
            random_state=42,
            n_jobs=-1
        )
        self.model.fit(X_train, y_train)

        # Predictions on unseen test partition
        print("[4/5] Evaluating performance metrics...")
        y_pred = self.model.predict(X_test)

        mae = float(mean_absolute_error(y_test, y_pred))
        rmse = float(root_mean_squared_error(y_test, y_pred))
        r2 = float(r2_score(y_test, y_pred))
        mape = float(np.mean(np.abs((y_test - y_pred) / y_test)) * 100)

        self.metrics = {
            "MAE (Mean Absolute Error)": f"{mae:.3f} kW",
            "RMSE (Root Mean Sq Error)": f"{rmse:.3f} kW",
            "R2 Score (Variance Fit)": f"{r2 * 100:.2f}%",
            "MAPE (Percentage Error)": f"{mape:.2f}%"
        }

        # Print Evaluation Summary
        print("\n" + "=" * 55)
        print("   RANDOM FOREST MODEL PERFORMANCE SUMMARY")
        print("=" * 55)
        for metric, val in self.metrics.items():
            print(f"  * {metric:<28}: {val}")
        print("=" * 55 + "\n")

        # Feature Importance Ranking
        importances = self.model.feature_importances_
        feature_ranking = sorted(zip(self.feature_columns, importances), key=lambda x: x[1], reverse=True)
        print("Feature Importance Rankings:")
        for rank, (name, imp) in enumerate(feature_ranking, 1):
            bar = "#" * int(imp * 30)
            print(f"  {rank:2d}. {name:<22} {imp * 100:5.1f}% | {bar}")

        return self.metrics

    def save_model(self, export_path: str = None):
        """Serializes the trained weights to a pickle file."""
        target_path = export_path or self.model_path
        os.makedirs(os.path.dirname(target_path), exist_ok=True)
        with open(target_path, "wb") as f:
            pickle.dump(self.model, f)
        print(f"\n[5/5] Trained Random Forest model successfully saved to: {target_path}")

    def load_model(self, import_path: str = None):
        """Loads serialized model weights."""
        target_path = import_path or self.model_path
        if not os.path.exists(target_path):
            raise FileNotFoundError(f"Model file not found at: {target_path}")
        with open(target_path, "rb") as f:
            self.model = pickle.load(f)
        print(f"Loaded Random Forest model from: {target_path}")

    def predict_load(self, sample_input: dict) -> float:
        """
        Runs single-step inference for incoming environmental and temporal conditions.
        
        Expected dictionary keys:
          'hour', 'day_of_week', 'month', 'is_weekend', 'is_working_day',
          'temperature', 'humidity', 'occupancy',
          'power_lag_1h', 'power_lag_24h', 'power_roll_avg_24h'
        """
        if self.model is None:
            raise RuntimeError("Model is not trained or loaded. Call train_and_evaluate() or load_model() first.")

        df_input = pd.DataFrame([sample_input])[self.feature_columns]
        prediction = self.model.predict(df_input)[0]
        return round(float(prediction), 2)

    @staticmethod
    def assess_overload_risk(predicted_kw: float, safe_threshold_kw: float = 120.0) -> dict:
        """
        Determines peak overload risk level, confidence percentage, and recommended actions.
        """
        ratio = predicted_kw / safe_threshold_kw
        if ratio < 0.70:
            level = "LOW"
            prob = ratio * 30.0
            action = "Grid operates normally. No load shedding required."
        elif ratio < 0.85:
            level = "MEDIUM"
            prob = ratio * 70.0
            action = "Monitor HVAC and lab loads. Prepare non-critical circuits."
        elif ratio <= 1.00:
            level = "HIGH"
            prob = ratio * 90.0
            action = "Warning: Approaching transformer limit. Pre-shed corridor lights & ACs."
        else:
            level = "CRITICAL"
            prob = 99.0
            action = "Overload Imminent! Automatically trigger automated circuit isolation."

        prob = min(max(prob, 1.0), 99.9)
        return {
            "predicted_load_kw": predicted_kw,
            "threshold_kw": safe_threshold_kw,
            "utilization_pct": f"{ratio * 100:.1f}%",
            "risk_level": level,
            "risk_probability": f"{prob:.1f}%",
            "recommended_action": action
        }


# ====================================================================================================
# RUNNABLE DEMO & TEST HARNESS
# ====================================================================================================
if __name__ == "__main__":
    print("=" * 65)
    print(" DR. NGP iTech -- SMART CAMPUS RANDOM FOREST AI ENGINE ")
    print("=" * 65 + "\n")

    ai_engine = CampusEnergyRandomForestAI()

    # Step 1: Load raw historical dataset
    raw_df = ai_engine.load_dataset()

    # Step 2: Extract features & lag values
    features_df = ai_engine.engineer_features(raw_df)

    # Step 3: Train and evaluate
    ai_engine.train_and_evaluate(features_df)

    # Step 4: Save model to disk
    ai_engine.save_model()

    # Step 5: Test real-time prediction with a live scenario
    print("\n" + "=" * 65)
    print(" SAMPLE INFERENCE: PEAK ACADEMIC HOUR (11:00 AM, Weekday, 31.5 C)")
    print("=" * 65)

    test_scenario = {
        "hour": 11,
        "day_of_week": 2,           # Wednesday
        "month": 4,                 # April
        "is_weekend": 0,
        "is_working_day": 1,
        "temperature": 31.5,        # 31.5 deg C
        "humidity": 68.0,           # 68% RH
        "occupancy": 0.92,          # 92% Campus occupancy
        "power_lag_1h": 104.2,      # 104.2 kW (at 10:00 AM)
        "power_lag_24h": 98.6,      # 98.6 kW (yesterday 11:00 AM)
        "power_roll_avg_24h": 62.4  # 62.4 kW baseline
    }

    predicted_kw = ai_engine.predict_load(test_scenario)
    risk_report = ai_engine.assess_overload_risk(predicted_kw, safe_threshold_kw=120.0)

    print(f"\n[+] AI Predicted Campus Demand : {predicted_kw} kW")
    print(f"[+] Transformer Utilization     : {risk_report['utilization_pct']}")
    print(f"[+] Risk Classification         : {risk_report['risk_level']} (Probability: {risk_report['risk_probability']})")
    print(f"[+] Recommended AI Action       : {risk_report['recommended_action']}\n")
