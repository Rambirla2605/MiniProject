// src/components/GlassCard.tsx
import React from 'react';

interface GlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
  elevation?: 'default' | 'accent' | 'danger' | 'success';
  className?: string;
}

const elevationClassMap: Record<string, string> = {
  default: '',
  accent: 'card-glow-accent',
  danger: 'card-glow-danger',
  success: 'card-glow-success',
};

export const GlassCard: React.FC<GlassCardProps> = ({
  children,
  className = '',
  elevation = 'default',
  ...rest
}) => {
  const elevationClass = elevationClassMap[elevation] || '';
  const classes = `glass-card ${elevationClass} ${className}`.trim();
  return (
    <div className={classes} {...rest}>
      {children}
    </div>
  );
};

export default GlassCard;
