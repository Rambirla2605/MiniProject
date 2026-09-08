import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import Dashboard from './pages/Dashboard';
import LiveMonitoring from './pages/LiveMonitoring';
import Analytics from './pages/Analytics';
import AIPrediction from './pages/AIPrediction';
import LoadManagement from './pages/LoadManagement';
import GlassCard from './components/GlassCard';

/* ─── Tiny page shell ──────────────────────────────────────── */
const PageShell = ({ title, sub, children }: { title: string; sub?: string; children?: React.ReactNode }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
    <div>
      <h1 style={{ fontSize: 20, fontWeight: 800, color: 'var(--text-1)', letterSpacing: '-0.3px' }}>{title}</h1>
      {sub && <p style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 3 }}>{sub}</p>}
    </div>
    {children}
  </div>
);

/* ─── Sensors page ─────────────────────────────────────────── */
const SensorsPage = () => {
  const sensors = [
    { id: 'POWER-A001', loc: 'Main Panel',    type: 'Power',        val: '42.8',  unit: 'kW', status: 'ONLINE',   age: '2s ago'   },
    { id: 'VOLT-A002',  loc: 'Main Panel',    type: 'Voltage',      val: '231.4', unit: 'V',  status: 'ONLINE',   age: '2s ago'   },
    { id: 'CURR-A003',  loc: 'Main Panel',    type: 'Current',      val: '18.7',  unit: 'A',  status: 'ONLINE',   age: '2s ago'   },
    { id: 'ENV-B001',   loc: 'Floor 1 Hall',  type: 'Temperature',  val: '24.5',  unit: '°C', status: 'ONLINE',   age: '5s ago'   },
    { id: 'ENV-B002',   loc: 'Floor 1 Hall',  type: 'Humidity',     val: '45.2',  unit: '%',  status: 'ONLINE',   age: '5s ago'   },
    { id: 'ENV-B003',   loc: 'Floor 2 Lab',   type: 'Temperature',  val: '26.1',  unit: '°C', status: 'ONLINE',   age: '5s ago'   },
    { id: 'LIGHT-C001', loc: 'Corridor 1A',   type: 'Light Level',  val: '420',   unit: 'lux',status: 'DELAYED',  age: '1 min ago'},
    { id: 'OCC-D001',   loc: 'Classroom 101', type: 'Occupancy',    val: '1',     unit: '',   status: 'ONLINE',   age: '10s ago'  },
    { id: 'CO2-E001',   loc: 'Lab 204',       type: 'CO₂',          val: '612',   unit: 'ppm',status: 'ONLINE',   age: '10s ago'  },
    { id: 'PWR-F001',   loc: 'Sub-panel B',   type: 'Power',        val: '—',     unit: '',   status: 'OFFLINE',  age: '5 min ago'},
  ];
  const badgeCls: Record<string, string> = { ONLINE: 'badge-success', DELAYED: 'badge-warning', OFFLINE: 'badge-danger' };
  return (
    <PageShell title="IoT Sensors Network" sub="Simulated sensor array · A Block electrical & environmental monitoring">
      <GlassCard style={{ padding: 0, overflow: 'hidden' }}>
        <div className="table-container">
          <table>
            <thead>
              <tr>
                {['Sensor ID','Location','Type','Value','Status','Last Updated'].map(h => (
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
                  <td><span className={`badge ${badgeCls[s.status]}`}>{s.status}</span></td>
                  <td style={{ fontSize: 12, color: 'var(--text-3)' }}>{s.age}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </GlassCard>
      <div style={{ padding: '10px 16px', borderRadius: 10, background: 'rgba(56,189,248,0.06)', border: '1px solid rgba(56,189,248,0.15)', fontSize: 11.5, color: 'var(--text-3)' }}>
        <strong style={{ color: 'var(--info)' }}>DEMO</strong> — Sensor IDs and values are simulated. Real ESP32/Raspberry Pi sensors will populate this table once connected via MQTT or REST.
      </div>
    </PageShell>
  );
};

/* ─── Alerts page ──────────────────────────────────────────── */
const AlertsPage = () => {
  const alerts = [
    { sev: 'HIGH',     label: 'badge-danger',   title: 'Overload Risk Detected',                 body: 'AI predicts load will reach 97% of the safe limit within the next 45 minutes. Consider load shedding.', time: '2 min ago',  loc: 'Main Panel' },
    { sev: 'MEDIUM',   label: 'badge-warning',  title: 'Power Consumption Above Baseline',        body: 'Current consumption is 29% higher than the historical average for this time of day.', time: '8 min ago',  loc: 'A Block' },
    { sev: 'LOW',      label: 'badge-info',     title: 'HVAC Load High',                          body: 'HVAC systems are contributing 47% of total load. Efficiency score has dropped by 4%.', time: '15 min ago', loc: 'Floor 2' },
    { sev: 'WARNING',  label: 'badge-warning',  title: 'Sensor LIGHT-C001 Delayed',               body: 'Sensor has not reported for over 60 seconds. Data may be stale.', time: '1 min ago',  loc: 'Corridor 1A' },
    { sev: 'INFO',     label: 'badge-accent',   title: 'Model Retrain Recommended',               body: 'It has been 30 days since the last Random Forest model retrain. Accuracy may have drifted.', time: '2 hrs ago', loc: 'AI Engine' },
  ];
  const borderCol: Record<string, string> = {
    'badge-danger': 'var(--danger)', 'badge-warning': 'var(--warning)',
    'badge-info': 'var(--info)', 'badge-accent': 'var(--accent-light)',
  };
  return (
    <PageShell title="System Alerts" sub="Active warnings, anomalies, and AI notifications">
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
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                <span className={`badge ${a.label}`}>{a.sev}</span>
                <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-1)' }}>{a.title}</span>
              </div>
              <p style={{ fontSize: 12.5, color: 'var(--text-2)', lineHeight: 1.6 }}>{a.body}</p>
            </div>
            <div style={{ textAlign: 'right', flexShrink: 0 }}>
              <div style={{ fontSize: 11, color: 'var(--text-3)', marginBottom: 4 }}>{a.time}</div>
              <div style={{ fontSize: 11, color: 'var(--text-3)' }}>{a.loc}</div>
            </div>
          </div>
        ))}
      </div>
    </PageShell>
  );
};

/* ─── Settings page ────────────────────────────────────────── */
const SettingsPage = () => {
  const groups = [
    {
      title: 'Building Configuration',
      fields: [
        { label: 'Building Name', value: 'A Block', type: 'text' },
        { label: 'Maximum Safe Power Limit (kW)', value: '75', type: 'number' },
        { label: 'Prediction Horizon (minutes)', value: '60', type: 'number' },
      ]
    },
    {
      title: 'Risk Thresholds',
      fields: [
        { label: 'Warning Threshold (%)', value: '70', type: 'number' },
        { label: 'High-Risk Threshold (%)', value: '85', type: 'number' },
        { label: 'Critical Threshold (%)', value: '100', type: 'number' },
      ]
    },
    {
      title: 'System Settings',
      fields: [
        { label: 'Sensor Refresh Rate (seconds)', value: '2', type: 'number' },
        { label: 'Data Mode', value: 'DEMO', type: 'text' },
        { label: 'ML Model', value: 'Random Forest Regressor (scikit-learn)', type: 'text' },
      ]
    },
  ];
  return (
    <PageShell title="System Settings" sub="Configure building parameters, risk thresholds, and system preferences">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        {groups.map(g => (
          <GlassCard key={g.title}>
            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--accent-light)', marginBottom: 18, letterSpacing: '0.3px' }}>{g.title}</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
              {g.fields.map(f => (
                <div key={f.label}>
                  <label>{f.label}</label>
                  <input type={f.type} defaultValue={f.value} readOnly style={{ opacity: 0.7 }} />
                </div>
              ))}
            </div>
          </GlassCard>
        ))}
        <div style={{ padding: '12px 16px', borderRadius: 10, background: 'var(--warning-dim)', border: '1px solid rgba(245,158,11,0.2)', fontSize: 12, color: 'var(--text-2)' }}>
          <strong style={{ color: 'var(--warning)' }}>Note:</strong> Settings are read-only in the prototype. Once the FastAPI backend is fully wired to a database, these values will be persisted and applied in real-time.
        </div>
      </div>
    </PageShell>
  );
};

/* ─── App ──────────────────────────────────────────────────── */
function App() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <Router>
      <div className="app-container">
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <main className="main-content">
          <Header onToggleSidebar={() => setSidebarOpen(prev => !prev)} />
          <Routes>
            <Route path="/"          element={<Dashboard />} />
            <Route path="/live"      element={<LiveMonitoring />} />
            <Route path="/analytics" element={<Analytics />} />
            <Route path="/prediction"element={<AIPrediction />} />
            <Route path="/loads"     element={<LoadManagement />} />
            <Route path="/overload"  element={<Navigate to="/loads" replace />} />
            <Route path="/sensors"   element={<SensorsPage />} />
            <Route path="/history"   element={<Navigate to="/analytics" replace />} />
            <Route path="/alerts"    element={<AlertsPage />} />
            <Route path="/settings"  element={<SettingsPage />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
