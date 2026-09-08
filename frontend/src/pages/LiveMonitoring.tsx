import React, { useEffect, useState } from 'react';
import { fetchCurrentData } from '../services/api';
import { Activity, Zap, Thermometer, Droplets, Wifi } from 'lucide-react';
import { GlassCard } from '../components/GlassCard';
interface Param {
  label: string;
  value: string;
  unit: string;
  color?: string;
  icon: React.ReactNode;
}

const LiveMonitoring = () => {
  const [current, setCurrent] = useState<any>({});
  const [tick, setTick]       = useState(0);

  useEffect(() => {
    const load = async () => {
      try { setCurrent(await fetchCurrentData()); } catch {}
    };
    load();
    const iv = setInterval(() => { load(); setTick(t => t + 1); }, 2000);
    return () => clearInterval(iv);
  }, []);

  const params: Param[] = [
    { label: 'Voltage',      value: (current.voltage      || 0).toFixed(1), unit: 'V',   color: 'var(--accent-light)', icon: <Zap size={20} /> },
    { label: 'Current',      value: (current.current      || 0).toFixed(1), unit: 'A',   color: 'var(--cyan)',         icon: <Activity size={20} /> },
    { label: 'Active Power', value: (current.power        || 0).toFixed(2), unit: 'kW',  color: 'var(--violet)',       icon: <Zap size={20} /> },
    { label: 'Power Factor', value: (current.power_factor || 0).toFixed(3), unit: '',    color: 'var(--success)',      icon: <Activity size={20} /> },
    { label: 'Frequency',    value: (current.frequency    || 0).toFixed(2), unit: 'Hz',  color: 'var(--warning)',      icon: <Wifi size={20} /> },
    { label: 'Energy Today', value: '318.6',                                unit: 'kWh', color: 'var(--accent-light)', icon: <Zap size={20} /> },
  ];

  return (
    <div className="flex flex-col gap-6">

      {/* Page Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 800, color: 'var(--text-1)', letterSpacing: '-0.3px' }}>Live Electrical Monitoring</h1>
          <p style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 3 }}>Real-time simulated sensor values · A Block Main Distribution Panel</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'var(--success-dim)', border: '1px solid rgba(16,185,129,0.25)', borderRadius: 20, padding: '6px 14px' }}>
          <span style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--success)', display: 'block', animation: 'pulse-dot 2s ease infinite', boxShadow: '0 0 8px var(--success)' }} />
          <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--success)', letterSpacing: '0.5px' }}>LIVE SIMULATION</span>
        </div>
      </div>

      {/* Main Params Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
        {params.map(({ label, value, unit, color, icon }) => (
          <GlassCard key={label} className="flex flex-col gap-14" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-3)', letterSpacing: '0.8px', textTransform: 'uppercase' }}>
                {label}
              </span>
              <span style={{ color, opacity: 0.8 }}>{icon}</span>
            </div>

            <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
              <span style={{ fontSize: 38, fontWeight: 800, color, lineHeight: 1, fontVariantNumeric: 'tabular-nums', letterSpacing: '-1px' }}>
                {value}
              </span>
              {unit && <span style={{ fontSize: 16, fontWeight: 500, color: 'var(--text-3)' }}>{unit}</span>}
            </div>

            <div style={{ height: 3, borderRadius: 99, background: 'rgba(255,255,255,0.05)', overflow: 'hidden' }}>
              <div style={{
                height: '100%',
                borderRadius: 99,
                background: color,
                width: `${50 + Math.sin(tick * 0.4 + label.length) * 20}%`,
                transition: 'width 1.5s ease',
                boxShadow: `0 0 8px ${color}`,
              }} />
            </div>
          </GlassCard>
        ))}
      </div>

      {/* Environmental Row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
        <GlassCard style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ width: 48, height: 48, borderRadius: 14, background: 'var(--warning-dim)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--warning)', flexShrink: 0 }}>
            <Thermometer size={22} />
          </div>
          <div>
            <div style={{ fontSize: 11, color: 'var(--text-3)', fontWeight: 600, letterSpacing: '0.6px', textTransform: 'uppercase', marginBottom: 4 }}>Indoor Temperature</div>
            <div style={{ fontSize: 28, fontWeight: 800, color: 'var(--text-1)', lineHeight: 1 }}>
              {(current.temperature || 0).toFixed(1)} <span style={{ fontSize: 14, color: 'var(--text-3)', fontWeight: 500 }}>°C</span>
            </div>
          </div>
        </GlassCard>

        <GlassCard style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ width: 48, height: 48, borderRadius: 14, background: 'var(--info-dim)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--info)', flexShrink: 0 }}>
            <Droplets size={22} />
          </div>
          <div>
            <div style={{ fontSize: 11, color: 'var(--text-3)', fontWeight: 600, letterSpacing: '0.6px', textTransform: 'uppercase', marginBottom: 4 }}>Humidity</div>
            <div style={{ fontSize: 28, fontWeight: 800, color: 'var(--text-1)', lineHeight: 1 }}>
              {(current.humidity || 0).toFixed(1)} <span style={{ fontSize: 14, color: 'var(--text-3)', fontWeight: 500 }}>%</span>
            </div>
          </div>
        </GlassCard>

        <GlassCard style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ width: 48, height: 48, borderRadius: 14, background: 'var(--accent-dim)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent-light)', flexShrink: 0 }}>
            <Zap size={22} />
          </div>
          <div>
            <div style={{ fontSize: 11, color: 'var(--text-3)', fontWeight: 600, letterSpacing: '0.6px', textTransform: 'uppercase', marginBottom: 4 }}>Apparent Power</div>
            <div style={{ fontSize: 28, fontWeight: 800, color: 'var(--text-1)', lineHeight: 1 }}>
              {((current.power || 0) / (current.power_factor || 0.94) || 0).toFixed(2)} <span style={{ fontSize: 14, color: 'var(--text-3)', fontWeight: 500 }}>kVA</span>
            </div>
          </div>
        </GlassCard>
      </div>

      {/* Disclaimer */}
      <div style={{ padding: '10px 16px', borderRadius: 10, background: 'rgba(56,189,248,0.06)', border: '1px solid rgba(56,189,248,0.15)', fontSize: 11.5, color: 'var(--text-3)', lineHeight: 1.6 }}>
        <strong style={{ color: 'var(--info)' }}>DEMO DATA</strong> — All values shown are simulated to demonstrate the system's live monitoring capability. Once real ESP32/energy meter sensors from A Block are connected via MQTT or REST API, this page will automatically reflect actual measurements.
      </div>
    </div>
  );
};

export default LiveMonitoring;
