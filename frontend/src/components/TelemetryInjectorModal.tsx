import React, { useState } from 'react';
import { X, Zap, Send, CheckCircle2, RefreshCw, Sliders } from 'lucide-react';
import { postClassroomSensorData } from '../services/api';

interface TelemetryInjectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const TelemetryInjectorModal: React.FC<TelemetryInjectorModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [voltage, setVoltage] = useState<string>('231.4');
  const [current, setCurrent] = useState<string>('2.30');
  const [powerFactor, setPowerFactor] = useState<string>('0.96');
  const [frequency, setFrequency] = useState<string>('50.00');
  const [sending, setSending] = useState(false);
  const [feedback, setFeedback] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);

  if (!isOpen) return null;

  const vNum = parseFloat(voltage) || 0;
  const cNum = parseFloat(current) || 0;
  const pfNum = parseFloat(powerFactor) || 0.95;
  const calculatedKw = ((vNum * cNum * pfNum) / 1000).toFixed(3);

  const PRESETS = [
    { label: 'Nominal (230 V)',   v: '230.2', c: '2.25', pf: '0.96' },
    { label: 'Peak High (245 V)', v: '245.0', c: '3.10', pf: '0.98' },
    { label: 'Sag (212 V)',       v: '212.0', c: '1.95', pf: '0.94' },
    { label: 'Brownout (185 V)',  v: '185.0', c: '1.40', pf: '0.90' },
    { label: 'Power Cut (0 V)',   v: '0.0',   c: '0.00', pf: '0.00' },
  ];

  const handleApplyPreset = (p: typeof PRESETS[0]) => {
    setVoltage(p.v);
    setCurrent(p.c);
    setPowerFactor(p.pf);
  };

  const handleInjectTelemetry = async (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);
    setFeedback(null);

    try {
      const payload = {
        voltage: vNum,
        current: cNum,
        power: parseFloat(calculatedKw),
        power_factor: pfNum,
        frequency: parseFloat(frequency) || 50.0,
        temperature: 28.0,
        api_key: 'NGP-ECE-2026-IIECEB-NODE',
      };

      await postClassroomSensorData(payload);
      setFeedback({
        msg: `Transmitted ${vNum} V (${calculatedKw} kW) to Digital Twin successfully!`,
        type: 'success',
      });

      if (onSuccess) {
        onSuccess();
      }

      setTimeout(() => {
        setFeedback(null);
      }, 4000);
    } catch {
      setFeedback({
        msg: 'Failed to send telemetry to backend. Please check network connection.',
        type: 'error',
      });
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="telemetry-modal-backdrop" onClick={onClose}>
      <div
        className="telemetry-modal-card animate-scale-up"
        onClick={e => e.stopPropagation()}
        style={{ maxWidth: 540 }}
      >
        {/* Modal Top */}
        <div className="modal-top-bar">
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div className="load-type-avatar avatar-gold">
              <Sliders size={20} className="text-amber" />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <h3 style={{ fontSize: 16, fontWeight: 800, color: 'var(--text-1)', margin: 0 }}>
                  Manual Hardware Telemetry Injector
                </h3>
                <span className="badge badge-accent">DIRECT INPUT</span>
              </div>
              <p style={{ fontSize: 11.5, color: 'var(--text-3)', margin: '2px 0 0 0' }}>
                Type voltage values directly to test live dashboard displays without physical wiring
              </p>
            </div>
          </div>
          <button className="modal-close-btn" onClick={onClose} aria-label="Close">
            <X size={20} />
          </button>
        </div>

        {/* Quick Presets */}
        <div style={{ marginTop: 14 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', marginBottom: 8, letterSpacing: '0.4px' }}>
            Quick Presets
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {PRESETS.map(p => (
              <button
                key={p.label}
                type="button"
                onClick={() => handleApplyPreset(p)}
                style={{
                  padding: '6px 12px',
                  borderRadius: 8,
                  fontSize: 11.5,
                  fontWeight: 600,
                  background: voltage === p.v ? 'rgba(34,211,238,0.2)' : 'rgba(255,255,255,0.04)',
                  border: voltage === p.v ? '1px solid rgba(34,211,238,0.5)' : '1px solid rgba(255,255,255,0.08)',
                  color: voltage === p.v ? '#22d3ee' : 'var(--text-2)',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                }}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {/* Live Calculation Preview Card */}
        <div style={{
          marginTop: 16, padding: '12px 16px', borderRadius: 12,
          background: 'linear-gradient(135deg, rgba(34,211,238,0.08), rgba(99,102,241,0.08))',
          border: '1px solid rgba(34,211,238,0.2)',
          display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, textAlign: 'center'
        }}>
          <div>
            <div style={{ fontSize: 10, color: 'var(--text-3)', textTransform: 'uppercase' }}>Voltage</div>
            <div style={{ fontSize: 18, fontWeight: 800, color: '#22d3ee', marginTop: 2 }}>
              {vNum.toFixed(1)} <span style={{ fontSize: 11, fontWeight: 500 }}>V</span>
            </div>
          </div>
          <div>
            <div style={{ fontSize: 10, color: 'var(--text-3)', textTransform: 'uppercase' }}>Current</div>
            <div style={{ fontSize: 18, fontWeight: 800, color: '#f59e0b', marginTop: 2 }}>
              {cNum.toFixed(2)} <span style={{ fontSize: 11, fontWeight: 500 }}>A</span>
            </div>
          </div>
          <div>
            <div style={{ fontSize: 10, color: 'var(--text-3)', textTransform: 'uppercase' }}>Power</div>
            <div style={{ fontSize: 18, fontWeight: 800, color: '#10b981', marginTop: 2 }}>
              {calculatedKw} <span style={{ fontSize: 11, fontWeight: 500 }}>kW</span>
            </div>
          </div>
        </div>

        {/* Form Inputs */}
        <form onSubmit={handleInjectTelemetry} style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--text-2)', marginBottom: 6, textTransform: 'uppercase' }}>
                Voltage (V)
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  max="300"
                  value={voltage}
                  onChange={e => setVoltage(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: 10,
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(255,255,255,0.12)',
                    color: 'var(--text-1)',
                    fontSize: 14,
                    fontWeight: 700,
                    outline: 'none',
                  }}
                  placeholder="e.g. 231.4"
                  required
                />
                <span style={{ position: 'absolute', right: 12, top: 10, fontSize: 12, color: 'var(--text-3)', fontWeight: 600 }}>V</span>
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--text-2)', marginBottom: 6, textTransform: 'uppercase' }}>
                Current (A)
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  max="50"
                  value={current}
                  onChange={e => setCurrent(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: 10,
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(255,255,255,0.12)',
                    color: 'var(--text-1)',
                    fontSize: 14,
                    fontWeight: 700,
                    outline: 'none',
                  }}
                  placeholder="e.g. 2.30"
                  required
                />
                <span style={{ position: 'absolute', right: 12, top: 10, fontSize: 12, color: 'var(--text-3)', fontWeight: 600 }}>A</span>
              </div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--text-2)', marginBottom: 6, textTransform: 'uppercase' }}>
                Power Factor
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                max="1.0"
                value={powerFactor}
                onChange={e => setPowerFactor(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  borderRadius: 10,
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.12)',
                  color: 'var(--text-1)',
                  fontSize: 14,
                  fontWeight: 700,
                  outline: 'none',
                }}
                placeholder="e.g. 0.96"
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--text-2)', marginBottom: 6, textTransform: 'uppercase' }}>
                Frequency (Hz)
              </label>
              <input
                type="number"
                step="0.01"
                min="40"
                max="60"
                value={frequency}
                onChange={e => setFrequency(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  borderRadius: 10,
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.12)',
                  color: 'var(--text-1)',
                  fontSize: 14,
                  fontWeight: 700,
                  outline: 'none',
                }}
                placeholder="e.g. 50.00"
              />
            </div>
          </div>

          {/* Feedback message */}
          {feedback && (
            <div
              style={{
                padding: '10px 14px',
                borderRadius: 10,
                fontSize: 12,
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                background: feedback.type === 'success' ? 'rgba(16,185,129,0.15)' : 'rgba(244,63,94,0.15)',
                border: feedback.type === 'success' ? '1px solid rgba(16,185,129,0.3)' : '1px solid rgba(244,63,94,0.3)',
                color: feedback.type === 'success' ? '#34d399' : '#f87171',
              }}
            >
              {feedback.type === 'success' ? <CheckCircle2 size={16} /> : <Zap size={16} />}
              <span>{feedback.msg}</span>
            </div>
          )}

          {/* Submit button */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 6 }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: '10px 16px',
                borderRadius: 10,
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.1)',
                color: 'var(--text-2)',
                fontSize: 13,
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={sending}
              style={{
                padding: '10px 20px',
                borderRadius: 10,
                background: 'linear-gradient(135deg, #06b6d4 0%, #3b82f6 100%)',
                border: 'none',
                color: '#ffffff',
                fontSize: 13,
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                cursor: sending ? 'not-allowed' : 'pointer',
                boxShadow: '0 0 16px rgba(6,182,212,0.4)',
              }}
            >
              {sending ? <RefreshCw size={15} className="animate-spin" /> : <Send size={15} />}
              <span>{sending ? 'Transmitting...' : 'Apply Live Voltage to Website'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
