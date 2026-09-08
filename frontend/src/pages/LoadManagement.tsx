import { useEffect, useState, useCallback } from 'react';
import {
  fetchLoads, fetchPrediction, toggleLoad,
  shedSuggestedLoads, shedAllLoads, restoreAllLoads
} from '../services/api';
import GlassCard from '../components/GlassCard';
import {
  ShieldCheck, ShieldOff, Zap, AlertTriangle, CheckCircle,
  Power, BrainCircuit, RefreshCw, Lock, RotateCcw,
  Search, Building2, Flame
} from 'lucide-react';

interface Load {
  id: string;
  name: string;
  zone: string;
  type: string;
  floor?: number;
  power_kw: number;
  critical: boolean;
  status: 'ON' | 'OFF';
}

interface LoadsData {
  critical: Load[];
  non_critical: Load[];
  total_active_kw: number;
  shed_available_kw: number;
}

const TYPE_COLORS: Record<string, string> = {
  Laboratory: '#22d3ee',
  Classroom: '#818cf8',
  Office: '#f59e0b',
  Lighting: '#fbbf24',
  HVAC: '#06b6d4',
  Appliance: '#c084fc',
  Safety: '#10b981',
  Security: '#10b981',
  IT: '#38bdf8',
  Auditorium: '#ec4899',
  Medical: '#f43f5e',
  Other: '#94a3b8',
};

const LoadManagement = () => {
  const [loadsData, setLoadsData] = useState<LoadsData | null>(null);
  const [prediction, setPrediction] = useState<any>({});
  const [toggling, setToggling] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [savedKw, setSavedKw] = useState(0);
  const [lastShed, setLastShed] = useState<string[]>([]);
  const [selectedFloor, setSelectedFloor] = useState<string>('ALL');
  const [selectedType, setSelectedType] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const loadAll = useCallback(async () => {
    try {
      const [ld, pred] = await Promise.all([fetchLoads(), fetchPrediction()]);
      setLoadsData(ld);
      setPrediction(pred);
      const offPower = (ld.non_critical as Load[])
        .filter((l: Load) => l.status === 'OFF')
        .reduce((sum: number, l: Load) => sum + l.power_kw, 0);
      setSavedKw(Math.round(offPower * 10) / 10);
    } catch { /* backend cold start or retry */ }
  }, []);

  useEffect(() => {
    loadAll();
    const iv = setInterval(loadAll, 6000);
    return () => clearInterval(iv);
  }, [loadAll]);

  const handleToggle = async (id: string) => {
    setToggling(id);
    try {
      await toggleLoad(id);
      await loadAll();
    } finally {
      setToggling(null);
    }
  };

  const handleShedSuggested = async () => {
    setActionLoading('suggested');
    try {
      const result = await shedSuggestedLoads();
      setLastShed(result.shed_ids || []);
      await loadAll();
    } finally {
      setActionLoading(null);
    }
  };

  const handleShedAll = async () => {
    setActionLoading('all');
    try {
      const result = await shedAllLoads();
      setLastShed(result.shed_ids || []);
      await loadAll();
    } finally {
      setActionLoading(null);
    }
  };

  const handleRestoreAll = async () => {
    setActionLoading('restore');
    try {
      await restoreAllLoads();
      setLastShed([]);
      await loadAll();
    } finally {
      setActionLoading(null);
    }
  };

  const risk = prediction.risk_level || 'LOW';
  const prob = prediction.probability || 0;
  const isPeakAlert = risk === 'HIGH' || risk === 'CRITICAL' || prob >= 70;

  const criticalPower = loadsData?.critical
    .filter(l => l.status === 'ON')
    .reduce((s, l) => s + l.power_kw, 0) ?? 0;
  const nonCriticalOnPower = loadsData?.non_critical
    .filter(l => l.status === 'ON')
    .reduce((s, l) => s + l.power_kw, 0) ?? 0;

  // AI suggested: top non-critical ON loads by power, targeting up to 25 kW reduction
  const aiSuggested: string[] = [];
  let suggestAcc = 0;
  [...(loadsData?.non_critical ?? [])]
    .filter(l => l.status === 'ON')
    .sort((a, b) => b.power_kw - a.power_kw)
    .forEach(l => {
      if (suggestAcc < 25) {
        aiSuggested.push(l.id);
        suggestAcc += l.power_kw;
      }
    });

  // Filter helper for search, floor tabs, and category pills
  const matchesFilter = (load: Load) => {
    // Floor check
    if (selectedFloor === '1' && load.floor !== 1) return false;
    if (selectedFloor === '2' && load.floor !== 2) return false;
    if (selectedFloor === '3' && load.floor !== 3) return false;
    if (selectedFloor === 'COMMON' && load.floor !== 0) return false;

    // Category / Type check
    if (selectedType === 'Classroom' && load.type !== 'Classroom') return false;
    if (selectedType === 'Laboratory' && load.type !== 'Laboratory') return false;
    if (selectedType === 'Office' && load.type !== 'Office') return false;
    if (selectedType === 'Other' && ['Classroom', 'Laboratory', 'Office'].includes(load.type)) return false;

    // Search query check
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      load.name.toLowerCase().includes(q) ||
      load.zone.toLowerCase().includes(q) ||
      load.type.toLowerCase().includes(q) ||
      load.id.toLowerCase().includes(q)
    );
  };

  const filteredCritical = (loadsData?.critical ?? []).filter(matchesFilter);
  const filteredNonCritical = (loadsData?.non_critical ?? []).filter(matchesFilter);

  return (
    <div className="flex flex-col gap-6 lm-page">

      {/* Page Header */}
      <div className="lm-header-bar">
        <div>
          <div className="flex items-center gap-2" style={{ marginBottom: 4 }}>
            <span className="badge badge-accent" style={{ fontSize: 11, padding: '3px 8px' }}>
              <Building2 size={12} style={{ display: 'inline', marginRight: 4 }} />
              Dr. N.G.P. Institute of Technology
            </span>
            <span className="badge badge-info" style={{ fontSize: 11, padding: '3px 8px' }}>
              A-Block &middot; 3 Floors &middot; 12 Classrooms &middot; 13 Labs &middot; East &amp; West Seminar Halls
            </span>
          </div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: 'var(--text-1)', letterSpacing: '-0.3px', display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ color: '#f59e0b' }}><Power size={24} /></span>
            Smart Load Management &amp; Peak Shedding
          </h1>
          <p style={{ fontSize: 12.5, color: 'var(--text-2)', marginTop: 2 }}>
            Real-time isolation of Critical infrastructure (Admission, Principal, CoE, Server Room) vs Non-Critical classrooms (A-101 to A-304), department labs (DSP, VLSI, Communication, Machines, Programming), and East/West Seminar Halls.
          </p>
        </div>

        {/* Global Control Buttons */}
        <div className="lm-action-buttons">
          <button
            id="btn-ai-shed"
            className="btn-danger-pulse"
            onClick={handleShedSuggested}
            disabled={actionLoading !== null}
            style={{
              padding: '9px 16px', borderRadius: 10, border: 'none', cursor: 'pointer',
              background: 'linear-gradient(135deg, #f43f5e, #e11d48)',
              color: 'white', fontWeight: 700, fontSize: 12,
              display: 'flex', alignItems: 'center', gap: 6,
              opacity: actionLoading ? 0.6 : 1,
              boxShadow: '0 0 16px rgba(244,63,94,0.3)',
            }}
          >
            <BrainCircuit size={14} />
            {actionLoading === 'suggested' ? 'Shedding…' : 'AI Shed Suggested'}
          </button>

          <button
            id="btn-shed-all"
            onClick={handleShedAll}
            disabled={actionLoading !== null}
            style={{
              padding: '9px 14px', borderRadius: 10,
              border: '1px solid rgba(245,158,11,0.4)',
              background: 'var(--warning-dim)',
              color: 'var(--warning)',
              cursor: 'pointer', fontWeight: 700, fontSize: 12,
              display: 'flex', alignItems: 'center', gap: 6,
              opacity: actionLoading ? 0.6 : 1,
            }}
          >
            <Flame size={14} />
            {actionLoading === 'all' ? 'Shedding All…' : 'Shed All Non-Critical'}
          </button>

          <button
            id="btn-restore-all"
            onClick={handleRestoreAll}
            disabled={actionLoading !== null}
            style={{
              padding: '9px 14px', borderRadius: 10,
              border: '1px solid rgba(16,185,129,0.4)',
              background: 'var(--success-dim)',
              color: 'var(--success)',
              cursor: 'pointer', fontWeight: 700, fontSize: 12,
              display: 'flex', alignItems: 'center', gap: 6,
              opacity: actionLoading ? 0.6 : 1,
            }}
          >
            <RotateCcw size={14} />
            {actionLoading === 'restore' ? 'Restoring…' : 'Restore All'}
          </button>
        </div>
      </div>

      {/* ── PEAK LOAD ALERT & AI RECOMMENDATIONS ──────────────── */}
      {isPeakAlert && (
        <div className="peak-alert-banner" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, width: '100%' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0, flex: 1 }}>
              <AlertTriangle size={24} style={{ color: 'var(--danger)', flexShrink: 0 }} />
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--danger)' }}>
                  Peak Load Alert &mdash; Risk Level: {risk} ({prob.toFixed(0)}% Probability)
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-2)', marginTop: 2 }}>
                  Grid approaching transformer threshold. Turn off recommended non-critical loads below to safely balance demand.
                  Potential relief: <strong style={{ color: 'var(--warning)' }}>{loadsData?.shed_available_kw ?? 0} kW</strong> available to shed.
                </div>
              </div>
            </div>

            <button
              id="btn-one-click-balance"
              className="btn-danger-pulse"
              onClick={handleShedSuggested}
              disabled={actionLoading !== null || aiSuggested.length === 0}
              style={{
                padding: '10px 18px', borderRadius: 10, border: 'none', cursor: 'pointer',
                background: 'linear-gradient(135deg,#f43f5e,#e11d48)',
                color: 'white', fontWeight: 700, fontSize: 12.5,
                display: 'flex', alignItems: 'center', gap: 7, flexShrink: 0,
              }}
            >
              <BrainCircuit size={15} />
              {actionLoading === 'suggested' ? 'Balancing…' : `Turn Off All Suggested (${aiSuggested.length} Loads)`}
            </button>
          </div>

          {/* AI Recommended Non-Critical Loads to Turn Off */}
          {aiSuggested.length > 0 && (
            <div style={{
              background: 'rgba(0, 0, 0, 0.3)',
              borderRadius: 12,
              padding: '12px 14px',
              border: '1px solid rgba(245,158,11,0.25)',
              width: '100%',
              boxSizing: 'border-box'
            }}>
              <div style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--warning)', letterSpacing: '0.4px', textTransform: 'uppercase', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                <Zap size={13} />
                Recommended Non-Critical Loads to Turn Off (Highest Consumers):
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))', gap: 8 }}>
                {(loadsData?.non_critical ?? [])
                  .filter(l => aiSuggested.includes(l.id) && l.status === 'ON')
                  .map(load => (
                    <div
                      key={load.id}
                      style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8,
                        padding: '8px 12px', borderRadius: 8,
                        background: 'rgba(255, 255, 255, 0.03)',
                        border: '1px solid rgba(245, 158, 11, 0.3)',
                      }}
                    >
                      <div style={{ minWidth: 0, flex: 1 }}>
                        <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-1)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={load.name}>
                          {load.name}
                        </div>
                        <div style={{ fontSize: 10.5, color: 'var(--text-3)' }}>
                          {load.zone} &middot; <strong style={{ color: 'var(--warning)' }}>{load.power_kw} kW</strong>
                        </div>
                      </div>

                      <button
                        id={`suggested-toggle-${load.id}`}
                        onClick={() => handleToggle(load.id)}
                        disabled={toggling === load.id}
                        className="toggle-btn toggle-btn-on"
                        style={{ padding: '5px 10px', fontSize: 11, flexShrink: 0 }}
                      >
                        {toggling === load.id ? (
                          <RefreshCw size={11} style={{ animation: 'spin 0.8s linear infinite' }} />
                        ) : (
                          <Power size={11} />
                        )}
                        Turn Off
                      </button>
                    </div>
                  ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── KPI SUMMARY CARDS ────────────────────────────────────── */}
      <div className="lm-kpi-row">
        {[
          { label: 'Critical Load', value: `${criticalPower.toFixed(1)} kW`, sub: `${loadsData?.critical.length ?? 0} loads (Admission, IT, Safety)`, color: 'var(--danger)', icon: <ShieldCheck size={16} /> },
          { label: 'Active Non-Critical', value: `${nonCriticalOnPower.toFixed(1)} kW`, sub: `${loadsData?.non_critical.filter(l => l.status === 'ON').length ?? 0} active rooms/labs`, color: 'var(--warning)', icon: <Zap size={16} /> },
          { label: 'Total Shed Savings', value: `${savedKw.toFixed(1)} kW`, sub: `${loadsData?.non_critical.filter(l => l.status === 'OFF').length ?? 0} loads safely isolated`, color: 'var(--success)', icon: <CheckCircle size={16} /> },
          { label: 'Max Shed Capacity', value: `${(loadsData?.shed_available_kw ?? 0).toFixed(1)} kW`, sub: 'Available headroom to shed', color: 'var(--info)', icon: <ShieldOff size={16} /> },
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

      {/* ── FILTER & SEARCH BAR ──────────────────────────────────── */}
      <div className="lm-filter-bar">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, flex: 1, minWidth: 0, width: '100%' }}>
          <div className="floor-tabs">
            {[
              { id: 'ALL', label: 'All Zones (A-Block)' },
              { id: '1', label: 'Floor 1 (Classrooms A101-104, DSP, Comm & Machines)' },
              { id: '2', label: 'Floor 2 (Classrooms A201-204, VLSI, TI & Prog)' },
              { id: '3', label: 'Floor 3 (Classrooms A301-304, Bio & MATLAB)' },
              { id: 'COMMON', label: 'East & West Seminar Halls & Campus Core' },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setSelectedFloor(tab.id)}
                className={`floor-tab-btn ${selectedFloor === tab.id ? 'active' : ''}`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Quick Category Filter Pills */}
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
            <span style={{ fontSize: 11, color: 'var(--text-3)', fontWeight: 600, marginRight: 4 }}>Filter:</span>
            {[
              { id: 'ALL', label: 'All Categories' },
              { id: 'Classroom', label: '📚 12 Classrooms' },
              { id: 'Laboratory', label: '🔬 13 Specialized Labs' },
              { id: 'Office', label: '🏛️ Admin & Faculty' },
              { id: 'Other', label: '🎭 Seminar Halls & Facilities' },
            ].map(t => (
              <button
                key={t.id}
                onClick={() => setSelectedType(t.id)}
                style={{
                  padding: '3px 10px',
                  borderRadius: 20,
                  border: selectedType === t.id ? '1px solid var(--accent-light)' : '1px solid var(--border-subtle)',
                  background: selectedType === t.id ? 'var(--accent-dim)' : 'rgba(255,255,255,0.03)',
                  color: selectedType === t.id ? 'var(--accent-light)' : 'var(--text-2)',
                  fontSize: 11,
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        <div className="search-box">
          <Search size={14} style={{ color: 'var(--text-3)' }} />
          <input
            type="text"
            placeholder="Search room (e.g. A-101, DSP, Principal, Admission)..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* ── PANELS (CRITICAL & NON-CRITICAL) ────────────────────── */}
      <div className="lm-panels">

        {/* 1. Critical Loads Panel */}
        <GlassCard className="flex flex-col" style={{ borderColor: 'rgba(16,185,129,0.25)', flex: 1 }}>
          <div className="section-header">
            <div className="section-icon success"><ShieldCheck size={16} /></div>
            <div>
              <div className="section-title">Critical Loads (Protected)</div>
              <div className="section-subtitle">
                Admission Office &middot; Central IT &middot; Fire Safety &mdash; Guaranteed uninterrupted power
              </div>
            </div>
          </div>

          <div className="load-list">
            {filteredCritical.length === 0 ? (
              <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-3)', fontSize: 13 }}>
                No critical loads match filter.
              </div>
            ) : (
              filteredCritical.map(load => (
                <div key={load.id} className="load-row load-row-critical">
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1, minWidth: 0 }}>
                    <div className="load-type-dot" style={{ background: TYPE_COLORS[load.type] ?? '#10b981' }} />
                    <div style={{ minWidth: 0 }}>
                      <div className="load-name" title={load.name}>
                        {load.name}
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--text-3)', display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
                        <span className="room-chip">{load.zone}</span>
                        <span>&middot;</span>
                        <span style={{ color: TYPE_COLORS[load.type] ?? 'var(--text-2)', fontWeight: 600 }}>{load.type}</span>
                        {load.id === 'LD-C01' && (
                          <span style={{ color: '#f59e0b', fontWeight: 700, background: 'rgba(245,158,11,0.15)', padding: '1px 6px', borderRadius: 4, fontSize: 10 }}>
                            ★ ADMISSION
                          </span>
                        )}
                        {load.id === 'LD-C02' && (
                          <span style={{ color: '#ec4899', fontWeight: 700, background: 'rgba(236,72,153,0.15)', padding: '1px 6px', borderRadius: 4, fontSize: 10 }}>
                            ★ PRINCIPAL
                          </span>
                        )}
                        {load.id === 'LD-C04' && (
                          <span style={{ color: '#8b5cf6', fontWeight: 700, background: 'rgba(139,92,246,0.15)', padding: '1px 6px', borderRadius: 4, fontSize: 10 }}>
                            ★ COE EXAM CELL
                          </span>
                        )}
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
              ))
            )}
          </div>
        </GlassCard>

        {/* 2. Non-Critical Loads Panel */}
        <GlassCard className="flex flex-col" style={{ borderColor: 'rgba(245,158,11,0.25)', flex: 1.2 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, flexWrap: 'wrap', gap: 10 }}>
            <div className="section-header" style={{ marginBottom: 0 }}>
              <div className="section-icon warning"><ShieldOff size={16} /></div>
              <div>
                <div className="section-title">Non-Critical Loads (Controllable)</div>
                <div className="section-subtitle">
                  Classrooms A-101 to A-304, Specialized Labs &amp; Faculty Cabins
                </div>
              </div>
            </div>

            <div style={{ fontSize: 11.5, color: 'var(--text-3)' }}>
              Showing {filteredNonCritical.length} loads
            </div>
          </div>

          <div className="load-list">
            {filteredNonCritical.length === 0 ? (
              <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-3)', fontSize: 13 }}>
                No non-critical loads match filter.
              </div>
            ) : (
              filteredNonCritical
                .sort((a, b) => b.power_kw - a.power_kw)
                .map(load => {
                  const isOn = load.status === 'ON';
                  const isSuggested = aiSuggested.includes(load.id);
                  const isLastShed = lastShed.includes(load.id);

                  return (
                    <div
                      key={load.id}
                      className={`load-row ${isOn ? 'load-row-on' : 'load-row-off'} ${isSuggested && isOn ? 'load-row-suggested' : ''}`}
                    >
                      {isSuggested && isOn && (
                        <span className="load-suggest-badge">AI Shed Pick</span>
                      )}
                      {isLastShed && !isOn && (
                        <span className="load-shed-badge">Shed &check;</span>
                      )}

                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1, minWidth: 0 }}>
                        <div
                          className="load-type-dot"
                          style={{
                            background: isOn ? (TYPE_COLORS[load.type] ?? '#94a3b8') : 'rgba(255,255,255,0.15)',
                            boxShadow: isOn ? `0 0 8px ${TYPE_COLORS[load.type] ?? '#94a3b8'}` : 'none'
                          }}
                        />
                        <div style={{ minWidth: 0 }}>
                          <div className={`load-name ${!isOn ? 'dimmed' : ''}`} title={load.name}>
                            {load.name}
                          </div>
                          <div style={{ fontSize: 11, color: 'var(--text-3)', display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
                            <span className="room-chip">{load.zone}</span>
                            <span>&middot;</span>
                            <span style={{ color: isOn ? (TYPE_COLORS[load.type] ?? 'var(--text-2)') : 'var(--text-3)', fontWeight: 600 }}>
                              {load.type}
                            </span>
                            {load.floor ? (
                              <span style={{ fontSize: 10, color: 'var(--text-3)' }}>[Floor {load.floor}]</span>
                            ) : null}
                            {load.id === 'LD-F0-SEME' && (
                              <span style={{ color: '#ec4899', fontWeight: 700, background: 'rgba(236,72,153,0.15)', padding: '1px 6px', borderRadius: 4, fontSize: 10 }}>
                                ★ EAST AUDITORIUM
                              </span>
                            )}
                            {load.id === 'LD-F0-SEMW' && (
                              <span style={{ color: '#ec4899', fontWeight: 700, background: 'rgba(236,72,153,0.15)', padding: '1px 6px', borderRadius: 4, fontSize: 10 }}>
                                ★ WEST AUDITORIUM
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
                        <span style={{ fontSize: 13.5, fontWeight: 700, color: isOn ? 'var(--text-1)' : 'var(--text-3)', minWidth: 54, textAlign: 'right' }}>
                          {isOn ? `${load.power_kw} kW` : '0 kW'}
                        </span>

                        <button
                          id={`toggle-${load.id}`}
                          onClick={() => handleToggle(load.id)}
                          disabled={toggling === load.id}
                          className={`toggle-btn ${isOn ? 'toggle-btn-on' : 'toggle-btn-off'}`}
                        >
                          {toggling === load.id ? (
                            <RefreshCw size={12} style={{ animation: 'spin 0.8s linear infinite' }} />
                          ) : (
                            <Power size={12} />
                          )}
                          <span>{isOn ? 'Turn Off' : 'Turn On'}</span>
                        </button>
                      </div>
                    </div>
                  );
                })
            )}
          </div>

          {/* Real-time savings summary */}
          {savedKw > 0 && (
            <div className="savings-banner">
              <CheckCircle size={16} style={{ color: 'var(--success)', flexShrink: 0 }} />
              <span style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--success)' }}>
                {savedKw.toFixed(1)} kW shaved off peak grid load by shedding {loadsData?.non_critical.filter(l => l.status === 'OFF').length} non-critical units.
              </span>
            </div>
          )}
        </GlassCard>

      </div>
    </div>
  );
};

export default LoadManagement;
