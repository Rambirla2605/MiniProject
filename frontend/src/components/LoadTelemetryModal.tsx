import React, { useState } from 'react';
import {
  X, Zap, Shield, Radio, Activity,
  RefreshCw, Power, Copy, Check, Terminal, Cpu
} from 'lucide-react';
import { postClassroomSensorData, simulateSensorConnection } from '../services/api';

interface LoadTelemetryModalProps {
  load: any;
  onClose: () => void;
  onToggle: (id: string) => Promise<void>;
  isToggling?: boolean;
}

export const LoadTelemetryModal: React.FC<LoadTelemetryModalProps> = ({
  load,
  onClose,
  onToggle,
  isToggling = false,
}) => {
  const [copied, setCopied] = useState(false);
  const [testSending, setTestSending] = useState(false);
  const [testNote, setTestNote] = useState<string | null>(null);

  if (!load) return null;

  const isEce2b = load.is_sensor_rig || load.id === 'LD-F3-ECE2B' || load.name?.includes('II ECE B');
  const isCritical = load.critical;
  const isOn = load.status === 'ON';

  const voltage = load.voltage ?? (isOn ? 230.4 : 0);
  const current = load.current ?? (isOn ? 2.3 : 0);
  const powerKw = load.power_kw ?? (isOn ? 2.2 : 0);
  const pf = load.power_factor ?? (isOn ? 0.95 : 0);
  const freq = load.frequency ?? (isOn ? 50.0 : 0);
  const temp = load.temperature ?? 28.0;

  const copyEndpointCode = () => {
    const code = `import requests, time, random

# Endpoint for Classroom II ECE B real sensor telemetry
URL = "http://localhost:8000/api/classroom/II-ECE-B/sensor-data"

payload = {
    "voltage": 231.8,       # Measured from AC Voltage Sensor (ZMPT101B / PZEM)
    "current": 2.45,        # Measured from Current Sensor (CT Clamp / ACS712)
    "power_factor": 0.96,   # Computed cos(phi)
    "frequency": 50.02,     # Line frequency (Hz)
    "temperature": 27.5     # Ambient temperature
}

res = requests.post(URL, json=payload)
print("Response:", res.json())`;

    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  const handleSendTestHardwarePacket = async () => {
    setTestSending(true);
    try {
      const samplePayload = {
        voltage: +(231.0 + Math.random() * 2.5).toFixed(1),
        current: +(2.8 + Math.random() * 0.9).toFixed(2),
        power_factor: 0.96,
        frequency: 50.01,
        temperature: 28.2
      };
      await postClassroomSensorData(samplePayload);
      setTestNote(`Transmitted hardware packet: ${samplePayload.voltage}V, ${samplePayload.current}A -> Website telemetry updated to real detected values!`);
      setTimeout(() => setTestNote(null), 5000);
    } catch {
      setTestNote('Error communicating with backend edge endpoint');
      setTimeout(() => setTestNote(null), 4000);
    } finally {
      setTestSending(false);
    }
  };

  const handleToggleSimulateConnect = async () => {
    setTestSending(true);
    try {
      const nextState = !load.sensor_connected;
      await simulateSensorConnection(nextState);
      setTestNote(nextState ? '⚡ Physical sensor state: CONNECTED!' : '⚪ Physical sensor state: DEMO MODE');
      setTimeout(() => setTestNote(null), 4000);
    } catch {} finally {
      setTestSending(false);
    }
  };

  return (
    <div className="telemetry-modal-backdrop" onClick={onClose}>
      <div className="telemetry-modal-card animate-scale-up" onClick={e => e.stopPropagation()}>
        
        {/* Modal Header */}
        <div className="modal-top-bar">
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div className={`load-type-avatar ${isEce2b ? 'avatar-gold' : isCritical ? 'avatar-rose' : 'avatar-blue'}`}>
              {isEce2b ? <Radio size={20} className="pulsing-icon" /> : isCritical ? <Shield size={20} /> : <Zap size={20} />}
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                <span className="room-id-tag">{load.id}</span>
                {isEce2b && (
                  <span className="badge badge-accent" style={{ background: 'rgba(234,179,8,0.18)', color: '#eab308', border: '1px solid rgba(234,179,8,0.4)' }}>
                    ⚡ LIVE SENSOR RIG
                  </span>
                )}
                {isCritical ? (
                  <span className="badge badge-danger">
                    🛡️ CRITICAL (PROTECTED)
                  </span>
                ) : (
                  <span className="badge badge-success">
                    FLEXIBLE (SHEDDABLE)
                  </span>
                )}
              </div>
              <h2 style={{ fontSize: 18, fontWeight: 800, color: 'var(--text-1)', marginTop: 4, letterSpacing: '-0.3px' }}>
                {load.name}
              </h2>
              <div style={{ fontSize: 12, color: 'var(--text-3)', display: 'flex', gap: 8, marginTop: 2 }}>
                <span>{load.zone}</span>
                <span>&middot;</span>
                <span>Floor {load.floor}</span>
                <span>&middot;</span>
                <span>{load.type}</span>
              </div>
            </div>
          </div>

          <button className="modal-close-btn" onClick={onClose} aria-label="Close modal">
            <X size={20} />
          </button>
        </div>

        {/* II ECE B Special Telemetry Notice */}
        {isEce2b ? (
          <div className="ece2b-hardware-banner animate-fade-in">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span className={`status-indicator-dot ${load.sensor_connected ? 'dot-connected' : 'dot-demo'}`} />
                <div>
                  <span style={{ fontSize: 12.5, fontWeight: 700, color: load.sensor_connected ? '#10b981' : '#f59e0b' }}>
                    {load.sensor_connected ? '⚡ REAL HARDWARE TRANSDUCER CONNECTED' : '🟡 DEMO TELEMETRY (Awaiting Physical Circuit Connection)'}
                  </span>
                  <div style={{ fontSize: 11, color: 'var(--text-3)' }}>
                    {load.sensor_connected 
                      ? `Live CT Clamp & AC Voltage sensor active · Detected value shown live` 
                      : `Hardware circuit not yet transmitting · Showing realistic demo readings until connected`}
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  onClick={handleToggleSimulateConnect}
                  disabled={testSending}
                  className="sensor-test-btn"
                  title="Toggle sensor connected status for demo"
                >
                  <Cpu size={13} />
                  <span>{load.sensor_connected ? 'Switch to Demo' : 'Simulate Connect'}</span>
                </button>
                <button
                  onClick={handleSendTestHardwarePacket}
                  disabled={testSending}
                  className="sensor-test-btn"
                  style={{ background: 'rgba(99,102,241,0.2)', borderColor: '#818cf8', color: '#a5b4fc' }}
                >
                  <Terminal size={13} />
                  <span>Push Sensor Packet</span>
                </button>
              </div>
            </div>

            {testNote && (
              <div style={{ marginTop: 8, padding: '6px 10px', borderRadius: 6, background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.3)', fontSize: 11.5, color: '#34d399' }}>
                {testNote}
              </div>
            )}
          </div>
        ) : (
          <div style={{ padding: '8px 14px', borderRadius: 8, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', fontSize: 11.5, color: 'var(--text-3)', display: 'flex', alignItems: 'center', gap: 8 }}>
            <Activity size={14} className="text-cyan" />
            <span>Digital Twin Virtual Telemetry · Live estimated metrics computed based on real-time grid conditions</span>
          </div>
        )}

        {/* ── METRIC DIALS & GAUGES ──────────────────────────────── */}
        <div className="telemetry-metrics-grid">
          
          {/* Voltage Gauge */}
          <div className="metric-dial-card">
            <div className="dial-header">
              <span className="dial-label">RMS VOLTAGE</span>
              <span className="dial-sub">Nominal 230 V</span>
            </div>
            <div className="dial-value-row">
              <span className="dial-main-value text-cyan">{voltage.toFixed(1)}</span>
              <span className="dial-unit">V</span>
            </div>
            <div className="dial-progress-track">
              <div 
                className="dial-progress-fill cyan-fill"
                style={{ width: `${Math.min(100, Math.max(0, (voltage / 260) * 100))}%` }}
              />
            </div>
            <span className="dial-footer-note">Phase 1 · 50 Hz Grid</span>
          </div>

          {/* Current Gauge */}
          <div className="metric-dial-card">
            <div className="dial-header">
              <span className="dial-label">RMS CURRENT</span>
              <span className="dial-sub">Load Amperage</span>
            </div>
            <div className="dial-value-row">
              <span className="dial-main-value text-amber">{current.toFixed(2)}</span>
              <span className="dial-unit">A</span>
            </div>
            <div className="dial-progress-track">
              <div 
                className="dial-progress-fill amber-fill"
                style={{ width: `${Math.min(100, Math.max(0, (current / 25) * 100))}%` }}
              />
            </div>
            <span className="dial-footer-note">Current Transducer (CT)</span>
          </div>

          {/* Active Power */}
          <div className="metric-dial-card">
            <div className="dial-header">
              <span className="dial-label">REAL POWER</span>
              <span className="dial-sub">Active Draw</span>
            </div>
            <div className="dial-value-row">
              <span className="dial-main-value text-emerald">{powerKw.toFixed(2)}</span>
              <span className="dial-unit">kW</span>
            </div>
            <div className="dial-progress-track">
              <div 
                className="dial-progress-fill emerald-fill"
                style={{ width: `${Math.min(100, Math.max(0, (powerKw / 15) * 100))}%` }}
              />
            </div>
            <span className="dial-footer-note">P = V &times; I &times; cos(&phi;)</span>
          </div>

          {/* Power Factor & Frequency */}
          <div className="metric-dial-card">
            <div className="dial-header">
              <span className="dial-label">POWER FACTOR & FREQ</span>
              <span className="dial-sub">Grid Efficiency</span>
            </div>
            <div className="dial-value-row">
              <span className="dial-main-value text-violet">{pf.toFixed(2)}</span>
              <span className="dial-unit">cos &phi;</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11.5, color: 'var(--text-2)', marginTop: 8 }}>
              <span>Frequency:</span>
              <span style={{ fontWeight: 700, color: 'var(--text-1)' }}>{freq.toFixed(2)} Hz</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11.5, color: 'var(--text-2)', marginTop: 2 }}>
              <span>Temperature:</span>
              <span style={{ fontWeight: 700, color: 'var(--text-1)' }}>{temp.toFixed(1)} &deg;C</span>
            </div>
          </div>

        </div>

        {/* ── CONTACTOR / BREAKER CONTROLS ───────────────────────── */}
        <div className="breaker-control-section">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-1)' }}>
                Digital Twin Virtual Contactor State
              </div>
              <p style={{ fontSize: 11.5, color: 'var(--text-3)', margin: '2px 0 0 0' }}>
                {isCritical 
                  ? 'Locked: Under college safety protocol, critical facilities cannot be switched off.' 
                  : 'Flexible: Can be toggled manually or shed during peak overload prediction.'}
              </p>
            </div>

            {isCritical ? (
              <div className="critical-lock-pill">
                <Shield size={14} className="text-rose" />
                <span>SHEDDING DISABLED (CRITICAL)</span>
              </div>
            ) : (
              <button
                onClick={() => onToggle(load.id)}
                disabled={isToggling}
                className={`toggle-btn ${isOn ? 'toggle-btn-on' : 'toggle-btn-off'}`}
                style={{ padding: '8px 16px', fontSize: 12.5 }}
              >
                {isToggling ? (
                  <RefreshCw size={14} className="animate-spin" />
                ) : (
                  <Power size={14} />
                )}
                <span>{isOn ? 'Turn Load OFF' : 'Turn Load ON'}</span>
              </button>
            )}
          </div>
        </div>

        {/* ── II ECE B CODE CONNECTOR HELPER ─────────────────────── */}
        {isEce2b && (
          <div className="hardware-code-accordion">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <Terminal size={15} className="text-cyan" />
                <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-2)', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                  Raspberry Pi Edge Ingestion Script (Python / REST API)
                </span>
              </div>
              <button onClick={copyEndpointCode} className="copy-code-btn">
                {copied ? <Check size={13} className="text-emerald" /> : <Copy size={13} />}
                <span>{copied ? 'Copied' : 'Copy Code'}</span>
              </button>
            </div>

            <pre className="hardware-code-pre">
{`# 1. Connect Voltage & Current sensors to Raspberry Pi ADC / Serial
# 2. Transmit real-time sensor packets via HTTP POST:
POST http://localhost:8000/api/classroom/II-ECE-B/sensor-data
Content-Type: application/json

{
  "voltage": 230.5,       // Detected Voltage (V)
  "current": 2.45,        // Detected Current (A)
  "power_factor": 0.95,   // Power Factor
  "frequency": 50.0       // Frequency (Hz)
}`}
            </pre>
          </div>
        )}

      </div>
    </div>
  );
};

export default LoadTelemetryModal;
