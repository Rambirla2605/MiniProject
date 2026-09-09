import { useEffect, useState } from 'react';
import { fetchPrediction } from '../services/api';
import { BrainCircuit, TrendingUp, AlertTriangle, Cpu, Info } from 'lucide-react';
import KpiCard from '../components/KpiCard';
import GlassCard from '../components/GlassCard';

const FEATURES = [
  { icon: TrendingUp,    label: 'Previous Hour Power',   desc: 'Short-term momentum — power from the last 60 minutes' },
  { icon: TrendingUp,    label: '24-Hour Rolling Average',desc: 'Smoothed baseline over the past day' },
  { icon: TrendingUp,    label: 'Previous Day (same hour)',desc: 'Same time-of-day power from yesterday' },
  { icon: AlertTriangle, label: 'Hour of Day',            desc: 'Captures morning, afternoon, evening demand patterns' },
  { icon: AlertTriangle, label: 'Day of Week / Month',    desc: 'Weekday vs weekend, monthly seasonality' },
  { icon: Cpu,           label: 'Working Day Flag',       desc: 'Binary indicator: 1 if occupied working hours' },
  { icon: Cpu,           label: 'Temperature',            desc: 'Environmental factor affecting ventilation load' },
  { icon: Cpu,           label: 'Humidity',               desc: 'Environmental factor affecting HVAC load' },
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
  const safeLimit = prediction.safe_limit || 75;
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
        <p style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 3 }}>
          AI Prediction Model · Trained on 6+ Months Historical Data · 60-Minute Forecast Horizon
        </p>
      </div>

      {/* Methodology explanation */}
      <div style={{
        display: 'flex', alignItems: 'flex-start', gap: 14, padding: '14px 18px',
        borderRadius: 12, background: 'rgba(99,102,241,0.07)',
        border: '1px solid rgba(99,102,241,0.2)',
      }}>
        <span style={{ color: 'var(--accent-light)', flexShrink: 0, marginTop: 1 }}><Info size={18} /></span>
        <div>
          <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--accent-light)', marginBottom: 4 }}>
            How the AI Prediction Works
          </div>
          <p style={{ fontSize: 12, color: 'var(--text-2)', lineHeight: 1.7, margin: 0 }}>
            Historical energy-consumption data is analyzed to identify patterns — daily cycles, peak periods,
            weekday vs weekend variation, and environmental factors. The AI model learns these patterns and uses
            them to predict future consumption. Predictions are used to support energy optimization and
            identify potential overload conditions before they occur.
          </p>
        </div>
      </div>

      {/* KPI row */}
      <div className="pred-metrics-grid">
        <KpiCard title="Current Load"        value={(prediction.current_load   || 0).toFixed(1)} unit="kW" subtitle="Real-time · Demo Data" />
        <KpiCard title="AI Predicted Load"   value={(prediction.predicted_load || 0).toFixed(1)} unit="kW" status="accent" subtitle="Next 60 min · Demo Data" />
        <KpiCard title="Safe Threshold"      value={safeLimit} unit="kW" subtitle="Configurable limit" />
        <KpiCard title="Overload Risk"       value={`${prob.toFixed(0)}%`} status={riskSt} subtitle={`Level: ${risk} · Demo`} />
      </div>

      {/* Model Metrics + Features */}
      <div className="pred-details-grid">

        {/* Model Performance */}
        <GlassCard elevation="accent" className="flex flex-col gap-5">
          <div className="section-header">
            <div className="section-icon accent"><Cpu size={16} /></div>
            <div>
              <div className="section-title">Model Evaluation (Demo Dataset)</div>
              <div className="section-subtitle">Metrics from training on simulated historical data</div>
            </div>
          </div>

          {/* R² display */}
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
                The model explains <strong style={{ color: 'var(--accent-light)' }}>{r2Pct}%</strong> of the variance
                in the training dataset. Evaluated on the demo simulation data.
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

          {/* Honest disclaimer */}
          <div style={{ padding: '12px 14px', borderRadius: 10, background: 'rgba(56,189,248,0.06)', border: '1px solid rgba(56,189,248,0.15)', fontSize: 11.5, color: 'var(--text-3)', lineHeight: 1.6 }}>
            <strong style={{ color: 'var(--info)' }}>Note:</strong> Metrics are computed on the demo simulation dataset.
            Real-world accuracy will depend on actual sensor data collected via Raspberry Pi.
          </div>
        </GlassCard>

        {/* Feature List */}
        <GlassCard className="flex flex-col gap-4">
          <div className="section-header">
            <div className="section-icon accent"><BrainCircuit size={16} /></div>
            <div>
              <div className="section-title">Prediction Feature Set</div>
              <div className="section-subtitle">Input variables used by the AI model</div>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {FEATURES.map(({ icon: Icon, label, desc }) => (
              <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', borderRadius: 10, background: 'rgba(0,0,0,0.2)', border: '1px solid var(--glass-border)' }}>
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

      {/* ── AI-Assisted Overload Prediction (merged from removed page) ── */}
      <GlassCard>
        <div className="section-header" style={{ marginBottom: 16 }}>
          <div className="section-icon warning"><AlertTriangle size={16} /></div>
          <div>
            <div className="section-title">AI-Assisted Overload Prediction</div>
            <div className="section-subtitle">Current vs predicted vs safe threshold · Demo Data</div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12, marginBottom: 16 }}>
          {[
            { label: 'Current Load',    value: `${(prediction.current_load || 0).toFixed(1)} kW`, color: 'var(--text-1)' },
            { label: 'AI Predicted Peak',value: `${(prediction.predicted_load || 0).toFixed(1)} kW`, color: 'var(--warning)' },
            { label: 'Safe Threshold',  value: `${safeLimit} kW`, color: 'var(--success)' },
            { label: 'Overload Risk',   value: risk, color: `var(--${riskSt})` },
          ].map(({ label, value, color }) => (
            <div key={label} style={{ padding: '14px', borderRadius: 12, background: 'rgba(0,0,0,0.2)', border: '1px solid var(--glass-border)', textAlign: 'center' }}>
              <div style={{ fontSize: 10.5, color: 'var(--text-3)', fontWeight: 600, letterSpacing: '0.6px', textTransform: 'uppercase', marginBottom: 8 }}>{label}</div>
              <div style={{ fontSize: 20, fontWeight: 800, color }}>{value}</div>
            </div>
          ))}
        </div>

        <div style={{ padding: '12px 16px', borderRadius: 10, background: riskSt === 'danger' ? 'rgba(244,63,94,0.07)' : 'rgba(16,185,129,0.06)', border: `1px solid ${riskSt === 'danger' ? 'rgba(244,63,94,0.2)' : 'rgba(16,185,129,0.15)'}` }}>
          <div style={{ fontSize: 11, color: 'var(--text-3)', fontWeight: 600, marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.4px' }}>AI Recommendation</div>
          <p style={{ fontSize: 12.5, color: 'var(--text-2)', margin: 0, lineHeight: 1.6 }}>
            {riskSt === 'danger'
              ? 'Predicted peak load may approach or exceed the safe threshold. Consider reducing non-critical loads during the next hour to prevent potential overload.'
              : riskSt === 'warning'
              ? 'Load is elevated relative to the safe threshold. Monitor consumption and consider deferring non-essential loads.'
              : 'System is operating within safe bounds. No immediate optimization action required.'}
          </p>
        </div>
      </GlassCard>

    </div>
  );
};

export default AIPrediction;
