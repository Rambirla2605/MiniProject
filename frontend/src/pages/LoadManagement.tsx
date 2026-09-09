import { useEffect, useState, useCallback } from 'react';
import { fetchLoads, fetchPrediction } from '../services/api';
import GlassCard from '../components/GlassCard';
import {
  ShieldCheck, ShieldOff, Zap, AlertTriangle,
  BrainCircuit, Lock, Info
} from 'lucide-react';

// ── Prototype / Demonstration Loads ────────────────────────────────────────
// These are representative load categories for demonstration purposes.
// They do NOT correspond to physical load-control relays in the current prototype.
const PROTOTYPE_LOADS = {
  critical: [
    { id: 'LD-MAIN',   name: 'Main Electrical Supply Panel',  type: 'Essential',   power_kw: 12.0, status: 'ON' as const, desc: 'Primary power feed — always protected' },
    { id: 'LD-SAFE',   name: 'Safety & Emergency Systems',    type: 'Safety',      power_kw: 4.0,  status: 'ON' as const, desc: 'Emergency lighting, fire alarm, exit signs' },
  ],
  non_critical: [
    { id: 'LD-LIGHT',  name: 'Lighting (Classrooms & Corridors)', type: 'Lighting',    power_kw: 8.5, status: 'ON' as const, desc: 'General lighting across monitored area' },
    { id: 'LD-FANS',   name: 'Fans & Ventilation',                type: 'HVAC',        power_kw: 6.2, status: 'ON' as const, desc: 'Ceiling fans and ventilation units' },
    { id: 'LD-LAB',    name: 'Laboratory Equipment',              type: 'Laboratory',  power_kw: 10.5,status: 'ON' as const, desc: 'Workstations, instruments, test equipment' },
    { id: 'LD-OFFICE', name: 'Office Equipment & Computers',      type: 'Office',      power_kw: 4.8, status: 'ON' as const, desc: 'PCs, projectors, printers' },
  ],
};

const TYPE_DOT: Record<string, string> = {
  Essential: '#10b981', Safety: '#10b981',
  Lighting: '#fbbf24', HVAC: '#06b6d4',
  Laboratory: '#22d3ee', Office: '#f59e0b',
};

const LoadManagement = () => {
  const [prediction, setPrediction] = useState<any>({});
  // Mirror prototype load state locally (not connected to physical relays)
  const localState: Record<string, 'ON' | 'OFF'> = (() => {
    const s: Record<string, 'ON' | 'OFF'> = {};
    [...PROTOTYPE_LOADS.critical, ...PROTOTYPE_LOADS.non_critical].forEach(l => { s[l.id] = l.status; });
    return s;
  })();
  const [liveData, setLiveData] = useState<any>(null);

  const loadAll = useCallback(async () => {
    try {
      const [pred, live] = await Promise.all([fetchPrediction(), fetchLoads().catch(() => null)]);
      setPrediction(pred);
      if (live) setLiveData(live);
    } catch { /* backend cold start */ }
  }, []);

  useEffect(() => {
    loadAll();
    const iv = setInterval(loadAll, 6000);
    return () => clearInterval(iv);
  }, [loadAll]);

  const risk    = prediction.risk_level || 'LOW';
  const prob    = prediction.probability || 0;
  const isPeakAlert = risk === 'HIGH' || risk === 'CRITICAL' || prob >= 70;

  const totalActive = Object.entries(localState)
    .filter(([, s]) => s === 'ON')
    .reduce((sum, [id]) => {
      const all = [...PROTOTYPE_LOADS.critical, ...PROTOTYPE_LOADS.non_critical];
      const load = all.find(l => l.id === id);
      return sum + (load?.power_kw ?? 0);
    }, 0);

  const criticalPower = PROTOTYPE_LOADS.critical
    .filter(l => localState[l.id] === 'ON')
    .reduce((s, l) => s + l.power_kw, 0);

  const nonCriticalPower = PROTOTYPE_LOADS.non_critical
    .filter(l => localState[l.id] === 'ON')
    .reduce((s, l) => s + l.power_kw, 0);

  // AI suggested: non-critical loads that are ON (just flags for display)
  const suggestedForOptimization = PROTOTYPE_LOADS.non_critical
    .filter(l => localState[l.id] === 'ON')
    .sort((a, b) => b.power_kw - a.power_kw)
    .slice(0, 2)
    .map(l => l.id);

  // Use live backend totals if available, otherwise use prototype totals
  const displayTotal = liveData?.total_active_kw ?? totalActive;

  return (
    <div className="flex flex-col gap-6 lm-page">

      {/* Page Header */}
      <div className="lm-header-bar">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 2, marginBottom: 4, flexWrap: 'wrap' }}>
            <span className="badge badge-warning" style={{ fontSize: 11, padding: '3px 8px' }}>
              Prototype / Demonstration Loads
            </span>
            <span className="badge badge-info" style={{ fontSize: 11, padding: '3px 8px' }}>
              Monitoring + Optimization Support
            </span>
          </div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: 'var(--text-1)', letterSpacing: '-0.3px', display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ color: '#f59e0b' }}><Zap size={24} /></span>
            Load Management & Optimization
          </h1>
          <p style={{ fontSize: 12.5, color: 'var(--text-2)', marginTop: 2 }}>
            Representative load categories for the AI-driven Digital Twin prototype.
            The system monitors energy consumption and provides AI-based optimization recommendations.
          </p>
        </div>
      </div>

      {/* Prototype notice */}
      <div style={{
        display: 'flex', alignItems: 'flex-start', gap: 14, padding: '12px 16px',
        borderRadius: 12, background: 'rgba(56,189,248,0.06)', border: '1px solid rgba(56,189,248,0.18)',
      }}>
        <span style={{ color: 'var(--info)', flexShrink: 0, marginTop: 1 }}><Info size={16} /></span>
        <p style={{ fontSize: 12, color: 'var(--text-2)', margin: 0, lineHeight: 1.6 }}>
          <strong style={{ color: 'var(--info)' }}>Prototype Note:</strong> The loads shown below are representative categories
          used to demonstrate the Digital Twin concept. The current prototype focuses on
          <strong style={{ color: 'var(--text-1)' }}> monitoring, prediction, and optimization recommendations</strong> —
          not physical automated load control. AI suggestions indicate which load categories could be
          reduced during peak periods to stay within the safe energy threshold.
        </p>
      </div>

      {/* ── PEAK ALERT ────────────────────────────────────────── */}
      {isPeakAlert && (
        <div className="peak-alert-banner" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <AlertTriangle size={22} style={{ color: 'var(--danger)', flexShrink: 0 }} />
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--danger)' }}>
                AI Peak Load Alert — Risk: {risk} ({prob.toFixed(0)}%)
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-2)', marginTop: 2 }}>
                AI predicts demand may approach the safe threshold. Consider reducing non-critical loads during this period.
              </div>
            </div>
          </div>

          {suggestedForOptimization.length > 0 && (
            <div style={{ padding: '10px 14px', borderRadius: 10, background: 'rgba(0,0,0,0.25)', border: '1px solid rgba(245,158,11,0.2)' }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--warning)', textTransform: 'uppercase', letterSpacing: '0.4px', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
                <BrainCircuit size={13} />
                AI Optimization Suggestion — Loads to Consider Reducing:
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {PROTOTYPE_LOADS.non_critical
                  .filter(l => suggestedForOptimization.includes(l.id) && localState[l.id] === 'ON')
                  .map(load => (
                    <div key={load.id} style={{
                      display: 'flex', alignItems: 'center', gap: 8, padding: '6px 12px', borderRadius: 8,
                      background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.25)',
                    }}>
                      <div style={{ width: 7, height: 7, borderRadius: '50%', background: TYPE_DOT[load.type] ?? '#94a3b8' }} />
                      <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-1)' }}>{load.name}</span>
                      <span style={{ fontSize: 11, color: 'var(--warning)', fontWeight: 700 }}>{load.power_kw} kW</span>
                      <span className="badge badge-warning" style={{ fontSize: 10 }}>AI Suggestion</span>
                    </div>
                  ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── KPI SUMMARY ────────────────────────────────────────── */}
      <div className="lm-kpi-row">
        {[
          { label: 'Total Active Load',     value: `${displayTotal.toFixed(1)} kW`, sub: 'All monitored loads combined',        color: 'var(--accent-light)', icon: <Zap size={16} /> },
          { label: 'Critical Load',         value: `${criticalPower.toFixed(1)} kW`, sub: `${PROTOTYPE_LOADS.critical.length} essential loads`,  color: 'var(--success)',      icon: <ShieldCheck size={16} /> },
          { label: 'Non-Critical Load',     value: `${nonCriticalPower.toFixed(1)} kW`, sub: `${PROTOTYPE_LOADS.non_critical.filter(l => localState[l.id] === 'ON').length} active categories`, color: 'var(--warning)', icon: <ShieldOff size={16} /> },
          { label: 'Optimizable Capacity',  value: `${nonCriticalPower.toFixed(1)} kW`, sub: 'Available for optimization recommendation', color: 'var(--info)',    icon: <BrainCircuit size={16} /> },
        ].map(({ label, value, sub, color, icon }) => (
          <GlassCard key={label} style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <span style={{ color }}>{icon}</span>
              <span style={{ fontSize: 10.5, fontWeight: 600, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.6px' }}>{label}</span>
            </div>
            <div style={{ fontSize: 24, fontWeight: 800, color, lineHeight: 1, marginBottom: 4 }}>{value}</div>
            <div style={{ fontSize: 11, color: 'var(--text-3)' }}>{sub}</div>
          </GlassCard>
        ))}
      </div>

      {/* ── LOAD PANELS ────────────────────────────────────────── */}
      <div className="lm-panels">

        {/* Critical Loads Panel */}
        <GlassCard className="flex flex-col" style={{ borderColor: 'rgba(16,185,129,0.25)', flex: 1 }}>
          <div className="section-header">
            <div className="section-icon success"><ShieldCheck size={16} /></div>
            <div>
              <div className="section-title">Critical Loads (Protected)</div>
              <div className="section-subtitle">Essential supply — always ON, cannot be reduced</div>
            </div>
          </div>

          <div className="load-list">
            {PROTOTYPE_LOADS.critical.map(load => (
              <div key={load.id} className="load-row load-row-critical">
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1, minWidth: 0 }}>
                  <div className="load-type-dot" style={{ background: TYPE_DOT[load.type] ?? '#10b981' }} />
                  <div style={{ minWidth: 0 }}>
                    <div className="load-name">{load.name}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 2 }}>
                      <span className="room-chip">{load.type}</span>
                      <span style={{ marginLeft: 6 }}>{load.desc}</span>
                    </div>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                  <span style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--text-1)', minWidth: 54, textAlign: 'right' }}>
                    {load.power_kw} kW
                  </span>
                  <div className="locked-pill">
                    <Lock size={11} style={{ color: 'var(--success)' }} />
                    <span>PROTECTED</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </GlassCard>

        {/* Non-Critical Loads Panel */}
        <GlassCard className="flex flex-col" style={{ borderColor: 'rgba(245,158,11,0.25)', flex: 1.2 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, flexWrap: 'wrap', gap: 10 }}>
            <div className="section-header" style={{ marginBottom: 0 }}>
              <div className="section-icon warning"><ShieldOff size={16} /></div>
              <div>
                <div className="section-title">Non-Critical Loads (Optimizable)</div>
                <div className="section-subtitle">Categories that can potentially be reduced during peak periods</div>
              </div>
            </div>
          </div>

          <div className="load-list">
            {PROTOTYPE_LOADS.non_critical.map(load => {
              const isSuggested = suggestedForOptimization.includes(load.id) && isPeakAlert;
              return (
                <div
                  key={load.id}
                  className={`load-row load-row-on ${isSuggested ? 'load-row-suggested' : ''}`}
                >
                  {isSuggested && (
                    <span className="load-suggest-badge">AI Suggestion</span>
                  )}

                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1, minWidth: 0 }}>
                    <div
                      className="load-type-dot"
                      style={{
                        background: TYPE_DOT[load.type] ?? '#94a3b8',
                        boxShadow: `0 0 8px ${TYPE_DOT[load.type] ?? '#94a3b8'}`,
                      }}
                    />
                    <div style={{ minWidth: 0 }}>
                      <div className="load-name">{load.name}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 2 }}>
                        <span className="room-chip">{load.type}</span>
                        <span style={{ marginLeft: 6 }}>{load.desc}</span>
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
                    <span style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--text-1)', minWidth: 54, textAlign: 'right' }}>
                      {load.power_kw} kW
                    </span>
                    {/* Recommendation tag instead of control button */}
                    {isSuggested ? (
                      <div style={{
                        padding: '5px 12px', borderRadius: 8,
                        border: '1px solid rgba(245,158,11,0.4)',
                        background: 'rgba(245,158,11,0.08)',
                        color: 'var(--warning)',
                        fontSize: 11, fontWeight: 700,
                        display: 'flex', alignItems: 'center', gap: 5,
                      }}>
                        <BrainCircuit size={11} />
                        Consider Reducing
                      </div>
                    ) : (
                      <div style={{
                        padding: '5px 12px', borderRadius: 8,
                        border: '1px solid rgba(16,185,129,0.25)',
                        background: 'rgba(16,185,129,0.05)',
                        color: 'var(--success)',
                        fontSize: 11, fontWeight: 600,
                      }}>
                        Within Range
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </GlassCard>

      </div>
    </div>
  );
};

export default LoadManagement;
