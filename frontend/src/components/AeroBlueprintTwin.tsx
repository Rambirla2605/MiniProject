import React, { useState } from 'react';
import {
  Layers, Zap, Shield, Radio, Activity, Eye,
  Building2, Cpu, CheckCircle2, ChevronRight, SlidersHorizontal
} from 'lucide-react';

interface AeroBlueprintTwinProps {
  loads: any[];
  onSelectLoad: (load: any) => void;
  selectedLoadId?: string | null;
  sensorRigStatus?: any;
}

export const AeroBlueprintTwin: React.FC<AeroBlueprintTwinProps> = ({
  loads = [],
  onSelectLoad,
  selectedLoadId,
  sensorRigStatus,
}) => {
  const [activeFloor, setActiveFloor] = useState<number | 'all'>('all');
  const [filterType, setFilterType] = useState<string>('ALL');

  const floorMeta: Record<number, { title: string; subtitle: string; tag: string; color: string }> = {
    3: {
      title: 'Floor 3 · ECE Department',
      subtitle: 'Classrooms II/III/IV ECE, Communication & Programming Labs 3 & 4, DSP, VLSI, HoD Cabins',
      tag: 'ECE WING · LIVE SENSOR RIG',
      color: '#22d3ee'
    },
    2: {
      title: 'Floor 2 · EEE Department',
      subtitle: 'Classrooms II/III/IV EEE, IC Lab, Electronic Devices Lab, Faculty Staff Rooms, RO Plant',
      tag: 'EEE WING · HEAVY LABS',
      color: '#818cf8'
    },
    1: {
      title: 'Floor 1 · Mechanical Engg & Examination Cell',
      subtitle: 'ME Classrooms 1 & 2, Controller of Examinations (Exam Cell)',
      tag: 'ME & COE CORE',
      color: '#f59e0b'
    },
    0: {
      title: 'Ground Floor · Administrative & Science Core',
      subtitle: 'Admin Office, Secretary Office, Principal Office, Physics & Chem Labs, East & West Seminar Halls, Computer Lab',
      tag: 'ADMIN & CENTRAL LABS',
      color: '#ec4899'
    }
  };

  const getLoadPowerColor = (load: any) => {
    if (load.status === 'OFF') return 'rgba(255,255,255,0.06)';
    const kw = load.power_kw || 0;
    if (kw > 10) return 'rgba(244,63,94,0.22)';
    if (kw > 6) return 'rgba(245,158,11,0.22)';
    if (kw > 3) return 'rgba(34,211,238,0.22)';
    return 'rgba(16,185,129,0.20)';
  };

  const getLoadBorderColor = (load: any) => {
    if (load.status === 'OFF') return 'rgba(255,255,255,0.08)';
    const kw = load.power_kw || 0;
    if (kw > 10) return 'rgba(244,63,94,0.55)';
    if (kw > 6) return 'rgba(245,158,11,0.55)';
    if (kw > 3) return 'rgba(34,211,238,0.55)';
    return 'rgba(16,185,129,0.50)';
  };

  const floorsToRender = activeFloor === 'all' ? [3, 2, 1, 0] : [activeFloor];

  const filteredLoads = (floorNum: number) => {
    return loads
      .filter(l => l.floor === floorNum)
      .filter(l => {
        if (filterType === 'ALL') return true;
        if (filterType === 'CRITICAL') return l.critical;
        if (filterType === 'NON_CRITICAL') return !l.critical;
        if (filterType === 'CLASSROOM') return l.type === 'Classroom';
        if (filterType === 'LAB') return l.type === 'Laboratory';
        if (filterType === 'OFFICE') return l.type === 'Office';
        return true;
      });
  };

  // Calculate totals
  const totalFloorPower = (floorNum: number) => {
    return loads
      .filter(l => l.floor === floorNum && l.status === 'ON')
      .reduce((sum, l) => sum + (l.power_kw || 0), 0)
      .toFixed(1);
  };

  return (
    <div className="blueprint-twin-container">
      {/* Blueprint Control Bar */}
      <div className="blueprint-top-bar">
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div className="blueprint-brand-badge">
            <Building2 size={16} className="text-cyan" />
            <span>DR. NGPIT A-BLOCK DIGITAL TWIN</span>
          </div>
          <span style={{ fontSize: 12, color: 'var(--text-3)' }}>
            Interactive 3D Architectural Blueprint · 4 Floors
          </span>
        </div>

        {/* Floor Selection Tabs */}
        <div className="blueprint-floor-tabs">
          <button
            className={`floor-tab-btn ${activeFloor === 'all' ? 'active-floor-tab' : ''}`}
            onClick={() => setActiveFloor('all')}
          >
            <Layers size={13} />
            <span>All Floors (Stacked)</span>
          </button>
          {[3, 2, 1, 0].map(f => (
            <button
              key={f}
              className={`floor-tab-btn ${activeFloor === f ? 'active-floor-tab' : ''}`}
              onClick={() => setActiveFloor(f)}
            >
              <span>Floor {f}</span>
              <span className="floor-badge-kw">{totalFloorPower(f)} kW</span>
            </button>
          ))}
        </div>
      </div>

      {/* Filter and Heatmap Legend Bar */}
      <div className="blueprint-filter-bar">
        <div className="filter-chips-group">
          <span style={{ fontSize: 11.5, color: 'var(--text-3)', display: 'flex', alignItems: 'center', gap: 4 }}>
            <SlidersHorizontal size={13} /> Filter:
          </span>
          {[
            { id: 'ALL', label: 'All Units' },
            { id: 'CLASSROOM', label: 'Classrooms' },
            { id: 'LAB', label: 'Laboratories' },
            { id: 'OFFICE', label: 'Offices & Admin' },
            { id: 'CRITICAL', label: '🛡️ Critical Only' },
            { id: 'NON_CRITICAL', label: 'Flexible Shed' }
          ].map(btn => (
            <button
              key={btn.id}
              onClick={() => setFilterType(btn.id)}
              className={`filter-chip ${filterType === btn.id ? 'active-filter-chip' : ''}`}
            >
              {btn.label}
            </button>
          ))}
        </div>

        {/* Heatmap intensity legend */}
        <div className="heatmap-legend">
          <span style={{ fontSize: 11, color: 'var(--text-3)' }}>Load Intensity:</span>
          <span className="legend-item"><span className="legend-dot dot-green" /> &lt;3 kW</span>
          <span className="legend-item"><span className="legend-dot dot-cyan" /> 3-6 kW</span>
          <span className="legend-item"><span className="legend-dot dot-amber" /> 6-10 kW</span>
          <span className="legend-item"><span className="legend-dot dot-rose" /> &gt;10 kW</span>
        </div>
      </div>

      {/* ── ISOMETRIC STACKED BUILDING CANVAS ────────────────────── */}
      <div className="blueprint-canvas-wrapper">
        {floorsToRender.map(floorNum => {
          const meta = floorMeta[floorNum];
          const floorLoads = filteredLoads(floorNum);
          const activeKw = totalFloorPower(floorNum);

          return (
            <div key={floorNum} className="blueprint-floor-plate animate-fade-in">
              {/* Floor Header Bar */}
              <div className="floor-plate-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div className="floor-level-pill" style={{ borderColor: meta.color, color: meta.color }}>
                    FLOOR {floorNum}
                  </div>
                  <div>
                    <h3 style={{ fontSize: 14.5, fontWeight: 700, color: 'var(--text-1)', margin: 0 }}>
                      {meta.title}
                    </h3>
                    <p style={{ fontSize: 11.5, color: 'var(--text-3)', margin: '1px 0 0 0' }}>
                      {meta.subtitle}
                    </p>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <span className="badge" style={{ background: 'rgba(255,255,255,0.05)', color: 'var(--text-2)' }}>
                    {meta.tag}
                  </span>
                  <div className="floor-power-meter">
                    <span style={{ fontSize: 11, color: 'var(--text-3)' }}>Active:</span>
                    <span style={{ fontSize: 14, fontWeight: 800, color: meta.color }}>
                      {activeKw} kW
                    </span>
                  </div>
                </div>
              </div>

              {/* Floor Grid of Clickable Room Blocks */}
              <div className="blueprint-rooms-grid">
                {floorLoads.map(load => {
                  const isEce2b = load.is_sensor_rig || load.id === 'LD-F3-ECE2B' || load.name?.includes('II ECE B');
                  const isSelected = selectedLoadId === load.id;
                  const isOn = load.status === 'ON';
                  const isCrit = load.critical;

                  return (
                    <div
                      key={load.id}
                      onClick={() => onSelectLoad(load)}
                      className={`blueprint-room-card ${isSelected ? 'room-card-selected' : ''} ${isEce2b ? 'room-card-sensor-rig' : ''}`}
                      style={{
                        background: getLoadPowerColor(load),
                        borderColor: isSelected ? '#22d3ee' : getLoadBorderColor(load),
                        boxShadow: isEce2b ? '0 0 20px rgba(234, 179, 8, 0.25)' : undefined
                      }}
                    >
                      {/* Top micro badges */}
                      <div className="room-card-header">
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span className={`room-live-dot ${isOn ? 'dot-active' : 'dot-inactive'}`} />
                          <span className="room-id-code">{load.id}</span>
                        </div>
                        {isEce2b ? (
                          <span className="badge badge-accent" style={{ fontSize: 9.5, padding: '2px 6px', background: 'rgba(234,179,8,0.2)', color: '#facc15' }}>
                            <Radio size={9} className="pulsing-icon" /> SENSOR RIG
                          </span>
                        ) : isCrit ? (
                          <span className="badge badge-danger" style={{ fontSize: 9.5, padding: '2px 6px' }}>
                            <Shield size={9} /> CRITICAL
                          </span>
                        ) : (
                          <span style={{ fontSize: 10, color: 'var(--text-3)' }}>
                            {load.type}
                          </span>
                        )}
                      </div>

                      {/* Room Name */}
                      <div className="room-card-title">
                        {load.name}
                      </div>

                      {/* Telemetry quick readout */}
                      <div className="room-card-metrics">
                        <div>
                          <span className="metric-tag">Power</span>
                          <span className="metric-val text-white">
                            {isOn ? `${(load.power_kw || 0).toFixed(1)} kW` : '0.0 kW'}
                          </span>
                        </div>
                        <div>
                          <span className="metric-tag">Voltage</span>
                          <span className="metric-val text-cyan">
                            {isOn ? `${(load.voltage || 230.2).toFixed(1)} V` : '0 V'}
                          </span>
                        </div>
                        <div>
                          <span className="metric-tag">Current</span>
                          <span className="metric-val text-amber">
                            {isOn ? `${(load.current || 2.1).toFixed(1)} A` : '0 A'}
                          </span>
                        </div>
                      </div>

                      {/* Click to inspect hint */}
                      <div className="room-card-footer">
                        <span>Click to view live gauges</span>
                        <ChevronRight size={12} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

    </div>
  );
};

export default AeroBlueprintTwin;
