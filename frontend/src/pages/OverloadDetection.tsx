import { useEffect, useState, useCallback } from 'react';
import { fetchPrediction, fetchLoads, toggleLoad, shedSuggestedLoads } from '../services/api';
import GlassCard from '../components/GlassCard';
import {
  AlertTriangle, BrainCircuit, Cpu, Power,
  RefreshCw, CheckCircle, TrendingUp, Database, Wifi
} from 'lucide-react';

/* ── Simulated 5-year history (monthly kWh aggregates) ─────── */
const HISTORY_5Y = [
  { month: 'Jan \'20', avg: 38.2, peak: 54.1, overloads: 2 },
  { month: 'Feb \'20', avg: 36.8, peak: 51.3, overloads: 1 },
  { month: 'Mar \'20', avg: 42.1, peak: 61.2, overloads: 3 },
  { month: 'Apr \'20', avg: 48.5, peak: 71.8, overloads: 5 },
  { month: 'May \'20', avg: 52.3, peak: 74.2, overloads: 7 },
  { month: 'Jun \'20', avg: 55.1, peak: 77.9, overloads: 9 },
  { month: 'Jul \'20', avg: 53.8, peak: 75.5, overloads: 8 },
  { month: 'Aug \'20', avg: 50.2, peak: 72.1, overloads: 6 },
  { month: 'Sep \'20', avg: 46.9, peak: 67.4, overloads: 4 },
  { month: 'Oct \'20', avg: 43.2, peak: 62.8, overloads: 3 },
  { month: 'Nov \'20', avg: 39.5, peak: 56.3, overloads: 2 },
  { month: 'Dec \'20', avg: 35.1, peak: 48.2, overloads: 1 },
  { month: 'Jan \'21', avg: 37.4, peak: 53.2, overloads: 2 },
  { month: 'May \'21', avg: 54.7, peak: 78.3, overloads: 10 },
  { month: 'Jun \'21', avg: 57.2, peak: 81.1, overloads: 12 },
  { month: 'Dec \'21', avg: 36.3, peak: 49.5, overloads: 1 },
  { month: 'Jun \'22', avg: 58.4, peak: 83.2, overloads: 14 },
  { month: 'Jun \'23', avg: 60.1, peak: 86.4, overloads: 16 },
  { month: 'May \'24', avg: 56.8, peak: 80.2, overloads: 11 },
  { month: 'Jun \'24', avg: 61.2, peak: 87.5, overloads: 17 },
];

/* ── Pipeline stages (Raspberry Pi → Digital Twin → AI) ────── */
const PIPELINE = [
  {
    icon: Wifi,
    color: '#22d3ee',
    title: 'IoT Sensors',
    sub: 'A-Block · Raspberry Pi 4B',
    desc: 'Current transformers, voltage sensors, temp/humidity, and occupancy sensors mounted on each circuit panel and classroom.',
    status: 'LIVE (Simulated)',
    statusColor: '#10b981',
  },
  {
    icon: Cpu,
    color: '#a78bfa',
    title: 'Edge Preprocessing',
    sub: 'Raspberry Pi 4B · 1-sec intervals',
    desc: 'Pi aggregates raw sensor bursts into 1-minute rolling windows, applies calibration offsets, and forwards via MQTT over campus LAN.',
    status: 'SIMULATED',
    statusColor: '#f59e0b',
  },
  {
    icon: Database,
    color: '#6366f1',
    title: 'Digital Twin Engine',
    sub: 'FastAPI Backend · TimescaleDB',
    desc: 'Receives MQTT packets, updates the building state model, logs to time-series DB, and exposes REST endpoints consumed by this dashboard.',
    status: 'ACTIVE',
    statusColor: '#6366f1',
  },
  {
    icon: BrainCircuit,
    color: '#f59e0b',
    title: 'AI Overload Predictor',
    sub: 'Random Forest · 5-Year Dataset',
    desc: 'Trained on 5 years of A-Block energy logs. Features: hour, day, temperature, occupancy, 1h/24h lag, 24h rolling average. Predicts next-hour load and overload probability.',
    status: 'PREDICTING',
    statusColor: '#f59e0b',
  },
];

interface Load {
  id: string;
  name: string;
  zone: string;
  power_kw: number;
  status: 'ON' | 'OFF';
  critical: boolean;
}

const OverloadDetection = () => {
  const [prediction, setPrediction] = useState<any>({});
  const [loadsData, setLoadsData] = useState<any>(null);
  const [toggling, setToggling] = useState<string | null>(null);
  const [shedding, setShedding] = useState(false);
  const [shedMsg, setShedMsg] = useState<string | null>(null);

  const loadAll = useCallback(async () => {
    try {
      const [pred, lds] = await Promise.all([fetchPrediction(), fetchLoads()]);
      setPrediction(pred);
      setLoadsData(lds);
    } catch {}
  }, []);

  useEffect(() => {
    loadAll();
    const iv = setInterval(loadAll, 5000);
    return () => clearInterval(iv);
  }, [loadAll]);

  const risk       = prediction.risk_level  || 'LOW';
  const prob       = prediction.probability || 0;
  const predicted  = prediction.predicted_load || 0;
  const current    = prediction.current_load   || 0;
  const safeLimit  = prediction.safe_limit     || 75;

  const riskColor =
    risk === 'CRITICAL' ? 'var(--danger)'  :
    risk === 'HIGH'     ? '#fb923c'        :
    risk === 'MEDIUM'   ? 'var(--warning)' : 'var(--success)';

  const riskBg =
    risk === 'CRITICAL' ? 'rgba(244,63,94,0.08)'   :
    risk === 'HIGH'     ? 'rgba(251,146,60,0.08)'  :
    risk === 'MEDIUM'   ? 'rgba(245,158,11,0.08)'  : 'rgba(16,185,129,0.06)';

  const isOverloaded = risk === 'HIGH' || risk === 'CRITICAL' || prob >= 70;
  const pct = Math.min(100, Math.round((predicted / safeLimit) * 100));

  /* top non-critical ON loads sorted by power */
  const suggestedLoads: Load[] = [...(loadsData?.non_critical || [])]
    .filter((l: Load) => l.status === 'ON')
    .sort((a: Load, b: Load) => b.power_kw - a.power_kw)
    .slice(0, 5);

  const handleToggle = async (id: string) => {
    setToggling(id);
    try { await toggleLoad(id); await loadAll(); }
    finally { setToggling(null); }
  };

  const handleShedAll = async () => {
    setShedding(true);
    try {
      const res = await shedSuggestedLoads();
      setShedMsg(`✓ Turned off ${res.shed_ids?.length || 0} loads — saved ${res.saved_kw || 0} kW`);
      await loadAll();
      setTimeout(() => setShedMsg(null), 7000);
    } finally { setShedding(false); }
  };

  const gaugeAngle = (pct / 100) * 180; // 0–180 deg semicircle

  return (
    <div className="flex flex-col gap-8">

      {/* ── Page Header ─────────────────────────────────────── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ color: 'var(--danger)' }}><AlertTriangle size={24} /></span>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: 'var(--text-1)', letterSpacing: '-0.3px' }}>
            Overload Detection & AI Prediction
          </h1>
        </div>
        <p style={{ fontSize: 12.5, color: 'var(--text-3)', maxWidth: 720 }}>
          AI-powered overload risk assessment for Dr. N.G.P. Institute of Technology — A Block.
          Trained on 5 years of campus energy data. Raspberry Pi sensors → Digital Twin → Random Forest predictor.
          Suggestions appear <strong style={{ color: 'var(--warning)' }}>only when risk is elevated</strong>.
        </p>
      </div>

      {/* ── Risk Gauge + Live Stats Row ─────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: '340px 1fr', gap: 20, alignItems: 'start' }}>

        {/* Semicircle Gauge */}
        <GlassCard style={{ background: riskBg, borderColor: riskColor + '44', padding: '28px 24px' }}>
          <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
            {/* SVG gauge */}
            <div style={{ position: 'relative', width: 200, height: 110 }}>
              <svg width="200" height="110" viewBox="0 0 200 110">
                {/* background arc */}
                <path d="M 10 100 A 90 90 0 0 1 190 100" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="14" strokeLinecap="round" />
                {/* colored fill arc — rotated by prob% */}
                <path
                  d="M 10 100 A 90 90 0 0 1 190 100"
                  fill="none"
                  stroke={riskColor}
                  strokeWidth="14"
                  strokeLinecap="round"
                  strokeDasharray={`${(pct / 100) * 283} 283`}
                  style={{ filter: `drop-shadow(0 0 8px ${riskColor})`, transition: 'all 1s ease' }}
                />
                {/* needle */}
                <line
                  x1="100" y1="100"
                  x2={100 + 70 * Math.cos(Math.PI - (gaugeAngle * Math.PI) / 180)}
                  y2={100 - 70 * Math.sin((gaugeAngle * Math.PI) / 180)}
                  stroke={riskColor}
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  style={{ transition: 'all 1s ease' }}
                />
                <circle cx="100" cy="100" r="5" fill={riskColor} />
                {/* labels */}
                <text x="10" y="108" fill="rgba(255,255,255,0.3)" fontSize="9">0%</text>
                <text x="175" y="108" fill="rgba(255,255,255,0.3)" fontSize="9">100%</text>
              </svg>
              {/* center text */}
              <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, textAlign: 'center' }}>
                <div style={{ fontSize: 32, fontWeight: 900, color: riskColor, lineHeight: 1 }}>
                  {prob.toFixed(0)}%
                </div>
                <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 2 }}>Overload Risk</div>
              </div>
            </div>

            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              padding: '7px 18px', borderRadius: 30,
              background: riskColor + '22', border: `1px solid ${riskColor}55`,
            }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: riskColor, display: 'inline-block', boxShadow: `0 0 8px ${riskColor}` }} />
              <span style={{ fontSize: 13, fontWeight: 800, color: riskColor, letterSpacing: '0.5px' }}>{risk} RISK</span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, width: '100%', marginTop: 4 }}>
              {[
                { label: 'Current', value: `${current.toFixed(1)} kW`, color: 'var(--text-1)' },
                { label: 'Predicted', value: `${predicted.toFixed(1)} kW`, color: 'var(--warning)' },
                { label: 'Safe Limit', value: `${safeLimit} kW`, color: 'var(--info)' },
                { label: 'Headroom', value: `${Math.max(0, safeLimit - predicted).toFixed(1)} kW`, color: 'var(--success)' },
              ].map(({ label, value, color }) => (
                <div key={label} style={{
                  padding: '10px 12px', borderRadius: 10,
                  background: 'rgba(0,0,0,0.25)', border: '1px solid var(--glass-border)',
                  textAlign: 'center',
                }}>
                  <div style={{ fontSize: 10, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 4 }}>{label}</div>
                  <div style={{ fontSize: 16, fontWeight: 800, color }}>{value}</div>
                </div>
              ))}
            </div>
          </div>
        </GlassCard>

        {/* Stats + Load Bar */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Utilisation bar */}
          <GlassCard style={{ padding: '22px 24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-1)', marginBottom: 2 }}>Grid Utilisation</div>
                <div style={{ fontSize: 11, color: 'var(--text-3)' }}>Predicted load vs safe transformer limit</div>
              </div>
              <span style={{ fontSize: 20, fontWeight: 900, color: riskColor }}>{pct}%</span>
            </div>

            <div style={{ height: 14, borderRadius: 8, background: 'rgba(255,255,255,0.06)', overflow: 'hidden', position: 'relative' }}>
              <div style={{
                height: '100%', width: `${pct}%`,
                background: pct > 90 ? 'linear-gradient(90deg, #f43f5e, #e11d48)' :
                             pct > 75 ? 'linear-gradient(90deg, #f59e0b, #fb923c)' :
                                        'linear-gradient(90deg, #10b981, #06b6d4)',
                borderRadius: 8,
                transition: 'width 1s ease',
                boxShadow: `0 0 12px ${riskColor}`,
              }} />
              {/* 75% warning line */}
              <div style={{ position: 'absolute', left: '75%', top: 0, bottom: 0, width: 2, background: 'rgba(245,158,11,0.7)' }} />
              <div style={{ position: 'absolute', left: '75%', top: -18, fontSize: 9, color: 'var(--warning)', transform: 'translateX(-50%)' }}>WARNING</div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6 }}>
              <span style={{ fontSize: 10, color: 'var(--text-3)' }}>0 kW</span>
              <span style={{ fontSize: 10, color: 'var(--warning)' }}>{(safeLimit * 0.75).toFixed(0)} kW (75%)</span>
              <span style={{ fontSize: 10, color: 'var(--danger)' }}>{safeLimit} kW (100%)</span>
            </div>
          </GlassCard>

          {/* Model info cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
            {[
              { label: 'Training Data', value: '5 Years', sub: 'Jan 2020 – present', color: '#6366f1' },
              { label: 'Model Type', value: 'Random Forest', sub: '100 trees · 80/20 split', color: '#22d3ee' },
              { label: 'Update Cycle', value: 'Every 60 min', sub: 'Next-hour prediction', color: '#a78bfa' },
            ].map(({ label, value, sub, color }) => (
              <GlassCard key={label} style={{ padding: '16px 18px' }}>
                <div style={{ fontSize: 10, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 6 }}>{label}</div>
                <div style={{ fontSize: 15, fontWeight: 800, color, marginBottom: 2 }}>{value}</div>
                <div style={{ fontSize: 10.5, color: 'var(--text-3)' }}>{sub}</div>
              </GlassCard>
            ))}
          </div>
        </div>
      </div>

      {/* ── Overload Suggestions (only when risk is elevated) ── */}
      {isOverloaded ? (
        <GlassCard style={{
          background: 'linear-gradient(135deg, rgba(244,63,94,0.1), rgba(245,158,11,0.06))',
          borderColor: 'rgba(244,63,94,0.4)',
          padding: '22px 24px',
        }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap', marginBottom: 20 }}>
            <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start', flex: 1, minWidth: 0 }}>
              <div style={{
                width: 40, height: 40, borderRadius: 12, flexShrink: 0,
                background: 'rgba(244,63,94,0.2)', border: '1px solid rgba(244,63,94,0.35)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--danger)',
              }}>
                <AlertTriangle size={20} />
              </div>
              <div>
                <div style={{ fontSize: 15, fontWeight: 800, color: 'var(--danger)', marginBottom: 4 }}>
                  ⚠️ Overload Risk Detected — {risk} ({prob.toFixed(0)}%)
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-2)', lineHeight: 1.6 }}>
                  AI predicts the grid will exceed the safe threshold within the next 60 minutes.
                  Turn off the non-critical loads listed below to balance demand.
                  <strong style={{ color: 'var(--warning)' }}> Shed capacity available: {(loadsData?.shed_available_kw || 0).toFixed(1)} kW.</strong>
                </div>
              </div>
            </div>
            <button
              onClick={handleShedAll}
              disabled={shedding}
              style={{
                padding: '10px 20px', borderRadius: 10, border: 'none', cursor: 'pointer',
                background: 'linear-gradient(135deg, #f43f5e, #e11d48)',
                color: 'white', fontWeight: 700, fontSize: 12.5,
                display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0,
                opacity: shedding ? 0.6 : 1,
                boxShadow: '0 0 20px rgba(244,63,94,0.35)',
              }}
            >
              <BrainCircuit size={15} />
              {shedding ? 'Balancing…' : `Turn Off All Suggested (${suggestedLoads.length} loads)`}
            </button>
          </div>

          {shedMsg && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16, fontSize: 12.5, color: 'var(--success)', fontWeight: 600 }}>
              <CheckCircle size={15} /> {shedMsg}
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 10 }}>
            {suggestedLoads.map((load: Load) => (
              <div key={load.id} style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10,
                padding: '12px 14px', borderRadius: 10,
                background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(245,158,11,0.25)',
              }}>
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--text-1)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={load.name}>
                    {load.name}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 2 }}>
                    {load.zone} · <strong style={{ color: 'var(--warning)' }}>{load.power_kw} kW</strong>
                  </div>
                </div>
                <button
                  id={`od-toggle-${load.id}`}
                  onClick={() => handleToggle(load.id)}
                  disabled={toggling === load.id}
                  style={{
                    padding: '6px 12px', borderRadius: 8, border: '1px solid rgba(244,63,94,0.35)',
                    background: 'rgba(244,63,94,0.15)', color: 'var(--danger)',
                    cursor: 'pointer', fontWeight: 700, fontSize: 11,
                    display: 'flex', alignItems: 'center', gap: 5, flexShrink: 0,
                  }}
                >
                  {toggling === load.id
                    ? <RefreshCw size={11} style={{ animation: 'spin 0.8s linear infinite' }} />
                    : <Power size={11} />}
                  Turn Off
                </button>
              </div>
            ))}
          </div>
        </GlassCard>
      ) : (
        /* Normal state — green all-clear */
        <GlassCard style={{ borderColor: 'rgba(16,185,129,0.3)', background: 'rgba(16,185,129,0.05)', padding: '22px 24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{
              width: 44, height: 44, borderRadius: 12, flexShrink: 0,
              background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.3)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--success)',
            }}>
              <CheckCircle size={22} />
            </div>
            <div>
              <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--success)', marginBottom: 3 }}>
                ✓ Grid is Operating Safely
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-3)' }}>
                Predicted load ({predicted.toFixed(1)} kW) is within the safe threshold ({safeLimit} kW). No load shedding required.
                AI will alert you here the moment risk rises to HIGH or CRITICAL.
              </div>
            </div>
          </div>
        </GlassCard>
      )}

      {/* ── Data Pipeline: Raspberry Pi → Digital Twin → AI ── */}
      <div>
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-1)', marginBottom: 3 }}>
            Data Pipeline Architecture
          </div>
          <div style={{ fontSize: 11.5, color: 'var(--text-3)' }}>
            How real-time sensor data flows from campus hardware into the AI prediction engine
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14 }}>
          {PIPELINE.map(({ icon: Icon, color, title, sub, desc, status, statusColor }, i) => (
            <GlassCard key={title} style={{ padding: '20px 18px', borderColor: color + '30' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 12 }}>
                <div style={{
                  width: 36, height: 36, borderRadius: 10, flexShrink: 0,
                  background: color + '22', border: `1px solid ${color}44`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', color,
                }}>
                  <Icon size={16} />
                </div>
                <span style={{
                  fontSize: 9.5, fontWeight: 700, color: statusColor,
                  background: statusColor + '22', padding: '2px 8px', borderRadius: 20,
                  letterSpacing: '0.4px', textTransform: 'uppercase',
                }}>{status}</span>
              </div>
              {i < PIPELINE.length - 1 && (
                <div style={{ position: 'absolute', right: -10, top: '50%', color: 'var(--text-3)', fontSize: 16, pointerEvents: 'none' }} />
              )}
              <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-1)', marginBottom: 3 }}>{title}</div>
              <div style={{ fontSize: 10.5, color, fontWeight: 600, marginBottom: 8 }}>{sub}</div>
              <div style={{ fontSize: 11, color: 'var(--text-3)', lineHeight: 1.6 }}>{desc}</div>
            </GlassCard>
          ))}
        </div>
      </div>

      {/* ── 5-Year History Table ─────────────────────────────── */}
      <GlassCard style={{ padding: '20px 22px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18 }}>
          <div style={{
            width: 32, height: 32, borderRadius: 9,
            background: 'rgba(99,102,241,0.2)', border: '1px solid rgba(99,102,241,0.3)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent-light)',
          }}>
            <TrendingUp size={15} />
          </div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-1)' }}>5-Year Overload History</div>
            <div style={{ fontSize: 11, color: 'var(--text-3)' }}>Jan 2020 – present · Simulated training data used by the AI model</div>
          </div>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
            <thead>
              <tr>
                {['Month', 'Avg Load (kW)', 'Peak Load (kW)', 'Overload Events', 'Risk'].map(h => (
                  <th key={h} style={{
                    padding: '10px 14px', textAlign: 'left',
                    color: 'var(--text-3)', fontWeight: 600, fontSize: 10.5,
                    letterSpacing: '0.5px', textTransform: 'uppercase',
                    borderBottom: '1px solid var(--glass-border)',
                  }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {HISTORY_5Y.map((row, i) => {
                const rowRisk = row.overloads >= 12 ? { label: 'CRITICAL', color: 'var(--danger)' }
                              : row.overloads >= 6  ? { label: 'HIGH',     color: '#fb923c' }
                              : row.overloads >= 3  ? { label: 'MEDIUM',   color: 'var(--warning)' }
                              :                       { label: 'LOW',      color: 'var(--success)' };
                return (
                  <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                    <td style={{ padding: '10px 14px', color: 'var(--text-2)', fontWeight: 500 }}>{row.month}</td>
                    <td style={{ padding: '10px 14px', color: 'var(--text-1)', fontWeight: 700 }}>{row.avg}</td>
                    <td style={{ padding: '10px 14px', color: row.peak > 75 ? 'var(--danger)' : 'var(--text-1)', fontWeight: 700 }}>{row.peak}</td>
                    <td style={{ padding: '10px 14px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{ flex: 1, height: 6, borderRadius: 4, background: 'rgba(255,255,255,0.06)', overflow: 'hidden' }}>
                          <div style={{ height: '100%', width: `${Math.min(100, (row.overloads / 17) * 100)}%`, background: rowRisk.color, borderRadius: 4 }} />
                        </div>
                        <span style={{ fontWeight: 700, color: rowRisk.color, minWidth: 20 }}>{row.overloads}</span>
                      </div>
                    </td>
                    <td style={{ padding: '10px 14px' }}>
                      <span style={{
                        fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 20,
                        color: rowRisk.color, background: rowRisk.color + '22',
                        border: `1px solid ${rowRisk.color}44`,
                      }}>{rowRisk.label}</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div style={{ marginTop: 14, padding: '10px 14px', borderRadius: 10, background: 'rgba(99,102,241,0.07)', border: '1px solid rgba(99,102,241,0.15)', fontSize: 11.5, color: 'var(--text-3)' }}>
          <strong style={{ color: 'var(--accent-light)' }}>Note:</strong> This historical data is simulated for demonstration. In production, actual Raspberry Pi sensor logs from A-Block panel meters would populate this table via the campus MQTT broker.
        </div>
      </GlassCard>

    </div>
  );
};

export default OverloadDetection;
