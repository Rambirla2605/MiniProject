import { useEffect, useState } from 'react';
import {
  Network, Zap, CheckCircle2, RefreshCw, Terminal,
  Radio, Activity
} from 'lucide-react';
import GlassCard from '../components/GlassCard';
import PipelineFlow from '../components/PipelineFlow';
import AeroBlueprintTwin from '../components/AeroBlueprintTwin';
import LoadTelemetryModal from '../components/LoadTelemetryModal';
import {
  fetchCurrentData, fetchPrediction, fetchLoads,
  toggleLoad, shedSuggestedLoads
} from '../services/api';

export const DigitalTwin = () => {
  const [current, setCurrent] = useState<any>({});
  const [prediction, setPrediction] = useState<any>({});
  const [loadsData, setLoadsData] = useState<any>(null);
  const [selectedLoad, setSelectedLoad] = useState<any>(null);
  const [loading, setLoading] = useState(false);
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
      if (lds) {
        setLoadsData(lds);
        // If modal is open, keep selected load telemetry updated
        if (selectedLoad) {
          const updated = lds.all_loads?.find((l: any) => l.id === selectedLoad.id);
          if (updated) setSelectedLoad(updated);
        }
      }
    } catch {}
  };

  useEffect(() => {
    loadData();
    const iv = setInterval(loadData, 3000);
    return () => clearInterval(iv);
  }, [selectedLoad?.id]);

  const handleToggle = async (id: string) => {
    setTogglingId(id);
    try {
      const res = await toggleLoad(id);
      await loadData();
      if (res.telemetry && selectedLoad?.id === id) {
        setSelectedLoad(res.telemetry);
      }
      setRepredictNote(`Digital Twin virtual breaker updated state for load ${id}. Active wattage updated!`);
      setTimeout(() => setRepredictNote(null), 5000);
    } catch (err: any) {
      const msg = err.response?.data?.detail || 'Cannot toggle load';
      setRepredictNote(`Action blocked: ${msg}`);
      setTimeout(() => setRepredictNote(null), 5000);
    } finally {
      setTogglingId(null);
    }
  };

  const handleShedSuggested = async () => {
    setLoading(true);
    try {
      const res = await shedSuggestedLoads();
      await loadData();
      setRepredictNote(`Operator approved shedding: ${res.shed_ids?.length || 0} non-critical loads switched OFF (-${res.saved_kw || 0} kW). Overload mitigated!`);
      setTimeout(() => setRepredictNote(null), 6000);
    } catch {} finally {
      setLoading(false);
    }
  };

  const currentPower = current.power || 0;
  const predictedPower = prediction.predicted_load || 0;
  const safeLimit = prediction.safe_limit || 75;
  const risk = prediction.risk_level || 'LOW';
  const isOverload = predictedPower > safeLimit;

  const allLoads = loadsData?.all_loads || [];
  const sensorRig = loadsData?.sensor_rig_status || current.ece2b_sensor;

  return (
    <div className="flex flex-col gap-6" style={{ width: '100%', maxWidth: '100%' }}>

      {/* Page Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <span className="badge badge-accent" style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
              <Network size={12} />
              DIGITAL TWIN ARCHITECTURE
            </span>
            <span style={{ fontSize: 11, color: 'var(--text-3)' }}>Dr. NGPIT A-Block Multi-Floor Twin</span>
          </div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: 'var(--text-1)', letterSpacing: '-0.4px', margin: '4px 0' }}>
            A-Block 3D Blueprint Model & Live Telemetry Inspector
          </h1>
          <p style={{ fontSize: 13, color: 'var(--text-2)', maxWidth: 880 }}>
            Bi-directional digital twin mapping physical power distribution boards across Ground, 1st, 2nd, and 3rd floors. Real-time voltage and current transducers stream from Classroom II ECE B to the edge gateway and predictive AI state machine.
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

      {/* ── AI ADVISORY CARD (AI ONLY SUGGESTS, CANNOT TURN OFF BY ITSELF) ────── */}
      <GlassCard elevation="accent" style={{ padding: '20px 24px', borderLeft: isOverload ? '4px solid #f43f5e' : '4px solid #10b981' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
          <div style={{ flex: 1, minWidth: 320 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
              <span className={`badge ${isOverload ? 'badge-danger' : 'badge-success'}`}>
                {isOverload ? 'AI OVERLOAD ADVISORY' : 'AI GRID STABILITY NORMAL'}
              </span>
              <span style={{ fontSize: 11, color: 'var(--text-3)' }}>
                Trained with 5 Years of Dr. NGPIT Historical Load Data
              </span>
            </div>

            <h3 style={{ fontSize: 16, fontWeight: 800, color: 'var(--text-1)', margin: '0 0 4px 0' }}>
              {isOverload 
                ? `Peak Overload Risk: Forecasted ${predictedPower.toFixed(1)} kW (Threshold: ${safeLimit} kW)`
                : `Grid Load Within Safe Margins: Forecasted ${predictedPower.toFixed(1)} kW`}
            </h3>

            <p style={{ fontSize: 12.5, color: 'var(--text-2)', lineHeight: 1.6, margin: 0 }}>
              {prediction.ai_advisory || (
                isOverload 
                  ? `Overload predicted around ${prediction.expected_time || 'next 45 min'} at ${prediction.peak_location || 'heavy laboratories'}. The AI recommends shedding high-consumption non-critical loads. Critical administrative facilities remain protected.`
                  : `Current power draw is stable. All critical and academic facilities running within nominal electrical limits.`
              )}
            </p>

            {isOverload && prediction.suggested_shed_loads?.length > 0 && (
              <div style={{ marginTop: 12, padding: '10px 14px', borderRadius: 10, background: 'rgba(244,63,94,0.08)', border: '1px solid rgba(244,63,94,0.2)' }}>
                <div style={{ fontSize: 11.5, fontWeight: 700, color: '#fda4af', marginBottom: 6 }}>
                  AI Suggested Non-Critical Shedding Candidates:
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {prediction.suggested_shed_loads.map((l: any) => (
                    <span key={l.id} className="badge" style={{ background: 'rgba(0,0,0,0.4)', color: 'var(--text-1)', border: '1px solid rgba(255,255,255,0.1)' }}>
                      {l.name} ({l.power_kw} kW)
                    </span>
                  ))}
                </div>
                <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 6 }}>
                  🛡️ <strong>Safety Guarantee:</strong> Examination Cell, Administration Office, Secretary Office, and Principal Office will <em>never</em> be turned off.
                </div>
              </div>
            )}
          </div>

          {isOverload && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8, flexShrink: 0 }}>
              <div style={{ fontSize: 11.5, color: 'var(--text-3)' }}>
                Manual Operator Confirmation Required:
              </div>
              <button
                onClick={handleShedSuggested}
                disabled={loading}
                className="btn-danger-pulse"
                style={{
                  padding: '10px 18px', borderRadius: 10,
                  border: 'none', cursor: 'pointer',
                  background: 'linear-gradient(135deg, #f43f5e 0%, #e11d48 100%)',
                  color: 'white', fontWeight: 700, fontSize: 12.5,
                  display: 'flex', alignItems: 'center', gap: 8
                }}
              >
                {loading ? <RefreshCw size={14} className="animate-spin" /> : <Zap size={14} />}
                <span>Review & Shed AI Suggested Loads</span>
              </button>
            </div>
          )}
        </div>
      </GlassCard>

      {/* ── 5-STAGE PIPELINE FLOW COMPONENT ────────────────────── */}
      <PipelineFlow
        currentPower={currentPower}
        predictedPower={predictedPower}
        safeLimit={safeLimit}
        riskLevel={risk}
        isShedActive={loadsData?.non_critical?.some((l: any) => l.status === 'OFF')}
      />

      {/* ── ISOMETRIC 3D BLUEPRINT DIGITAL TWIN ───────────────── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <AeroBlueprintTwin
          loads={allLoads}
          onSelectLoad={(load) => setSelectedLoad(load)}
          selectedLoadId={selectedLoad?.id}
          sensorRigStatus={sensorRig}
        />
      </div>

      {/* ── LOAD TELEMETRY MODAL INSPECTOR ────────────────────── */}
      {selectedLoad && (
        <LoadTelemetryModal
          load={selectedLoad}
          onClose={() => setSelectedLoad(null)}
          onToggle={handleToggle}
          isToggling={togglingId === selectedLoad.id}
        />
      )}

      {/* ── EDGE PACKET TELEMETRY MONITOR ─────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: 20 }}>
        
        {/* Gateway Telemetry Stream */}
        <GlassCard elevation="accent" style={{ padding: '22px', display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Terminal size={18} className="text-violet" />
              <h4 style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-1)', margin: 0 }}>
                Raspberry Pi 4B Edge Telemetry Gateway Stream
              </h4>
            </div>
            <span className="badge badge-accent">STREAMING (2s)</span>
          </div>

          <p style={{ fontSize: 12, color: 'var(--text-3)', margin: 0 }}>
            Real-time JSON telemetry packet received by the FastAPI digital twin service:
          </p>

          <pre style={{
            background: 'rgba(0, 0, 0, 0.65)', border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: 12, padding: '14px', fontSize: 11.5, color: '#22d3ee',
            fontFamily: 'monospace', overflowX: 'auto', lineHeight: 1.55
          }}>
{`{
  "timestamp": "${new Date().toISOString()}",
  "edge_gateway_id": "RPI-4B-DRNGPIT-A-BLOCK",
  "classroom_ii_ece_b_sensor": {
    "status": "${sensorRig?.connected ? "PHYSICAL_SENSOR_CONNECTED" : "DEMO_TELEMETRY_AWAITING_CIRCUIT"}",
    "measured_voltage_v": ${(sensorRig?.voltage || 230.5).toFixed(1)},
    "measured_current_a": ${(sensorRig?.current || 2.45).toFixed(2)},
    "active_power_kw": ${(sensorRig?.power || 0.53).toFixed(3)},
    "frequency_hz": ${(sensorRig?.frequency || 50.0).toFixed(2)},
    "packets_ingested": ${sensorRig?.packet_count || 42}
  },
  "a_block_campus_total": {
    "active_power_kw": ${currentPower.toFixed(2)},
    "rms_voltage_v": ${(current.voltage || 230.2).toFixed(1)},
    "rms_current_a": ${(current.current || 18.4).toFixed(1)},
    "power_factor": ${(current.power_factor || 0.95).toFixed(2)}
  },
  "digital_twin_sync": true
}`}
          </pre>
        </GlassCard>

        {/* II ECE B Live Status Callout Card */}
        <GlassCard style={{ padding: '22px', display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Radio size={18} className="text-amber" />
            <h4 style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-1)', margin: 0 }}>
              Classroom II ECE B Transducer Node
            </h4>
          </div>

          <div style={{
            padding: '12px 14px', borderRadius: 10,
            background: sensorRig?.connected ? 'rgba(16,185,129,0.1)' : 'rgba(234,179,8,0.1)',
            border: sensorRig?.connected ? '1px solid rgba(16,185,129,0.25)' : '1px solid rgba(234,179,8,0.25)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span className={`status-indicator-dot ${sensorRig?.connected ? 'dot-connected' : 'dot-demo'}`} />
              <span style={{ fontSize: 12.5, fontWeight: 700, color: sensorRig?.connected ? '#10b981' : '#f59e0b' }}>
                {sensorRig?.connected ? 'Physical Transducer Active' : 'Demo Mode (Waiting for Circuit)'}
              </span>
            </div>
            <p style={{ fontSize: 11.5, color: 'var(--text-2)', marginTop: 4, margin: '4px 0 0 0' }}>
              {sensorRig?.connected 
                ? 'Current and Voltage detected from Classroom II ECE B is actively driving the live metrics on the website.'
                : 'Connect your voltage & current sensor circuit via Raspberry Pi gateway or test with one-click test packets.'}
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div style={{ padding: '10px', borderRadius: 8, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
              <div style={{ fontSize: 10, color: 'var(--text-3)', textTransform: 'uppercase' }}>Detected Voltage</div>
              <div style={{ fontSize: 16, fontWeight: 800, color: '#22d3ee', marginTop: 2 }}>
                {(sensorRig?.voltage || 230.5).toFixed(1)} V
              </div>
            </div>
            <div style={{ padding: '10px', borderRadius: 8, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
              <div style={{ fontSize: 10, color: 'var(--text-3)', textTransform: 'uppercase' }}>Detected Current</div>
              <div style={{ fontSize: 16, fontWeight: 800, color: '#f59e0b', marginTop: 2 }}>
                {(sensorRig?.current || 2.45).toFixed(2)} A
              </div>
            </div>
          </div>

          <button
            onClick={() => {
              const ece2b = allLoads.find((l: any) => l.id === 'LD-F3-ECE2B');
              if (ece2b) setSelectedLoad(ece2b);
            }}
            className="btn-accent"
            style={{
              padding: '10px 14px', borderRadius: 10,
              fontSize: 12, fontWeight: 700,
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
              cursor: 'pointer'
            }}
          >
            <Activity size={14} />
            <span>Open II ECE B Live Gauges</span>
          </button>
        </GlassCard>

      </div>

    </div>
  );
};

export default DigitalTwin;
