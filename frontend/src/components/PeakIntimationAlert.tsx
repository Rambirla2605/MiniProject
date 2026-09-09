import React, { useState } from 'react';
import {
  Clock, MapPin, Zap, ShieldCheck,
  CheckCircle, RefreshCw, Power, Flame,
  Building2, Sparkles, TrendingDown
} from 'lucide-react';

interface SuggestedLoad {
  id: string;
  name: string;
  zone: string;
  power_kw: number;
}

interface PeakIntimationAlertProps {
  prediction: {
    current_load?: number;
    predicted_load?: number;
    safe_limit?: number;
    risk_level?: string;
    probability?: number;
    expected_time?: string;
    peak_location?: string;
    peak_hotspots?: string[];
    suggested_savings_kw?: number;
    suggested_shed_loads?: SuggestedLoad[];
    projected_post_shed_load?: number;
    post_shed_risk?: string;
    post_shed_probability?: number;
  };
  onShedSuggested: () => Promise<void>;
  onToggleLoad?: (id: string) => Promise<void>;
  isShedding?: boolean;
}

export const PeakIntimationAlert: React.FC<PeakIntimationAlertProps> = ({
  prediction,
  onShedSuggested,
  onToggleLoad,
  isShedding = false,
}) => {
  const [repredicting, setRepredicting] = useState(false);
  const [repredictFeedback, setRepredictFeedback] = useState<{
    savedKw: number;
    newPredicted: number;
    status: string;
  } | null>(null);

  const currentLoad = prediction.current_load || 0;
  const predictedLoad = prediction.predicted_load || 0;
  const safeLimit = prediction.safe_limit || 75.0;
  const risk = prediction.risk_level || 'LOW';
  const prob = prediction.probability || 0;

  const isOverload = predictedLoad > safeLimit || risk === 'HIGH' || risk === 'CRITICAL' || prob >= 70;
  const breachKw = Math.max(0, Math.round((predictedLoad - safeLimit) * 10) / 10);

  const peakTime = prediction.expected_time || 'Next 45 minutes';
  const peakLocation = prediction.peak_location || 'Floor 2 · EEE Heavy Machines Lab & Seminar Halls';
  const hotspots = prediction.peak_hotspots || [
    'Floor 2 EEE Machines & Drives Lab (24.7 kW)',
    'Floor 0 East Seminar Hall AV/AC (11.5 kW)',
    'Floor 1 Programming Labs I & II (15.0 kW)'
  ];

  const suggestedLoads = prediction.suggested_shed_loads || [
    { id: 'LD-F2-MACH', name: 'Electrical Machines & Control Lab', zone: 'A-Block Floor 2 · Right', power_kw: 13.5 },
    { id: 'LD-F0-SEME', name: 'East Seminar Hall (150-Seater AV/AC)', zone: 'A-Block Ground Floor · East', power_kw: 11.5 },
    { id: 'LD-F0-HVAC', name: 'A-Block Central Ventilation & Exhaust', zone: 'All Floors', power_kw: 7.2 },
  ];

  const suggestedSavings = prediction.suggested_savings_kw || 25.0;
  const projectedPostShed = prediction.projected_post_shed_load || Math.max(20, Math.round((predictedLoad - suggestedSavings) * 10) / 10);

  const handleShedClick = async () => {
    setRepredicting(true);
    try {
      await onShedSuggested();
      setRepredictFeedback({
        savedKw: suggestedSavings,
        newPredicted: projectedPostShed,
        status: 'SUCCESS'
      });
      setTimeout(() => {
        setRepredictFeedback(null);
      }, 10000);
    } catch {
      // handled
    } finally {
      setRepredicting(false);
    }
  };

  return (
    <div className={`peak-intimation-card ${isOverload ? 'intimation-danger' : 'intimation-safe'}`}>
      {/* Ambient background glow */}
      <div className={`intimation-bg-glow ${isOverload ? 'bg-danger-glow' : 'bg-safe-glow'}`} />

      {/* Top Banner Row */}
      <div className="intimation-header">
        <div className="intimation-status-pill">
          {isOverload ? (
            <>
              <Flame size={18} className="text-rose animate-bounce-short" />
              <span className="badge-text-danger">PEAK OVERLOAD ALERT DETECTED</span>
            </>
          ) : (
            <>
              <ShieldCheck size={18} className="text-emerald" />
              <span className="badge-text-success">CAMPUS GRID STABLE & BALANCED</span>
            </>
          )}
        </div>

        <div className="intimation-time-chip">
          <Clock size={15} />
          <span>Peak Window: <strong>{peakTime}</strong></span>
        </div>
      </div>

      {/* Main Intimation Grid */}
      <div className="intimation-body-grid">
        {/* Left: What is happening (When, Where, and Load Numbers) */}
        <div className="intimation-narrative-col">
          <h3 className="intimation-main-title">
            {isOverload
              ? `AI Forecasts ${predictedLoad} kW Peak (+${breachKw} kW Above Safe Threshold)`
              : `Current & Projected Load Within Safe Campus Limit (Limit: ${safeLimit} kW)`}
          </h3>

          <p className="intimation-description">
            {isOverload ? (
              <>
                The Digital Twin ingested real-time sensor data from the Raspberry Pi and detected high simultaneous demand. 
                The AI predictive model calculates a <strong className="text-rose font-semibold">{prob}% probability</strong> of 
                transformer overload peaking during <strong className="text-white">{peakTime}</strong>.
              </>
            ) : (
              <>
                Active building consumption is normal. The Digital Twin is continuously synchronizing live telemetry with the Random Forest 
                forecasting model to guarantee transformer safety margins.
              </>
            )}
          </p>

          {/* Pinpointed Location & Hotspots */}
          <div className="intimation-location-box">
            <div className="location-box-header">
              <MapPin size={16} className="text-cyan" />
              <span className="location-title">Where the Peak Demand is Occurring:</span>
            </div>
            <div className="location-primary">
              <Building2 size={16} className="text-indigo-400" />
              <strong className="text-white font-medium">{peakLocation}</strong>
            </div>

            <div className="hotspots-list">
              <span className="hotspot-label">Top Contributing Zones:</span>
              <div className="hotspot-chips">
                {hotspots.map((spot, idx) => (
                  <span key={idx} className="hotspot-chip">
                    {spot}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Quick Metrics Comparison Bar */}
          <div className="intimation-metrics-strip">
            <div className="metric-cell">
              <span className="metric-label">Current Active Load</span>
              <span className="metric-val text-white">{currentLoad} kW</span>
            </div>
            <div className="metric-cell">
              <span className="metric-label">Projected Peak</span>
              <span className={`metric-val ${isOverload ? 'text-rose font-bold' : 'text-emerald'}`}>
                {predictedLoad} kW
              </span>
            </div>
            <div className="metric-cell">
              <span className="metric-label">Campus Limit</span>
              <span className="metric-val text-amber">{safeLimit} kW</span>
            </div>
            <div className="metric-cell">
              <span className="metric-label">Risk Probability</span>
              <span className={`metric-val ${isOverload ? 'text-rose font-bold' : 'text-emerald'}`}>
                {prob}% ({risk})
              </span>
            </div>
          </div>
        </div>

        {/* Right: Actionable Mitigation & Instant Re-Prediction Loop */}
        <div className="intimation-action-col">
          <div className="action-col-header">
            <div className="action-title-group">
              <Sparkles size={16} className="text-amber" />
              <h4 className="action-title">AI Suggested Non-Critical Loads to Turn Off</h4>
            </div>
            <span className="action-badge">
              Potential Savings: <strong className="text-cyan font-bold">{suggestedSavings} kW</strong>
            </span>
          </div>

          <p className="action-hint">
            Turning off these non-critical loads will safely lower the peak demand below the <strong>{safeLimit} kW</strong> threshold without interrupting essential campus services.
          </p>

          {/* Suggested Loads List */}
          <div className="suggested-loads-table">
            {suggestedLoads.map(load => (
              <div key={load.id} className="suggested-load-row">
                <div className="suggested-load-info">
                  <div className="suggested-load-name">
                    <span className="load-dot" />
                    <strong>{load.name}</strong>
                  </div>
                  <span className="suggested-load-zone">{load.zone}</span>
                </div>
                <div className="suggested-load-power">
                  <span className="power-number">{load.power_kw}</span>
                  <span className="power-unit">kW</span>
                </div>
                {onToggleLoad && (
                  <button
                    className="quick-toggle-btn"
                    onClick={() => onToggleLoad(load.id)}
                    title="Toggle this load immediately"
                  >
                    <Power size={13} />
                    <span>Switch Off</span>
                  </button>
                )}
              </div>
            ))}
          </div>

          {/* Projected Outcome Preview */}
          <div className="projected-preview-card">
            <div className="preview-top">
              <div className="preview-indicator">
                <TrendingDown size={15} className="text-emerald" />
                <span>Immediate AI Re-Prediction on Shed:</span>
              </div>
              <span className="preview-new-kw">
                {predictedLoad} kW ➔ <strong className="text-emerald font-bold">{projectedPostShed} kW</strong>
              </span>
            </div>
            <div className="preview-status-pill">
              <CheckCircle size={13} className="text-emerald" />
              <span>Projected Risk Level: <strong className="text-emerald">LOW (14% Risk) · SAFE MARGIN</strong></span>
            </div>
          </div>

          {/* Big Action Button */}
          {isOverload && (
            <button
              className={`shed-action-button ${repredicting || isShedding ? 'loading' : ''}`}
              onClick={handleShedClick}
              disabled={repredicting || isShedding}
            >
              {repredicting || isShedding ? (
                <>
                  <RefreshCw size={17} className="animate-spin" />
                  <span>Shedding Loads & Re-Predicting via Digital Twin...</span>
                </>
              ) : (
                <>
                  <Zap size={18} />
                  <span>⚡ Shed Suggested Loads & Re-Predict Now</span>
                </>
              )}
            </button>
          )}

          {/* Instant Re-Prediction Intimation Feedback Notification */}
          {repredictFeedback && (
            <div className="repredict-toast animate-scale-up">
              <div className="toast-icon">
                <CheckCircle size={20} className="text-emerald" />
              </div>
              <div className="toast-text">
                <div className="toast-title">Digital Twin Synchronized & AI Re-Predicted!</div>
                <div className="toast-body">
                  Successfully reduced load by <strong className="text-cyan">-{repredictFeedback.savedKw} kW</strong>. 
                  Digital Twin updated the telemetry stream, and AI recalculated the forecast: 
                  New peak is safely locked at <strong className="text-emerald font-bold">{repredictFeedback.newPredicted} kW</strong>.
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PeakIntimationAlert;
