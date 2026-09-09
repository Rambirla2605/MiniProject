import { useEffect, useState } from 'react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine, PieChart, Pie, Cell, Legend
} from 'recharts';
import KpiCard from '../components/KpiCard';
import GlassCard from '../components/GlassCard';
import {
  fetchCurrentData, fetchPrediction, fetchHistoricalData,
  fetchEnergyBreakdown,
} from '../services/api';
import { Activity, Lightbulb, BrainCircuit, AlertTriangle, Zap } from 'lucide-react';

const PIE_COLORS = ['#6366f1', '#22d3ee', '#a78bfa', '#f59e0b', '#10b981', '#f43f5e'];

const Dashboard = () => {
  const [current, setCurrent]       = useState<any>({});
  const [prediction, setPrediction] = useState<any>({});
  const [history, setHistory]       = useState<any[]>([]);
  const [breakdown, setBreakdown]   = useState<any[]>([]);

  const load = async () => {
    try {
      const [cur, pred, hist, brk] = await Promise.all([
        fetchCurrentData(),
        fetchPrediction(),
        fetchHistoricalData(1),
        fetchEnergyBreakdown(),
      ]);
      setCurrent(cur);
      setPrediction(pred);
      setHistory(hist);
      setBreakdown(brk);
    } catch { /* backend may not be running yet */ }
  };

  useEffect(() => {
    load();
    const iv = setInterval(load, 5000);
    return () => clearInterval(iv);
  }, []);

  const risk      = prediction.risk_level || 'LOW';
  const prob      = prediction.probability || 0;
  const safeLimit = prediction.safe_limit  || 75;

  const riskStatus = risk === 'CRITICAL' ? 'danger'
                   : risk === 'HIGH'     ? 'danger'
                   : risk === 'MEDIUM'   ? 'warning'
                   : 'success';

  const riskGlow = riskStatus === 'danger'  ? 'card-glow-danger'
                 : riskStatus === 'warning' ? ''
                 : 'card-glow-success';

  const progressClass = riskStatus === 'danger'  ? 'danger'
                      : riskStatus === 'warning' ? 'warning'
                      : 'success';

  return (
    <div className="flex flex-col gap-6" style={{ width: '100%', maxWidth: '100%' }}>

      {/* ── KPI ROW ─────────────────────────────────────────── */}
      <div className="grid-6" style={{ '--grid-cols': 5 } as any}>
        <KpiCard
          title="Current Power"
          value={(current.power || 0).toFixed(1)}
          unit="kW"
          trend="Live reading"
          trendDirection="neutral"
          subtitle="Data Source: Sensors + Pi"
        />
        <KpiCard
          title="Energy Consumed"
          value="318.6"
          unit="kWh"
          trend="Today"
          trendDirection="neutral"
          subtitle="Accumulated today"
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
          title="System Status"
          value={risk}
          trend={`${prob.toFixed(0)}% overload risk`}
          trendDirection="neutral"
          status={riskStatus}
          subtitle="AI Overload Assessment"
          glowClass={riskGlow}
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
                <div className="section-title">Energy Consumption — Actual vs AI Predicted</div>
                <div className="section-subtitle">Actual (Measured) · AI Predicted · Safe Threshold</div>
              </div>
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
                  label={{ value: `Safe Limit: ${safeLimit}kW`, fill: 'var(--danger)', fontSize: 10, position: 'insideTopRight' }}
                />
                <Area
                  type="monotone"
                  dataKey="total_power"
                  name="Actual — Measured (kW)"
                  stroke="#6366f1"
                  strokeWidth={2}
                  fill="url(#gradActual)"
                />
                <Area
                  type="monotone"
                  dataKey="predicted_power"
                  name="AI Predicted (kW)"
                  stroke="#f59e0b"
                  strokeWidth={1.5}
                  strokeDasharray="6 3"
                  fill="url(#gradPred)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Data source label */}
          <div style={{ marginTop: 12, display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: 'var(--text-3)' }}>
              <span style={{ width: 12, height: 2, background: '#6366f1', borderRadius: 2, display: 'inline-block' }} />
              Actual (Measured)
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: 'var(--text-3)' }}>
              <span style={{ width: 12, height: 2, background: '#f59e0b', borderRadius: 2, display: 'inline-block', borderTop: '2px dashed #f59e0b' }} />
              AI Predicted
            </div>
            <div style={{ marginLeft: 'auto', fontSize: 11, color: 'var(--text-3)', background: 'rgba(255,255,255,0.04)', padding: '3px 10px', borderRadius: 20, border: '1px solid var(--border-subtle)' }}>
              Data Source: Energy Sensors + Raspberry Pi · Demo Data
            </div>
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
              <div className="section-title">AI-Assisted Overload Prediction</div>
              <div className="section-subtitle">AI Prediction Model · Next 60 min</div>
            </div>
          </div>

          <div style={{ flex: 1 }}>
            <div className="stat-row">
              <span className="stat-label">Current Load</span>
              <span className="stat-value">{(current.power || 0).toFixed(1)} kW</span>
            </div>
            <div className="stat-row">
              <span className="stat-label">AI Predicted Peak</span>
              <span className="stat-value" style={{ color: 'var(--warning)' }}>
                {(prediction.predicted_load || 0).toFixed(1)} kW
              </span>
            </div>
            <div className="stat-row">
              <span className="stat-label">Safe Threshold</span>
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
                Overload Risk
              </span>
              <span style={{ fontSize: 14, fontWeight: 800, color: `var(--${riskStatus})` }}>
                {prob.toFixed(1)}%
              </span>
            </div>
            <div className="progress-track">
              <div className={`progress-fill ${progressClass}`} style={{ width: `${prob}%` }} />
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 10, textAlign: 'center' }}>
              {prediction.expected_time || 'Within next hour'} · <span style={{ color: 'var(--warning)' }}>Demo Data</span>
            </div>
          </div>

          {/* Recommendation */}
          <div style={{
            marginTop: 16, padding: '10px 14px', borderRadius: 10,
            background: riskStatus === 'danger' ? 'rgba(244,63,94,0.08)' : 'rgba(16,185,129,0.06)',
            border: `1px solid ${riskStatus === 'danger' ? 'rgba(244,63,94,0.2)' : 'rgba(16,185,129,0.15)'}`,
          }}>
            <div style={{ fontSize: 11, color: 'var(--text-3)', fontWeight: 600, marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.4px' }}>
              AI Recommendation
            </div>
            <p style={{ fontSize: 12, color: 'var(--text-2)', margin: 0, lineHeight: 1.5 }}>
              {riskStatus === 'danger'
                ? 'Consider reducing non-critical loads during predicted peak period to stay within safe threshold.'
                : 'Load is within acceptable range. No immediate action required.'}
            </p>
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
              <div className="section-title">Energy Breakdown by Category</div>
              <div className="section-subtitle">Estimated distribution — Demo data</div>
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
              <div className="section-subtitle">Simulated · Updates every 2 seconds</div>
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
              <div className="section-title">AI Optimization Suggestions</div>
              <div className="section-subtitle">Based on predicted patterns — Demo</div>
            </div>
          </div>
          <div className="insight-card warning">
            <AlertTriangle size={16} style={{ color: 'var(--warning)', flexShrink: 0, marginTop: 1 }} />
            <div>
              <h4 style={{ color: 'var(--warning)' }}>Peak Load Optimization</h4>
              <p>AI predicts demand approaching safe limit around 14:00–16:00. Consider deferring non-critical loads to off-peak hours.</p>
            </div>
          </div>
          <div className="insight-card info">
            <Zap size={16} style={{ color: 'var(--info)', flexShrink: 0, marginTop: 1 }} />
            <div>
              <h4 style={{ color: 'var(--info)' }}>Ventilation Load Pattern</h4>
              <p>Ventilation and HVAC contribute approximately 42% of current load. Scheduling adjustments during low-occupancy periods could reduce peak demand.</p>
            </div>
          </div>
        </GlassCard>

      </div>
    </div>
  );
};

export default Dashboard;
