import { useEffect, useState } from 'react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine, PieChart, Pie, Cell, Legend
} from 'recharts';
import KpiCard from '../components/KpiCard';
import GlassCard from '../components/GlassCard';
import {
  fetchCurrentData, fetchPrediction, fetchHistoricalData,
  fetchEnergyBreakdown, fetchLoads, toggleLoad, shedSuggestedLoads
} from '../services/api';
import { Activity, Lightbulb, BrainCircuit, AlertTriangle, Zap, Power, CheckCircle, RefreshCw } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const PIE_COLORS = ['#6366f1', '#22d3ee', '#a78bfa', '#f59e0b', '#10b981', '#f43f5e'];

const Dashboard = () => {
  const [current, setCurrent]           = useState<any>({});
  const [prediction, setPrediction]     = useState<any>({});
  const [history, setHistory]           = useState<any[]>([]);
  const [breakdown, setBreakdown]       = useState<any[]>([]);
  const [loadsData, setLoadsData]       = useState<any>(null);
  const [togglingId, setTogglingId]     = useState<string | null>(null);
  const [shedding, setShedding]         = useState(false);
  const [shedMsg, setShedMsg]           = useState<string | null>(null);
  const navigate = useNavigate();

  const load = async () => {
    try {
      const [cur, pred, hist, brk, lds] = await Promise.all([
        fetchCurrentData(),
        fetchPrediction(),
        fetchHistoricalData(1),
        fetchEnergyBreakdown(),
        fetchLoads().catch(() => null),
      ]);
      setCurrent(cur);
      setPrediction(pred);
      setHistory(hist);
      setBreakdown(brk);
      if (lds) setLoadsData(lds);
    } catch (e) { /* backend may not be running yet */ }
  };

  useEffect(() => {
    load();
    const iv = setInterval(load, 5000);
    return () => clearInterval(iv);
  }, []);

  const risk       = prediction.risk_level || 'LOW';
  const prob       = prediction.probability || 0;
  const safeLimit  = prediction.safe_limit  || 75;

  const riskStatus = risk === 'CRITICAL' ? 'danger'
                   : risk === 'HIGH'     ? 'danger'
                   : risk === 'MEDIUM'   ? 'warning'
                   : 'success';

  const riskGlow   = riskStatus === 'danger'  ? 'card-glow-danger'
                   : riskStatus === 'warning' ? ''
                   : 'card-glow-success';

  const progressClass = riskStatus === 'danger'  ? 'danger'
                      : riskStatus === 'warning' ? 'warning'
                      : 'success';

  // Toggle individual suggested non-critical load
  const handleToggleLoad = async (id: string) => {
    setTogglingId(id);
    try {
      await toggleLoad(id);
      const updated = await fetchLoads();
      setLoadsData(updated);
    } catch {} finally {
      setTogglingId(null);
    }
  };

  // Shed all suggested non-critical loads
  const handleShedSuggested = async () => {
    setShedding(true);
    try {
      const res = await shedSuggestedLoads();
      setShedMsg(`Turned off ${res.shed_ids?.length || 0} non-critical loads to shave ${res.saved_kw || 0} kW!`);
      const updated = await fetchLoads();
      setLoadsData(updated);
      setTimeout(() => setShedMsg(null), 6000);
    } catch {} finally {
      setShedding(false);
    }
  };

  // Compute top non-critical loads currently ON for AI shed recommendation
  const nonCriticalOn: any[] = (loadsData?.non_critical || []).filter((l: any) => l.status === 'ON');
  nonCriticalOn.sort((a, b) => b.power_kw - a.power_kw);
  const suggestedLoads = nonCriticalOn.slice(0, 4);
  const suggestedSavings = suggestedLoads.reduce((sum, l) => sum + l.power_kw, 0);
  // Only show peak alert when risk is genuinely HIGH or CRITICAL
  const isPeakAlert = risk === 'HIGH' || risk === 'CRITICAL' || prob >= 80 || (current.power || 0) >= 70;

  return (
    <div className="flex flex-col gap-6" style={{ width: '100%', maxWidth: '100%' }}>

      {/* ── PEAK LOAD AI BALANCING BANNER & QUICK ACTIONS ──────── */}
      {isPeakAlert && (
        <GlassCard elevation="accent" style={{
          background: 'linear-gradient(135deg, rgba(244,63,94,0.12) 0%, rgba(245,158,11,0.08) 100%)',
          borderColor: 'rgba(244,63,94,0.35)',
          padding: '16px 18px',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12, marginBottom: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0, flex: 1 }}>
              <div style={{
                width: 38, height: 38, borderRadius: 10,
                background: 'rgba(244,63,94,0.2)', border: '1px solid rgba(244,63,94,0.4)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--danger)', flexShrink: 0
              }}>
                <AlertTriangle size={20} />
              </div>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--danger)', display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                  <span>⚠️ Peak Grid Alert &mdash; Risk Level: {risk} ({prob.toFixed(0)}%)</span>
                </div>
                <p style={{ fontSize: 12, color: 'var(--text-2)', marginTop: 2 }}>
                  AI predicts high demand risk. Turn off recommended non-critical loads below to balance the grid:
                </p>
              </div>
            </div>

            <button
              id="dash-btn-shed-suggested"
              onClick={handleShedSuggested}
              disabled={shedding || suggestedLoads.length === 0}
              className="btn-danger-pulse"
              style={{
                padding: '9px 16px', borderRadius: 10, border: 'none', cursor: 'pointer',
                background: 'linear-gradient(135deg, #f43f5e, #e11d48)',
                color: 'white', fontWeight: 700, fontSize: 12,
                display: 'flex', alignItems: 'center', gap: 7,
                opacity: shedding ? 0.6 : 1,
              }}
            >
              <Zap size={14} />
              {shedding ? 'Shedding…' : `Turn Off All Suggested (-${suggestedSavings.toFixed(1)} kW)`}
            </button>
          </div>

          {/* Suggested Loads Grid with individual Turn Off buttons */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 10 }}>
            {suggestedLoads.map((load: any) => (
              <div
                key={load.id}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10,
                  padding: '10px 12px', borderRadius: 10,
                  background: 'rgba(0, 0, 0, 0.35)', border: '1px solid rgba(255,255,255,0.08)',
                }}
              >
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--text-1)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={load.name}>
                    {load.name}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text-3)', display: 'flex', gap: 6, alignItems: 'center' }}>
                    <span>{load.zone}</span>
                    <span>&middot;</span>
                    <span style={{ color: 'var(--warning)', fontWeight: 700 }}>{load.power_kw} kW</span>
                  </div>
                </div>

                <button
                  id={`dash-toggle-${load.id}`}
                  onClick={() => handleToggleLoad(load.id)}
                  disabled={togglingId === load.id}
                  style={{
                    padding: '6px 12px', borderRadius: 8, border: '1px solid rgba(244,63,94,0.3)',
                    background: 'rgba(244,63,94,0.15)', color: 'var(--danger)',
                    cursor: 'pointer', fontWeight: 700, fontSize: 11.5,
                    display: 'flex', alignItems: 'center', gap: 5, flexShrink: 0,
                  }}
                >
                  {togglingId === load.id ? (
                    <RefreshCw size={11} style={{ animation: 'spin 0.8s linear infinite' }} />
                  ) : (
                    <Power size={11} />
                  )}
                  Turn Off
                </button>
              </div>
            ))}
          </div>

          {shedMsg && (
            <div style={{ marginTop: 10, display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: 'var(--success)', fontWeight: 600 }}>
              <CheckCircle size={15} />
              {shedMsg}
            </div>
          )}
        </GlassCard>
      )}

      {/* ── KPI ROW ─────────────────────────────────────────── */}
      <div className="grid-6">
        <KpiCard
          title="Current Power"
          value={(current.power || 0).toFixed(1)}
          unit="kW"
          trend="8.4% vs yesterday"
          trendDirection="down"
          subtitle="Real-time load"
        />
        <KpiCard
          title="Today's Energy"
          value="318.6"
          unit="kWh"
          trend="2.1% vs yesterday"
          trendDirection="up"
          subtitle="Accumulated"
        />
        <KpiCard
          title="Peak Load"
          value="67.4"
          unit="kW"
          subtitle="Highest today"
        />
        <KpiCard
          title="AI Predicted Load"
          value={(prediction.predicted_load || 0).toFixed(1)}
          unit="kW"
          subtitle="Next 60 min"
          status="accent"
        />
        <KpiCard
          title="Overload Risk"
          value={`${prob.toFixed(0)}%`}
          trend={risk}
          trendDirection="neutral"
          status={riskStatus}
          subtitle="Risk score"
          glowClass={riskGlow}
        />
        <KpiCard
          title="Energy Efficiency"
          value="87"
          unit="%"
          trend="3% improved"
          trendDirection="good-up"
          status="success"
          subtitle="Overall"
        />
      </div>

      {/* ── MAIN CHART + OVERLOAD CARD ──────────────────────── */}
      <div className="dash-main-grid">

        {/* Power Consumption Chart */}
        <GlassCard elevation="accent" className="flex flex-col" style={{ minHeight: 360 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <div className="section-header" style={{ marginBottom: 0 }}>
              <div className="section-icon accent"><Zap size={16} /></div>
              <div>
                <div className="section-title">Building Power Consumption</div>
                <div className="section-subtitle">Actual · Predicted · Safe Threshold</div>
              </div>
            </div>
            <div className="chart-tabs">
              {['LIVE','TODAY','7D','1M','3M','1Y'].map(t => (
                <button key={t} className={`chart-tab${t === 'LIVE' ? ' active' : ''}`}>{t}</button>
              ))}
            </div>
          </div>

          <div style={{ flex: 1, minHeight: 0 }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={history} margin={{ top: 8, right: 16, left: -10, bottom: 0 }}>
                <defs>
                  <linearGradient id="gradActual" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%"   stopColor="#6366f1" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="#6366f1" stopOpacity={0}    />
                  </linearGradient>
                  <linearGradient id="gradPred" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%"   stopColor="#f59e0b" stopOpacity={0.2} />
                    <stop offset="100%" stopColor="#f59e0b" stopOpacity={0}   />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                <XAxis
                  dataKey="timestamp"
                  stroke="rgba(255,255,255,0.2)"
                  fontSize={10}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={v => v.split(' ')[1] || v}
                />
                <YAxis
                  stroke="rgba(255,255,255,0.2)"
                  fontSize={10}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={v => `${v}kW`}
                />
                <Tooltip
                  contentStyle={{ background: 'rgba(6,11,24,0.95)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12 }}
                  labelStyle={{ color: 'rgba(255,255,255,0.4)', fontSize: 11 }}
                  itemStyle={{ color: 'rgba(255,255,255,0.85)', fontSize: 12 }}
                />
                <ReferenceLine
                  y={safeLimit}
                  stroke="var(--danger)"
                  strokeDasharray="5 4"
                  strokeWidth={1.5}
                  label={{ value: `Limit: ${safeLimit}kW`, fill: 'var(--danger)', fontSize: 10, position: 'insideTopRight' }}
                />
                <Area
                  type="monotone"
                  dataKey="total_power"
                  name="Actual (kW)"
                  stroke="#6366f1"
                  strokeWidth={2}
                  fill="url(#gradActual)"
                />
                <Area
                  type="monotone"
                  dataKey="predicted_power"
                  name="Predicted (kW)"
                  stroke="#f59e0b"
                  strokeWidth={1.5}
                  strokeDasharray="6 3"
                  fill="url(#gradPred)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </GlassCard>

        {/* AI Overload Prediction Card */}
        <GlassCard className={`flex flex-col ${riskGlow}`}
          style={{
            background: 'linear-gradient(160deg, rgba(99,102,241,0.06) 0%, rgba(6,11,24,0.7) 100%)',
          }}
        >
          <div className="section-header">
            <div className="section-icon accent"><BrainCircuit size={16} /></div>
            <div>
              <div className="section-title">AI Overload Prediction</div>
              <div className="section-subtitle">Random Forest · Next 60 min</div>
            </div>
          </div>

          <div style={{ flex: 1 }}>
            <div className="stat-row">
              <span className="stat-label">Current Load</span>
              <span className="stat-value">{(current.power || 0).toFixed(1)} kW</span>
            </div>
            <div className="stat-row">
              <span className="stat-label">Predicted Peak</span>
              <span className="stat-value" style={{ color: 'var(--warning)' }}>
                {(prediction.predicted_load || 0).toFixed(1)} kW
              </span>
            </div>
            <div className="stat-row">
              <span className="stat-label">Safe Limit</span>
              <span className="stat-value">{safeLimit} kW</span>
            </div>
            <div className="stat-row">
              <span className="stat-label">Risk Level</span>
              <span className={`badge badge-${riskStatus}`}>{risk}</span>
            </div>
          </div>

          <div style={{ marginTop: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <span style={{ fontSize: 11, color: 'var(--text-3)', fontWeight: 600, letterSpacing: '0.4px', textTransform: 'uppercase' }}>
                Risk Probability
              </span>
              <span style={{ fontSize: 14, fontWeight: 800, color: `var(--${riskStatus})` }}>
                {prob.toFixed(1)}%
              </span>
            </div>
            <div className="progress-track">
              <div className={`progress-fill ${progressClass}`} style={{ width: `${prob}%` }} />
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 10, textAlign: 'center' }}>
              {prediction.expected_time || 'Within next hour'}
            </div>
          </div>
        </GlassCard>
      </div>

      {/* ── BOTTOM ROW ──────────────────────────────────────── */}
      <div className="dash-bottom-grid">

        {/* Energy Breakdown Pie */}
        <GlassCard className="flex flex-col" style={{ minHeight: 280 }}>
          <div className="section-header">
            <div className="section-icon cyan"><Activity size={16} /></div>
            <div>
              <div className="section-title">Energy Breakdown</div>
              <div className="section-subtitle">Simulated demo estimates</div>
            </div>
          </div>
          <div style={{ flex: 1, minHeight: 200 }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={breakdown} cx="40%" cy="50%" innerRadius={52} outerRadius={74} paddingAngle={4} dataKey="value">
                  {breakdown.map((_, i) => (
                    <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} strokeWidth={0} />
                  ))}
                </Pie>
                <Legend
                  layout="vertical" align="right" verticalAlign="middle"
                  iconType="circle" iconSize={8}
                  formatter={(v) => <span style={{ fontSize: 11, color: 'var(--text-2)' }}>{v}</span>}
                />
                <Tooltip
                  contentStyle={{ background: 'rgba(6,11,24,0.95)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10 }}
                  itemStyle={{ color: 'rgba(255,255,255,0.85)', fontSize: 12 }}
                  formatter={(v: any) => [`${v}%`, '']}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </GlassCard>

        {/* Live Parameters */}
        <GlassCard className="flex flex-col">
          <div className="section-header">
            <div className="section-icon success"><Zap size={16} /></div>
            <div>
              <div className="section-title">Live Electrical Parameters</div>
              <div className="section-subtitle">Updating every 2 seconds</div>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            {[
              { label: 'Voltage',      value: (current.voltage || 0).toFixed(1),      unit: 'V'  },
              { label: 'Current',      value: (current.current || 0).toFixed(1),      unit: 'A'  },
              { label: 'Power Factor', value: (current.power_factor || 0).toFixed(2), unit: ''   },
              { label: 'Frequency',    value: (current.frequency || 0).toFixed(2),    unit: 'Hz' },
            ].map(({ label, value, unit }) => (
              <div key={label} className="param-card">
                <div className="param-label">{label}</div>
                <div className="param-value">
                  {value} <span className="param-unit">{unit}</span>
                </div>
              </div>
            ))}
          </div>
        </GlassCard>

        {/* AI Insights */}
        <GlassCard className="flex flex-col gap-3">
          <div className="section-header">
            <div className="section-icon warning"><Lightbulb size={16} /></div>
            <div>
              <div className="section-title">AI Insights</div>
              <div className="section-subtitle">Generated from live data</div>
            </div>
          </div>
          <div className="insight-card warning" style={{ cursor: 'pointer' }} onClick={() => navigate('/loads')}>
            <AlertTriangle size={16} style={{ color: 'var(--warning)', flexShrink: 0, marginTop: 1 }} />
            <div>
              <h4 style={{ color: 'var(--warning)' }}>Peak Load Management</h4>
              <p>Predicted demand is approaching the safe limit. Consider shifting non-critical loads away from 14:00–16:00. Click to manage.</p>
            </div>
          </div>
          <div className="insight-card info">
            <Zap size={16} style={{ color: 'var(--info)', flexShrink: 0, marginTop: 1 }} />
            <div>
              <h4 style={{ color: 'var(--info)' }}>HVAC Optimization</h4>
              <p>HVAC contributes ~42% of current load. Reducing setpoints by 1°C in low-occupancy zones could save ~3 kW.</p>
            </div>
          </div>
        </GlassCard>

      </div>
    </div>
  );
};

export default Dashboard;
