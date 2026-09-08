import { useState, useEffect } from 'react';
import { Bell } from 'lucide-react';

const Header = () => {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  return (
    <header className="app-header">
      <div className="header-title">
        <h2>A BLOCK — SMART ENERGY MONITORING</h2>
        <p>College of Engineering &nbsp;·&nbsp; Prototype Dataset &nbsp;·&nbsp; IoT + AI Platform</p>
      </div>

      <div className="header-actions">
        <div className="header-badge-group">
          <div className="status-pill online">
            <span className="status-dot pulse" />
            ONLINE
          </div>
          <div className="status-pill demo">
            <span className="status-dot" />
            DEMO DATA
          </div>
        </div>

        <div className="header-divider" />

        <div className="header-time">
          <div className="time">{now.toLocaleTimeString('en-IN', { hour12: false })}</div>
          <div className="date">{now.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}</div>
        </div>

        <div className="flex items-center gap-2" style={{ gap: 8, display: 'flex', alignItems: 'center' }}>
          <button className="icon-btn">
            <Bell size={16} />
            <span className="notif-dot" />
          </button>
          <div className="avatar" title="Project Profile">SA</div>
        </div>
      </div>
    </header>
  );
};

export default Header;
