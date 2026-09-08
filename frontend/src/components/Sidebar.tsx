import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard, Activity, BarChart2, BrainCircuit,
  AlertTriangle, Cpu, Database, Bell, Settings, Zap
} from 'lucide-react';

const navItems = [
  { name: 'Dashboard',        path: '/',          icon: LayoutDashboard, group: 'OVERVIEW' },
  { name: 'Live Monitoring',  path: '/live',       icon: Activity,        group: 'OVERVIEW' },
  { name: 'Energy Analytics', path: '/analytics',  icon: BarChart2,       group: 'ANALYSIS' },
  { name: 'AI Prediction',    path: '/prediction', icon: BrainCircuit,    group: 'ANALYSIS' },
  { name: 'Overload Detection',path: '/overload',  icon: AlertTriangle,   group: 'ANALYSIS' },
  { name: 'Sensors',          path: '/sensors',    icon: Cpu,             group: 'INFRASTRUCTURE' },
  { name: 'Historical Data',  path: '/history',    icon: Database,        group: 'INFRASTRUCTURE' },
  { name: 'Alerts',           path: '/alerts',     icon: Bell,            group: 'INFRASTRUCTURE' },
  { name: 'Settings',         path: '/settings',   icon: Settings,        group: 'INFRASTRUCTURE' },
];

const groups = ['OVERVIEW', 'ANALYSIS', 'INFRASTRUCTURE'];

const Sidebar = () => (
  <div className="sidebar">
    <div className="sidebar-logo">
      <div className="sidebar-logo-icon">
        <Zap size={18} color="white" />
      </div>
      <div className="sidebar-logo-text">
        <strong>SMART ENERGY AI</strong>
        <span>A Block Monitoring</span>
      </div>
    </div>

    <nav className="sidebar-nav">
      {groups.map(group => {
        const items = navItems.filter(i => i.group === group);
        return (
          <div key={group}>
            <div className="sidebar-section-label">{group}</div>
            {items.map(({ name, path, icon: Icon }) => (
              <NavLink
                key={path}
                to={path}
                className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}
              >
                <span className="nav-icon" style={{ display: 'flex' }}>
                  <Icon size={16} />
                </span>
                {name}
              </NavLink>
            ))}
          </div>
        );
      })}
    </nav>

    <div className="sidebar-footer">
      <div style={{ padding: '10px 12px', borderRadius: 10, background: 'var(--accent-dim)', border: '1px solid rgba(99,102,241,0.2)' }}>
        <div style={{ fontSize: 10, color: 'var(--text-3)', letterSpacing: '0.6px', textTransform: 'uppercase', fontWeight: 600, marginBottom: 4 }}>Data Mode</div>
        <div style={{ fontSize: 12, color: 'var(--accent-light)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--accent-light)', display: 'inline-block' }}></span>
          DEMO / SIMULATION
        </div>
      </div>
    </div>
  </div>
);

export default Sidebar;
