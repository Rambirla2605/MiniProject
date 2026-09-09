import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import GlassCard from './components/GlassCard';
import Dashboard from './pages/Dashboard';
import LiveMonitoring from './pages/LiveMonitoring';
import Analytics from './pages/Analytics';
import AIPrediction from './pages/AIPrediction';
import LoadManagement from './pages/LoadManagement';
import { fetchCurrentData } from './services/api';
import {
  Cpu, Zap, Activity, Bell,
  ArrowDown, GitBranch, Wifi, Database
} from 'lucide-react';

/* ─── Shared page shell ─────────────────────────────────────────────── */
const PageShell = ({ title, sub, children }: { title: string; sub?: string; children?: React.ReactNode }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
    <div>
      <h1 style={{ fontSize: 20, fontWeight: 800, color: 'var(--text-1)', letterSpacing: '-0.3px' }}>{title}</h1>
      {sub && <p style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 3 }}>{sub}</p>}
    </div>
    {children}
  </div>
);

/* ─── Digital Twin page ─────────────────────────────────────────────── */
const DigitalTwinPage = () => {
  const [current, setCurrent] = useState<any>({});

  useEffect(() => {
    const load = async () => { try { setCurrent(await fetchCurrentData()); } catch {} };
    load();
    const iv = setInterval(load, 5000);
    return () => clearInterval(iv);
  }, []);

  const archSteps = [
    { icon: <Zap size={18} />,      label: 'Physical Energy System',              desc: 'The actual electrical system being monitored',                     color: '#f59e0b' },
    { icon: <Activity size={18} />, label: 'Energy Sensors',                       desc: 'Voltage, current, and power measurement devices',                  color: '#22d3ee' },
    { icon: <Cpu size={18} />,      label: 'Raspberry Pi — Edge Device',           desc: 'Data acquisition, processing, and transmission to the cloud',      color: '#10b981' },
    { icon: <Database size={18} />, label: 'Data Storage',                          desc: 'Collected sensor readings stored for historical analysis',          color: '#6366f1' },
    { icon: <GitBranch size={18} />,label: 'Digital Twin',                          desc: 'Virtual representation of the physical system — updated in real time',color: '#a78bfa' },
    { icon: <Zap size={18} />,      label: 'AI Analysis & Pattern Recognition',    desc: 'AI model learns energy patterns from historical data',              color: '#f43f5e' },
    { icon: <Bell size={18} />,     label: 'Energy Prediction & Optimization',     desc: 'Forecasts future consumption and suggests optimization actions',    color: '#fbbf24' },
  ];

  const stateParams = [
    { label: 'Active Power',   value: `${(current.power || 0).toFixed(2)} kW`,   color: 'var(--accent-light)' },
    { label: 'Voltage',        value: `${(current.voltage || 0).toFixed(1)} V`,   color: 'var(--cyan)' },
    { label: 'Current',        value: `${(current.current || 0).toFixed(1)} A`,   color: 'var(--violet)' },
    { label: 'Temperature',    value: `${(current.temperature || 0).toFixed(1)} °C`, color: 'var(--warning)' },
    { label: 'Power Factor',   value: (current.power_factor || 0).toFixed(3),     color: 'var(--success)' },
    { label: 'Frequency',      value: `${(current.frequency || 0).toFixed(2)} Hz`, color: 'var(--info)' },
  ];

  return (
    <PageShell
      title="Digital Twin — Virtual Energy System"
      sub="AI-Driven Digital Twin for Intelligent Energy Management"
    >
      {/* Project description */}
      <GlassCard style={{ background: 'linear-gradient(135deg, rgba(99,102,241,0.08) 0%, rgba(6,11,24,0.6) 100%)', borderColor: 'rgba(99,102,241,0.25)' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16 }}>
          <div style={{ width: 44, height: 44, borderRadius: 12, background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent-light)', flexShrink: 0 }}>
            <GitBranch size={22} />
          </div>
          <div>
            <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-1)', marginBottom: 8 }}>About This Project</div>
            <p style={{ fontSize: 13, color: 'var(--text-2)', lineHeight: 1.75, margin: 0 }}>
              This project develops an <strong style={{ color: 'var(--accent-light)' }}>AI-driven Digital Twin for intelligent energy management</strong>.
              Energy data collected through sensors and a Raspberry Pi is used to represent the physical system digitally.
              Historical data is analyzed using AI to predict future energy consumption and support energy optimization decisions.
            </p>
          </div>
        </div>
      </GlassCard>

      {/* Architecture Flow */}
      <GlassCard>
        <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-1)', marginBottom: 6 }}>System Architecture</div>
        <div style={{ fontSize: 12, color: 'var(--text-3)', marginBottom: 24 }}>How physical energy data flows through the Digital Twin</div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 0, maxWidth: 560, margin: '0 auto' }}>
          {archSteps.map((step, i) => (
            <React.Fragment key={step.label}>
              {/* Step box */}
              <div style={{
                display: 'flex', alignItems: 'flex-start', gap: 16, padding: '16px 18px',
                borderRadius: 14, background: 'rgba(0,0,0,0.25)',
                border: `1px solid rgba(255,255,255,0.07)`,
                borderLeft: `3px solid ${step.color}`,
                position: 'relative',
              }}>
                <div style={{
                  width: 36, height: 36, borderRadius: 10, flexShrink: 0,
                  background: `${step.color}18`, border: `1px solid ${step.color}40`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: step.color,
                }}>
                  {step.icon}
                </div>
                <div>
                  <div style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--text-1)', marginBottom: 3 }}>{step.label}</div>
                  <div style={{ fontSize: 11.5, color: 'var(--text-3)', lineHeight: 1.5 }}>{step.desc}</div>
                </div>
                {/* Step number badge */}
                <div style={{
                  position: 'absolute', top: 12, right: 14,
                  width: 20, height: 20, borderRadius: '50%',
                  background: `${step.color}20`, border: `1px solid ${step.color}40`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 10, fontWeight: 800, color: step.color,
                }}>{i + 1}</div>
              </div>

              {/* Arrow between steps */}
              {i < archSteps.length - 1 && (
                <div style={{ display: 'flex', justifyContent: 'center', padding: '6px 0', color: 'var(--text-3)' }}>
                  <ArrowDown size={18} />
                </div>
              )}
            </React.Fragment>
          ))}
        </div>
      </GlassCard>

      {/* Current Digital Twin State */}
      <GlassCard>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 10 }}>
          <div>
            <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-1)' }}>Current Digital Twin State</div>
            <div style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 2 }}>
              Virtual representation of the monitored system — updated every 5 seconds
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'var(--success-dim)', border: '1px solid rgba(16,185,129,0.25)', borderRadius: 20, padding: '5px 12px' }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--success)', display: 'block', animation: 'pulse-dot 2s ease infinite' }} />
            <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--success)' }}>TWIN SYNCHRONIZED</span>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 12 }}>
          {stateParams.map(({ label, value, color }) => (
            <div key={label} style={{
              padding: '14px 16px', borderRadius: 12,
              background: 'rgba(0,0,0,0.25)', border: '1px solid var(--glass-border)',
            }}>
              <div style={{ fontSize: 10.5, color: 'var(--text-3)', fontWeight: 600, letterSpacing: '0.6px', textTransform: 'uppercase', marginBottom: 8 }}>{label}</div>
              <div style={{ fontSize: 22, fontWeight: 800, color, lineHeight: 1 }}>{value}</div>
            </div>
          ))}
        </div>

        <div style={{ marginTop: 14, padding: '10px 14px', borderRadius: 10, background: 'rgba(56,189,248,0.05)', border: '1px solid rgba(56,189,248,0.15)', fontSize: 11.5, color: 'var(--text-3)' }}>
          <strong style={{ color: 'var(--info)' }}>Demo Data</strong> — Values are simulated. Once energy sensors are connected via Raspberry Pi, the Digital Twin will reflect actual physical measurements in real time.
        </div>
      </GlassCard>

      {/* How the Digital Twin is used */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
        {[
          { icon: <Activity size={18} />, title: 'Real-Time Monitoring',    desc: 'Live sensor data from the physical system updates the virtual twin continuously.',      color: '#22d3ee' },
          { icon: <Database size={18} />, title: 'Historical Analysis',     desc: '6+ months of data used to identify consumption patterns and seasonal variations.',     color: '#6366f1' },
          { icon: <Zap size={18} />,      title: 'AI Prediction',           desc: 'AI model forecasts future energy consumption based on learned historical patterns.',   color: '#f59e0b' },
          { icon: <Bell size={18} />,     title: 'Optimization Support',    desc: 'System alerts and recommendations help reduce energy waste and prevent overloads.',    color: '#10b981' },
        ].map(({ icon, title, desc, color }) => (
          <GlassCard key={title} style={{ borderTop: `2px solid ${color}30` }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: `${color}15`, border: `1px solid ${color}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', color, marginBottom: 12 }}>
              {icon}
            </div>
            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-1)', marginBottom: 6 }}>{title}</div>
            <p style={{ fontSize: 11.5, color: 'var(--text-3)', lineHeight: 1.6, margin: 0 }}>{desc}</p>
          </GlassCard>
        ))}
      </div>
    </PageShell>
  );
};

/* ─── Sensors page ──────────────────────────────────────────────────── */
const SensorsPage = () => {
  // Only sensors that are actually part of the intended system
  const sensors = [
    { id: 'POWER-001', loc: 'Main Panel',   type: 'Active Power',   val: '42.8',  unit: 'kW', status: 'ONLINE',  age: '2s ago',   via: 'Raspberry Pi' },
    { id: 'VOLT-001',  loc: 'Main Panel',   type: 'Voltage (RMS)',  val: '231.4', unit: 'V',  status: 'ONLINE',  age: '2s ago',   via: 'Raspberry Pi' },
    { id: 'CURR-001',  loc: 'Main Panel',   type: 'Current (RMS)',  val: '18.7',  unit: 'A',  status: 'ONLINE',  age: '2s ago',   via: 'Raspberry Pi' },
    { id: 'TEMP-001',  loc: 'Panel Room',   type: 'Temperature',    val: '24.5',  unit: '°C', status: 'ONLINE',  age: '5s ago',   via: 'Raspberry Pi' },
    { id: 'HUM-001',   loc: 'Panel Room',   type: 'Humidity',       val: '45.2',  unit: '%',  status: 'ONLINE',  age: '5s ago',   via: 'Raspberry Pi' },
    { id: 'PF-001',    loc: 'Main Panel',   type: 'Power Factor',   val: '0.924', unit: '',   status: 'ONLINE',  age: '2s ago',   via: 'Raspberry Pi' },
    { id: 'FREQ-001',  loc: 'Main Panel',   type: 'Frequency',      val: '50.01', unit: 'Hz', status: 'ONLINE',  age: '2s ago',   via: 'Raspberry Pi' },
    { id: 'ENERGY-001',loc: 'Main Panel',   type: 'Energy (kWh)',   val: '318.6', unit: 'kWh',status: 'ONLINE',  age: '1 min ago',via: 'Raspberry Pi' },
  ];
  const badgeCls: Record<string, string> = { ONLINE: 'badge-success', DELAYED: 'badge-warning', OFFLINE: 'badge-danger' };

  return (
    <PageShell title="Sensor Network" sub="Energy sensors connected via Raspberry Pi — Demo Data">

      {/* Raspberry Pi prominence card */}
      <GlassCard style={{ background: 'linear-gradient(135deg, rgba(16,185,129,0.08) 0%, rgba(6,11,24,0.6) 100%)', borderColor: 'rgba(16,185,129,0.25)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
          <div style={{ width: 52, height: 52, borderRadius: 14, background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--success)', flexShrink: 0 }}>
            <Cpu size={26} />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--text-1)', marginBottom: 4 }}>
              Raspberry Pi — Main Data Acquisition & Edge Device
            </div>
            <p style={{ fontSize: 12.5, color: 'var(--text-2)', margin: 0, lineHeight: 1.6 }}>
              The Raspberry Pi serves as the central data acquisition unit. It reads values from energy sensors,
              processes the data, and transmits it to the Digital Twin backend via REST API.
              All sensor readings in this system are routed through the Raspberry Pi.
            </p>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4, flexShrink: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '5px 12px', borderRadius: 20, background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.25)' }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--success)', animation: 'pulse-dot 2s ease infinite' }} />
              <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--success)' }}>EDGE DEVICE ONLINE</span>
            </div>
            <div style={{ fontSize: 10.5, color: 'var(--text-3)', textAlign: 'center' }}>Demo Simulation</div>
          </div>
        </div>

        {/* Data flow */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 16, flexWrap: 'wrap' }}>
          {[
            { icon: <Activity size={13} />, label: 'Energy Sensors' },
            { icon: <Wifi size={13} />,     label: '→' },
            { icon: <Cpu size={13} />,      label: 'Raspberry Pi' },
            { icon: <Wifi size={13} />,     label: '→' },
            { icon: <Database size={13} />, label: 'Digital Twin Backend' },
            { icon: <Wifi size={13} />,     label: '→' },
            { icon: <Zap size={13} />,      label: 'AI Prediction' },
          ].map((item, i) => (
            <div key={i} style={{
              display: 'flex', alignItems: 'center', gap: 4, padding: item.label === '→' ? '0' : '4px 10px',
              borderRadius: 20, background: item.label === '→' ? 'transparent' : 'rgba(255,255,255,0.04)',
              border: item.label === '→' ? 'none' : '1px solid var(--border-subtle)',
              fontSize: 11, color: item.label === '→' ? 'var(--text-3)' : 'var(--text-2)', fontWeight: 600,
            }}>
              <span style={{ color: 'var(--success)' }}>{item.icon}</span>
              {item.label !== '→' && item.label}
            </div>
          ))}
        </div>
      </GlassCard>

      {/* Sensor table */}
      <GlassCard style={{ padding: 0, overflow: 'hidden' }}>
        <div className="table-container">
          <table>
            <thead>
              <tr>
                {['Sensor ID', 'Location', 'Measurement', 'Value', 'Via', 'Status', 'Last Updated'].map(h => (
                  <th key={h}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sensors.map(s => (
                <tr key={s.id}>
                  <td style={{ fontFamily: 'monospace', color: 'var(--accent-light)', fontSize: 12 }}>{s.id}</td>
                  <td>{s.loc}</td>
                  <td style={{ color: 'var(--text-2)' }}>{s.type}</td>
                  <td><span style={{ fontWeight: 700, color: 'var(--text-1)' }}>{s.val}</span> <span style={{ fontSize: 11, color: 'var(--text-3)' }}>{s.unit}</span></td>
                  <td><span style={{ fontSize: 11, color: 'var(--success)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}><Cpu size={10} />{s.via}</span></td>
                  <td><span className={`badge ${badgeCls[s.status]}`}>{s.status}</span></td>
                  <td style={{ fontSize: 12, color: 'var(--text-3)' }}>{s.age}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </GlassCard>

      <div style={{ padding: '10px 16px', borderRadius: 10, background: 'rgba(56,189,248,0.06)', border: '1px solid rgba(56,189,248,0.15)', fontSize: 11.5, color: 'var(--text-3)' }}>
        <strong style={{ color: 'var(--info)' }}>DEMO DATA</strong> — Sensor values are simulated. Real measurements will be transmitted from energy sensors via the Raspberry Pi once physically connected.
      </div>
    </PageShell>
  );
};

/* ─── Alerts page ───────────────────────────────────────────────────── */
const AlertsPage = () => {
  const alerts = [
    { sev: 'HIGH',    label: 'badge-danger',   title: 'High Energy Consumption Alert',         body: 'Current consumption is significantly above the average for this time of day. AI suggests checking for unexpected loads or scheduling conflicts.', time: '2 min ago',  loc: 'Main Panel' },
    { sev: 'MEDIUM',  label: 'badge-warning',  title: 'Overload Warning — Predicted Peak',      body: 'AI predicts load may approach the safe threshold within the next 60 minutes. Review non-critical load categories and consider deferring high-power activities.', time: '8 min ago',  loc: 'AI Prediction' },
    { sev: 'LOW',     label: 'badge-info',     title: 'Abnormal Consumption Pattern Detected',  body: 'Consumption pattern deviates from the historical baseline for this day and time. Further monitoring recommended.', time: '22 min ago', loc: 'Digital Twin' },
    { sev: 'WARNING', label: 'badge-warning',  title: 'Sensor Data Delayed',                    body: 'One or more sensor readings have not been updated in the expected interval. Data freshness may be affected.', time: '15 min ago', loc: 'Sensor Network' },
  ];
  const borderCol: Record<string, string> = {
    'badge-danger': 'var(--danger)', 'badge-warning': 'var(--warning)',
    'badge-info': 'var(--info)', 'badge-accent': 'var(--accent-light)',
  };

  return (
    <PageShell title="System Alerts" sub="Warnings, anomalies, and AI notifications — Demo System Alerts">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {alerts.map((a, i) => (
          <div key={i} style={{
            display: 'flex', gap: 16, padding: '16px 20px',
            borderRadius: 14, background: 'var(--glass-bg)',
            border: '1px solid var(--glass-border)',
            borderLeft: `3px solid ${borderCol[a.label]}`,
            backdropFilter: 'blur(20px)',
          }}>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6, flexWrap: 'wrap' }}>
                <span className={`badge ${a.label}`}>{a.sev}</span>
                <span className="badge badge-warning" style={{ fontSize: 10 }}>Demo System Alert</span>
                <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-1)' }}>{a.title}</span>
              </div>
              <p style={{ fontSize: 12.5, color: 'var(--text-2)', lineHeight: 1.6, margin: 0 }}>{a.body}</p>
            </div>
            <div style={{ textAlign: 'right', flexShrink: 0 }}>
              <div style={{ fontSize: 11, color: 'var(--text-3)', marginBottom: 4 }}>{a.time}</div>
              <div style={{ fontSize: 11, color: 'var(--text-3)' }}>{a.loc}</div>
            </div>
          </div>
        ))}
      </div>

      <div style={{ padding: '10px 16px', borderRadius: 10, background: 'rgba(56,189,248,0.06)', border: '1px solid rgba(56,189,248,0.15)', fontSize: 11.5, color: 'var(--text-3)' }}>
        <strong style={{ color: 'var(--info)' }}>DEMO ALERTS</strong> — Alerts are generated from simulated data to demonstrate the system's notification capability. Real alerts will be triggered by actual sensor readings via Raspberry Pi.
      </div>
    </PageShell>
  );
};

/* ─── App ───────────────────────────────────────────────────────────── */
function App() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <Router>
      <div className="app-container">
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <main className="main-content">
          <Header onToggleSidebar={() => setSidebarOpen(prev => !prev)} />
          <Routes>
            <Route path="/"            element={<Dashboard />} />
            <Route path="/live"        element={<LiveMonitoring />} />
            <Route path="/analytics"   element={<Analytics />} />
            <Route path="/prediction"  element={<AIPrediction />} />
            <Route path="/loads"       element={<LoadManagement />} />
            <Route path="/digital-twin"element={<DigitalTwinPage />} />
            <Route path="/sensors"     element={<SensorsPage />} />
            <Route path="/alerts"      element={<AlertsPage />} />
            {/* /history is an alias for analytics — historical data is shown there */}
            <Route path="/history"     element={<Analytics />} />
            {/* Removed: /overload (merged into AI Prediction), /settings (not needed) */}
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
