import { useState, useEffect } from 'react';
import { Bell, Menu, Sliders } from 'lucide-react';
import { TelemetryInjectorModal } from './TelemetryInjectorModal';

interface HeaderProps {
  onToggleSidebar?: () => void;
}

const Header = ({ onToggleSidebar }: HeaderProps) => {
  const [now, setNow] = useState(new Date());
  const [showInjector, setShowInjector] = useState(false);

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  return (
    <>
      <header className="app-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button
            className="mobile-menu-btn"
            onClick={onToggleSidebar}
            aria-label="Toggle Navigation Menu"
          >
            <Menu size={20} />
          </button>

          <div className="header-title">
            <h2>DR. N.G.P. INSTITUTE OF TECHNOLOGY — A BLOCK</h2>
            <p>Smart Energy Digital Twin &nbsp;·&nbsp; 3 Floors &amp; 20+ Rooms &nbsp;·&nbsp; AI Load Balancing</p>
          </div>
        </div>

        <div className="header-actions">
          {/* Quick Hardware Voltage Injector Trigger */}
          <button
            onClick={() => setShowInjector(true)}
            style={{
              padding: '6px 12px',
              borderRadius: 10,
              background: 'linear-gradient(135deg, rgba(6,182,212,0.15) 0%, rgba(59,130,246,0.15) 100%)',
              border: '1px solid rgba(6,182,212,0.4)',
              color: '#22d3ee',
              fontSize: 12,
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              cursor: 'pointer',
              boxShadow: '0 0 10px rgba(6,182,212,0.2)',
              transition: 'all 0.2s ease',
            }}
            title="Type manual voltage values without physical hardware"
          >
            <Sliders size={14} />
            <span>⚡ Set Voltage</span>
          </button>

          <div className="header-badge-group">
            <div className="status-pill online">
              <span className="status-dot pulse" />
              ONLINE
            </div>
            <div className="status-pill online">
              <span className="status-dot pulse" />
              TELEMETRY ACTIVE
            </div>
          </div>

          <div className="header-divider" />

          <div className="header-time">
            <div className="time">{now.toLocaleTimeString('en-IN', { hour12: false })}</div>
            <div className="date">{now.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}</div>
          </div>

          <div className="flex items-center gap-2" style={{ gap: 8, display: 'flex', alignItems: 'center' }}>
            <button className="icon-btn" aria-label="Notifications">
              <Bell size={16} />
              <span className="notif-dot" />
            </button>
            <div className="avatar" title="Dr. NGP iTech Energy Admin">NGP</div>
          </div>
        </div>
      </header>

      <TelemetryInjectorModal
        isOpen={showInjector}
        onClose={() => setShowInjector(false)}
      />
    </>
  );
};

export default Header;
