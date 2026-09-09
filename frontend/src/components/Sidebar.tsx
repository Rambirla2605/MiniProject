import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard, Activity, BarChart2, BrainCircuit,
  Cpu, Database, Bell, Zap, Power, X, GitBranch
} from 'lucide-react';

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

const navItems = [
  { name: 'Dashboard',        path: '/',             icon: LayoutDashboard, group: 'OVERVIEW' },
  { name: 'Live Monitoring',  path: '/live',          icon: Activity,        group: 'OVERVIEW' },
  { name: 'Energy Analytics', path: '/analytics',     icon: BarChart2,       group: 'ANALYSIS' },
  { name: 'AI Prediction',    path: '/prediction',    icon: BrainCircuit,    group: 'ANALYSIS' },
  { name: 'Load Management',  path: '/loads',         icon: Power,           group: 'ANALYSIS' },
  { name: 'Digital Twin',     path: '/digital-twin',  icon: GitBranch,       group: 'SYSTEM'   },
  { name: 'Historical Data',  path: '/analytics',     icon: Database,        group: 'SYSTEM'   },
  { name: 'Sensors',          path: '/sensors',       icon: Cpu,             group: 'SYSTEM'   },
  { name: 'Alerts',           path: '/alerts',        icon: Bell,            group: 'SYSTEM'   },
];

const groups = ['OVERVIEW', 'ANALYSIS', 'SYSTEM'];

const Sidebar = ({ isOpen, onClose }: SidebarProps) => (
  <>
    {/* Mobile Backdrop */}
    {isOpen && <div className="sidebar-backdrop" onClick={onClose} />}

    <div className={`sidebar ${isOpen ? 'open' : ''}`}>
      <div className="sidebar-logo">
        <div className="sidebar-logo-icon">
          <Zap size={18} color="white" />
        </div>
        <div className="sidebar-logo-text">
          <strong>DIGITAL TWIN</strong>
          <span>Engineering Prototype</span>
        </div>
        <button
          className="sidebar-close-btn"
          onClick={onClose}
          aria-label="Close navigation"
        >
          <X size={18} />
        </button>
      </div>

      <nav className="sidebar-nav">
        {groups.map(group => {
          const items = navItems.filter(i => i.group === group);
          return (
            <div key={group}>
              <div className="sidebar-section-label">{group}</div>
              {items.map(({ name, path, icon: Icon }) => (
                <NavLink
                  key={`${name}-${path}`}
                  to={path}
                  className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}
                  onClick={() => onClose?.()}
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
        <div style={{ marginTop: 8, padding: '8px 12px', borderRadius: 10, background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.15)' }}>
          <div style={{ fontSize: 10, color: 'var(--text-3)', letterSpacing: '0.6px', textTransform: 'uppercase', fontWeight: 600, marginBottom: 2 }}>Data Source</div>
          <div style={{ fontSize: 11, color: 'var(--success)', fontWeight: 600 }}>Energy Sensors + Raspberry Pi</div>
        </div>
      </div>
    </div>
  </>
);

export default Sidebar;
