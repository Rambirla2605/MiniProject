import { useState, useEffect } from 'react';
import { Bell, Menu } from 'lucide-react';

interface HeaderProps {
  onToggleSidebar?: () => void;
}

const Header = ({ onToggleSidebar }: HeaderProps) => {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  return (
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
        <div className="header-badge-group">
          <div className="status-pill online">
            <span className="status-dot pulse" />
            ONLINE
          </div>
          <div className="status-pill demo">
            <span className="status-dot" />
            LIVE TWIN
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
  );
};

export default Header;
