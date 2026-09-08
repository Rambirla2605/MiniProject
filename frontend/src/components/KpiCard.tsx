import React from 'react';
import GlassCard from './GlassCard';

type Status = 'success' | 'warning' | 'danger' | 'info' | 'accent';

interface KpiCardProps {
  title: string;
  value: string | number;
  unit?: string;
  trend?: string;
  trendDirection?: 'up' | 'down' | 'good-up' | 'neutral';
  status?: Status;
  subtitle?: string;
  glowClass?: string;
}

const KpiCard: React.FC<KpiCardProps> = ({
  title, value, unit, trend, trendDirection = 'neutral',
  status, subtitle, glowClass = ''
}) => {
  // Color the big number when a status is given
  const valueColor: Record<Status, string> = {
    success: 'var(--success)',
    warning: 'var(--warning)',
    danger:  'var(--danger)',
    info:    'var(--info)',
    accent:  'var(--accent-light)',
  };

  return (
    <GlassCard className={`kpi-card ${glowClass}`}>
      <div className="kpi-label">{title}</div>

      <div className="kpi-value-row">
        <span
          className="kpi-value"
          style={{ color: status ? valueColor[status] : 'var(--text-1)' }}
        >
          {value}
        </span>
        {unit && <span className="kpi-unit">{unit}</span>}
      </div>

      <div className="kpi-footer">
        {trend && (
          <span className={`kpi-trend ${trendDirection}`}>
            {trendDirection === 'up' ? '↑' : trendDirection === 'down' || trendDirection === 'good-up' ? '↓' : ''}
            {trendDirection === 'good-up' ? '↑' : ''}
            &nbsp;{trend}
          </span>
        )}
        {status && (
          <span className={`badge badge-${status}`} style={{ marginLeft: 'auto' }}>
            {status.toUpperCase()}
          </span>
        )}
        {subtitle && !status && (
          <span className="kpi-sub" style={{ marginLeft: 'auto' }}>{subtitle}</span>
        )}
        {subtitle && status && (
          <span className="kpi-sub">{subtitle}</span>
        )}
      </div>
    </GlassCard>
  );
};

export default KpiCard;
