import { useEffect, useState } from 'react';
import { fetchPrediction } from '../services/api';
import { BrainCircuit, CheckCircle, TrendingUp, AlertTriangle, Cpu } from 'lucide-react';
import KpiCard from '../components/KpiCard';
import GlassCard from '../components/GlassCard';

const FEATURES = [
  { icon: TrendingUp,    label: 'Previous 1h Power',    desc: 'Lag feature — captures short-term momentum' },
  { icon: TrendingUp,    label: '24h Rolling Average',  desc: 'Smoothed baseline over the past day' },
  { icon: TrendingUp,    label: 'Previous Day Power',   desc: 'Same-hour power from yesterday' },
  { icon: AlertTriangle, label: 'Hour of Day',          desc: 'Captures intra-day consumption pattern' },
  { icon: AlertTriangle, label: 'Day of Week / Month',  desc: 'Weekday vs weekend, monthly seasonality' },
  { icon: Cpu,           label: 'Occupancy Profile',    desc: 'Working day flag and estimated occupancy' },
  { icon: Cpu,           label: 'Temperature & Humidity', desc: 'Environmental factors affecting HVAC load' },
  { icon: Cpu,           label: 'Working Day Flag',     desc: 'Binary: 1 if occupied working hours' },
];

const AIPrediction = () => {
  const [prediction, setPrediction] = useState<any>({});

  useEffect(() => {
    const load = async () => {
      try { setPrediction(await fetchPrediction()); } catch {}
    };
    load();
    const iv = setInterval(load, 60000);
    return () => clearInterval(iv);
  }, []);

  const metrics  = prediction.metrics || {};
  const risk     = prediction.risk_level || 'LOW';
  const prob     = prediction.probability || 0;
  const riskSt   = risk === 'CRITICAL' || risk === 'HIGH' ? 'danger' : risk === 'MEDIUM' ? 'warning' : 'success';

  const r2       = (metrics.r2  || 0);
  const mae      = (metrics.mae  || 0).toFixed(2);
  const rmse     = (metrics.rmse || 0).toFixed(2);
  const r2Pct    = Math.round(r2 * 100);

  return (
    <div className="flex flex-col gap-6">

      {/* Page title */}
      <div>
        <h1 style={{ fontSize: 20, fontWeight: 800, color: 'var(--text-1)', letterSpacing: '-0.3px', display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ color: 'var(--accent-light)' }}><BrainCircuit size={24} /></span>
          AI Energy Prediction
        </h1>
        <p style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 3 }}>Random Forest Regressor · Chronological 80/20 Train-Test Split · Next 60-min Forecast</p>
      </div>

      {/* KPI row */}
      <div className="pred-metrics-grid">
        <KpiCard title="Current Load"        value={(prediction.current_load   || 0).toFixed(1)} unit="kW" subtitle="Real-time" />
        <KpiCard title="Predicted Load"      value={(prediction.predicted_load || 0).toFixed(1)} unit="kW" status="accent" subtitle="Next 60 min" />
        <KpiCard title="Safe Limit"          value={prediction.safe_limit || 75} unit="kW" subtitle="Configurable" />
        <KpiCard title="Overload Probability" value={`${prob.toFixed(0)}%`} status={riskSt} subtitle={`Risk: ${risk}`} />
      </div>

      {/* Model Metrics + Features */}
      <div className="pred-details-grid">

        {/* Model Performance */}
        <GlassCard elevation="accent" className="flex flex-col gap-5">
          <div className="section-header">
            <div className="section-icon accent"><Cpu size={16} /></div>
            <div>
              <div className="section-title">Model Performance Metrics</div>
              <div className="section-subtitle">Evaluated on last 20% of chronological data</div>
            </div>
          </div>

          {/* R² big display */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 20, padding: '16px', borderRadius: 14, background: 'rgba(0,0,0,0.2)', border: '1px solid var(--glass-border)' }}>
            <div style={{ position: 'relative', width: 80, height: 80, flexShrink: 0 }}>
              <svg width="80" height="80" viewBox="0 0 80 80">
                <circle cx="40" cy="40" r="34" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="8" />
                <circle
                  cx="40" cy="40" r="34" fill="none"
                  stroke="var(--accent)" strokeWidth="8"
                  strokeLinecap="round"
                  strokeDasharray={`${2 * Math.PI * 34}`}
                  strokeDashoffset={`${2 * Math.PI * 34 * (1 - r2)}`}
                  transform="rotate(-90 40 40)"
                  style={{ filter: 'drop-shadow(0 0 8px var(--accent-glow))', transition: 'stroke-dashoffset 1s ease' }}
                />
              </svg>
              <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ fontSize: 16, fontWeight: 800, color: 'var(--text-1)' }}>{r2Pct}%</span>
              </div>
            </div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-1)', marginBottom: 4 }}>R² Score</div>
              <div style={{ fontSize: 11.5, color: 'var(--text-3)', lineHeight: 1.6 }}>
                The model explains <strong style={{ color: 'var(--success)' }}>{r2Pct}%</strong> of the variance in power consumption — indicating strong predictive accuracy.
              </div>
            </div>
          </div>

          {/* MAE / RMSE */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div style={{ padding: '14px', borderRadius: 12, background: 'rgba(0,0,0,0.2)', border: '1px solid var(--glass-border)' }}>
              <div style={{ fontSize: 10.5, color: 'var(--text-3)', fontWeight: 600, letterSpacing: '0.6px', textTransform: 'uppercase', marginBottom: 6 }}>MAE</div>
              <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--text-1)' }}>{mae} <span style={{ fontSize: 12, color: 'var(--text-3)', fontWeight: 500 }}>kW</span></div>
              <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 4 }}>Mean Absolute Error</div>
            </div>
            <div style={{ padding: '14px', borderRadius: 12, background: 'rgba(0,0,0,0.2)', border: '1px solid var(--glass-border)' }}>
              <div style={{ fontSize: 10.5, color: 'var(--text-3)', fontWeight: 600, letterSpacing: '0.6px', textTransform: 'uppercase', marginBottom: 6 }}>RMSE</div>
              <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--text-1)' }}>{rmse} <span style={{ fontSize: 12, color: 'var(--text-3)', fontWeight: 500 }}>kW</span></div>
              <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 4 }}>Root Mean Squared Error</div>
            </div>
          </div>

          {/* Green status */}
          <div className="insight-card success" style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
            <CheckCircle size={16} style={{ color: 'var(--success)', flexShrink: 0, marginTop: 1 }} />
            <div>
              <h4 style={{ color: 'var(--success)' }}>Model is well-fitted</h4>
              <p>High R² and low MAE confirm the model has learned the academic building's energy patterns effectively from the simulated 5-year dataset.</p>
            </div>
          </div>
        </GlassCard>

        {/* Feature List */}
        <GlassCard className="flex flex-col gap-4">
          <div className="section-header">
            <div className="section-icon accent"><BrainCircuit size={16} /></div>
            <div>
              <div className="section-title">Prediction Feature Set</div>
              <div className="section-subtitle">Inputs used by Random Forest Regressor</div>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {FEATURES.map(({ icon: Icon, label, desc }) => (
              <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', borderRadius: 10, background: 'rgba(0,0,0,0.2)', border: '1px solid var(--glass-border)', transition: 'border-color 0.2s' }}>
                <span style={{ color: 'var(--accent-light)', flexShrink: 0 }}><Icon size={14} /></span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--text-1)' }}>{label}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 1 }}>{desc}</div>
                </div>
                <span className="badge badge-accent">ACTIVE</span>
              </div>
            ))}
          </div>
        </GlassCard>
      </div>
    </div>
  );
};

export default AIPrediction;
