import { useEffect, useState } from 'react';
import {
  Network, Zap, CheckCircle2, RefreshCw, Power, Terminal
} from 'lucide-react';
import GlassCard from '../components/GlassCard';
import PipelineFlow from '../components/PipelineFlow';
import {
  fetchCurrentData, fetchPrediction, fetchLoads,
  toggleLoad, shedSuggestedLoads
} from '../services/api';

export const DigitalTwin = () => {
  const [current, setCurrent] = useState<any>({});
  const [prediction, setPrediction] = useState<any>({});
  const [loadsData, setLoadsData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [activeFloor, setActiveFloor] = useState<number>(2);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [repredictNote, setRepredictNote] = useState<string | null>(null);

  const loadData = async () => {
    try {
      const [cur, pred, lds] = await Promise.all([
        fetchCurrentData(),
        fetchPrediction(),
        fetchLoads().catch(() => null),
      ]);
      setCurrent(cur || {});
      setPrediction(pred || {});
      if (lds) setLoadsData(lds);
    } catch {}
  };

  useEffect(() => {
    loadData();
    const iv = setInterval(loadData, 4000);
    return () => clearInterval(iv);
  }, []);

  const handleToggle = async (id: string) => {
    setTogglingId(id);
    try {
      await toggleLoad(id);
      await loadData();
      setRepredictNote(`Digital Twin updated state for load ${id}. AI re-forecasted next peak!`);
      setTimeout(() => setRepredictNote(null), 5000);
    } catch {} finally {
      setTogglingId(null);
    }
  };

  const handleShedSuggested = async () => {
    setLoading(true);
    try {
      const res = await shedSuggestedLoads();
      await loadData();
      setRepredictNote(`Digital Twin shed ${res.shed_ids?.length || 0} non-critical units (-${res.saved_kw || 0} kW). AI re-prediction completed!`);
      setTimeout(() => setRepredictNote(null), 6000);
    } catch {} finally {
      setLoading(false);
    }
  };

  const currentPower = current.power || 0;
  const predictedPower = prediction.predicted_load || 0;
  const safeLimit = prediction.safe_limit || 75;
  const risk = prediction.risk_level || 'LOW';

  // Floor loads breakdown
  const allLoads = [...(loadsData?.critical || []), ...(loadsData?.non_critical || [])];
  const floorLoads = allLoads.filter((l: any) => l.floor === activeFloor);
  const floorActiveKw = floorLoads.filter(l => l.status === 'ON').reduce((s, l) => s + l.power_kw, 0);

  const floorStats = [
    { floor: 0, name: 'Ground Floor (Auditorium & Admin)', kw: allLoads.filter(l => l.floor === 0 && l.status === 'ON').reduce((s, l) => s + l.power_kw, 0).toFixed(1), totalLoads: allLoads.filter(l => l.floor === 0).length },
    { floor: 1, name: 'Floor 1 (Programming Labs & ME)', kw: allLoads.filter(l => l.floor === 1 && l.status === 'ON').reduce((s, l) => s + l.power_kw, 0).toFixed(1), totalLoads: allLoads.filter(l => l.floor === 1).length },
    { floor: 2, name: 'Floor 2 (Heavy Machines & Drives)', kw: allLoads.filter(l => l.floor === 2 && l.status === 'ON').reduce((s, l) => s + l.power_kw, 0).toFixed(1), totalLoads: allLoads.filter(l => l.floor === 2).length, hotspot: true },
    { floor: 3, name: 'Floor 3 (ECE VLSI & Bio-Med)', kw: allLoads.filter(l => l.floor === 3 && l.status === 'ON').reduce((s, l) => s + l.power_kw, 0).toFixed(1), totalLoads: allLoads.filter(l => l.floor === 3).length },
  ];

  return (
    <div className="flex flex-col gap-6" style={{ width: '100%', maxWidth: '100%' }}>

      {/* Page Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <span className="badge badge-accent" style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
              <Network size={12} />
              VIRTUAL TWIN ENGINE
            </span>
            <span style={{ fontSize: 11, color: 'var(--text-3)' }}>Dr. NGPIT A-Block Real-Time Twin</span>
          </div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: 'var(--text-1)', letterSpacing: '-0.4px', margin: '4px 0' }}>
            Digital Twin Architectural Model & Live Telemetry
          </h1>
          <p style={{ fontSize: 13, color: 'var(--text-2)', maxWidth: 800 }}>
            Bi-directional synchronization between physical A-Block power distribution boards, Raspberry Pi edge gateways, and the predictive AI state machine.
          </p>
        </div>

        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <div style={{
            padding: '8px 14px', borderRadius: 12,
            background: 'rgba(34,211,238,0.1)', border: '1px solid rgba(34,211,238,0.25)',
            display: 'flex', alignItems: 'center', gap: 8
          }}>
            <span className="live-ping-dot" />
            <span style={{ fontSize: 12, fontWeight: 700, color: '#22d3ee' }}>
              Twin State: SYNCHRONIZED
            </span>
          </div>
        </div>
      </div>

      {/* RE-PREDICT TOAST BANNER */}
      {repredictNote && (
        <div className="repredict-toast animate-scale-up" style={{ width: '100%' }}>
          <CheckCircle2 size={18} className="text-emerald" style={{ flexShrink: 0, marginTop: 2 }} />
          <div style={{ fontSize: 13, color: 'var(--text-1)', fontWeight: 600 }}>
            {repredictNote}
          </div>
        </div>
      )}

      {/* ── CORE FLOW LINE COMPONENT ───────────────────────────── */}
      <PipelineFlow
        currentPower={currentPower}
        predictedPower={predictedPower}
        safeLimit={safeLimit}
        riskLevel={risk}
        isShedActive={loadsData?.non_critical.some((l: any) => l.status === 'OFF')}
      />

      {/* ── DIGITAL TWIN SCHEMATIC & TELEMETRY ───────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: 24 }}>

        {/* Left: Building Floor Model & Sub-Loads */}
        <GlassCard elevation="accent" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: 18 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
            <div>
              <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-1)', margin: 0 }}>
                A-Block Floor Hierarchy & Active Sub-Loads
              </h3>
              <p style={{ fontSize: 12, color: 'var(--text-3)', margin: '2px 0 0 0' }}>
                Select a floor to inspect the digital twin circuit entities and power states
              </p>
            </div>
            <span className="badge badge-accent">
              Active on Floor {activeFloor}: {floorActiveKw.toFixed(1)} kW
            </span>
          </div>

          {/* Floor selector cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
            {floorStats.map(f => (
              <button
                key={f.floor}
                onClick={() => setActiveFloor(f.floor)}
                style={{
                  padding: '12px 10px', borderRadius: 12, textAlign: 'left',
                  background: activeFloor === f.floor ? 'rgba(99,102,241,0.2)' : 'rgba(255,255,255,0.03)',
                  border: activeFloor === f.floor ? '1px solid #6366f1' : '1px solid rgba(255,255,255,0.08)',
                  cursor: 'pointer', transition: 'all 0.2s', display: 'flex', flexDirection: 'column', gap: 4
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: activeFloor === f.floor ? '#818cf8' : 'var(--text-3)' }}>
                    FLOOR {f.floor}
                  </span>
                  {f.hotspot && (
                    <span style={{ fontSize: 9, background: 'rgba(244,63,94,0.2)', color: 'var(--danger)', padding: '1px 4px', borderRadius: 4, fontWeight: 700 }}>
                      HOTSPOT
                    </span>
                  )}
                </div>
                <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--text-1)' }}>
                  {f.kw} <span style={{ fontSize: 10, color: 'var(--text-3)', fontWeight: 500 }}>kW</span>
                </div>
                <span style={{ fontSize: 10, color: 'var(--text-3)' }}>{f.totalLoads} mapped units</span>
              </button>
            ))}
          </div>

          {/* Detailed Circuit Entities for the active floor */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 6 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-2)', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
              Circuits in {floorStats.find(f => f.floor === activeFloor)?.name}:
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 320, overflowY: 'auto', paddingRight: 4 }}>
              {floorLoads.map((load: any) => {
                const isOn = load.status === 'ON';
                return (
                  <div
                    key={load.id}
                    style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12,
                      padding: '10px 14px', borderRadius: 10,
                      background: isOn ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.25)',
                      border: isOn ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(255,255,255,0.03)',
                      opacity: isOn ? 1 : 0.65
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0, flex: 1 }}>
                      <span style={{
                        width: 8, height: 8, borderRadius: '50%',
                        background: isOn ? '#10b981' : 'rgba(255,255,255,0.2)',
                        boxShadow: isOn ? '0 0 8px #10b981' : 'none'
                      }} />
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontSize: 13, fontWeight: 700, color: isOn ? 'var(--text-1)' : 'var(--text-3)' }}>
                          {load.name}
                        </div>
                        <div style={{ fontSize: 11, color: 'var(--text-3)', display: 'flex', gap: 6 }}>
                          <span>{load.zone}</span>
                          <span>&middot;</span>
                          <span style={{ color: load.critical ? 'var(--danger)' : 'var(--accent-light)' }}>
                            {load.critical ? 'CRITICAL (Protected)' : 'NON-CRITICAL (Flexible)'}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
                      <span style={{ fontSize: 13, fontWeight: 700, color: isOn ? 'var(--text-1)' : 'var(--text-3)' }}>
                        {isOn ? `${load.power_kw} kW` : '0.0 kW'}
                      </span>

                      {!load.critical ? (
                        <button
                          onClick={() => handleToggle(load.id)}
                          disabled={togglingId === load.id}
                          className={`toggle-btn ${isOn ? 'toggle-btn-on' : 'toggle-btn-off'}`}
                          style={{ padding: '5px 10px', fontSize: 11 }}
                        >
                          {togglingId === load.id ? (
                            <RefreshCw size={11} className="animate-spin" />
                          ) : (
                            <Power size={11} />
                          )}
                          <span>{isOn ? 'Turn Off' : 'Turn On'}</span>
                        </button>
                      ) : (
                        <span style={{ fontSize: 10.5, color: 'var(--text-3)', padding: '4px 8px', borderRadius: 6, background: 'rgba(255,255,255,0.03)' }}>
                          Locked
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </GlassCard>

        {/* Right: Edge Gateway Live Packet Stream */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <GlassCard elevation="accent" style={{ padding: '22px', display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Terminal size={18} className="text-violet" />
                <h4 style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-1)', margin: 0 }}>
                  Raspberry Pi 4B Edge Packet Stream
                </h4>
              </div>
              <span className="badge badge-accent">STREAMING</span>
            </div>

            <p style={{ fontSize: 12, color: 'var(--text-3)', margin: 0 }}>
              Raw JSON telemetry packet broadcast every 2000ms from the edge gateway to the backend digital twin service:
            </p>

            <pre style={{
              background: 'rgba(0, 0, 0, 0.65)', border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: 12, padding: '14px', fontSize: 11.5, color: '#22d3ee',
              fontFamily: 'monospace', overflowX: 'auto', lineHeight: 1.55
            }}>
{`{
  "timestamp": "${new Date().toISOString()}",
  "edge_gateway_id": "RPI-4B-A-BLOCK-01",
  "feeder": "EDB-01-MAIN-TRANSFORMER",
  "transducers": ["PZEM-004T", "CT-100A", "INA219"],
  "voltage_rms_v": ${(current.voltage || 231.2).toFixed(1)},
  "current_rms_a": ${(current.current || 18.5).toFixed(1)},
  "frequency_hz": ${(current.frequency || 50.0).toFixed(2)},
  "power_factor": ${(current.power_factor || 0.95).toFixed(2)},
  "active_power_kw": ${(current.power || 42.8).toFixed(2)},
  "temperature_c": ${(current.temperature || 28.5).toFixed(1)},
  "twin_sync_ack": true,
  "packet_loss_rate": "0.00%",
  "latency_ms": 14
}`}
            </pre>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <div style={{ padding: '10px 12px', borderRadius: 10, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                <div style={{ fontSize: 10, color: 'var(--text-3)', textTransform: 'uppercase' }}>Ingestion Interval</div>
                <div style={{ fontSize: 15, fontWeight: 800, color: '#818cf8', marginTop: 2 }}>2.0 Seconds</div>
              </div>
              <div style={{ padding: '10px 12px', borderRadius: 10, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                <div style={{ fontSize: 10, color: 'var(--text-3)', textTransform: 'uppercase' }}>Edge Filtering</div>
                <div style={{ fontSize: 15, fontWeight: 800, color: '#10b981', marginTop: 2 }}>Kalman Filter</div>
              </div>
            </div>
          </GlassCard>

          {/* Quick Actuation Simulator */}
          <GlassCard style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Zap size={16} className="text-amber" />
              <h5 style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--text-1)', margin: 0 }}>
                Digital Twin AI Closed-Loop Verification
              </h5>
            </div>
            <p style={{ fontSize: 12, color: 'var(--text-2)', lineHeight: 1.5, margin: 0 }}>
              When non-critical loads are shed, the virtual breaker model immediately pushes the lower wattage state to the AI prediction engine.
            </p>

            <button
              onClick={handleShedSuggested}
              disabled={loading}
              className="btn-danger-pulse"
              style={{
                width: '100%', padding: '10px 16px', borderRadius: 10,
                border: 'none', cursor: 'pointer',
                background: 'linear-gradient(135deg, #f43f5e 0%, #e11d48 100%)',
                color: 'white', fontWeight: 700, fontSize: 12.5,
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                marginTop: 4
              }}
            >
              {loading ? (
                <RefreshCw size={14} className="animate-spin" />
              ) : (
                <Zap size={14} />
              )}
              <span>Shed Non-Critical & Trigger AI Re-Prediction</span>
            </button>
          </GlassCard>
        </div>
      </div>

    </div>
  );
};

export default DigitalTwin;
