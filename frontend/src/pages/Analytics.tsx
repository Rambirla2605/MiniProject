import { useEffect, useState } from 'react';
import { fetchHistoricalData, fetchSubstationEnergy } from '../services/api';
import GlassCard from '../components/GlassCard';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, BarChart, Bar
} from 'recharts';
import { BarChart2, TrendingUp, TrendingDown, Calendar, Clock } from 'lucide-react';

const YEARLY = [
  { year: '2023', east: 254100, west: 52400, total: 306500, peak: 71.2 },
  { year: '2024', east: 261800, west: 54100, total: 315900, peak: 73.8 },
  { year: '2025', east: 266865.8, west: 55779.6, total: 322645.4, peak: 75.1 },
];

const CONSUMERS = [
  { name: 'Laboratories & Workshop (East Wing)', pct: 42.3, kw: 18.6, trend: 5.2, up: true },
  { name: 'Smart Classrooms & ECE/EEE Wings',    pct: 26.0, kw: 11.4, trend: 1.8, up: false },
  { name: 'Administration & Executive Offices',  pct: 15.0, kw:  6.6, trend: 0.4, up: true },
  { name: 'Seminar Halls (East & West)',         pct: 11.7, kw:  5.1, trend: 1.2, up: true },
  { name: 'Campus Utilities & RO Plant',         pct:  5.0, kw:  2.2, trend: 0.0, up: false },
];

const BAR_COLORS = ['#6366f1', '#22d3ee', '#a78bfa', '#f59e0b', '#10b981'];

const Analytics = () => {
  const [history, setHistory] = useState<any[]>([]);
  const [substation, setSubstation] = useState<any>({
    east_wing_kw: 782765.8,
    west_wing_kw: 162279.6,
    total_campus_kw: 945045.4,
    east_pct: 82.83,
    west_pct: 17.17,
    reading_date: '01/10/2026',
    reading_time: '3:30 PM',
  });

  useEffect(() => {
    const load = async () => {
      try {
        const [hist, sub] = await Promise.all([
          fetchHistoricalData(7).catch(() => []),
          fetchSubstationEnergy().catch(() => null)
        ]);
        if (hist) setHistory(hist);
        if (sub) setSubstation(sub);
      } catch {}
    };
    load();
  }, []);

  return (
    <div className="flex flex-col gap-6">

      {/* Page Title & Status Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 800, color: 'var(--text-1)', letterSpacing: '-0.3px', display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ color: 'var(--cyan)' }}><BarChart2 size={22} /></span>
            Campus Energy Analytics & Substation Profiling
          </h1>
          <p style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 3 }}>
            Dr. NGPIT Campus 3-Year Historical Baseline & Wing-Wise Distribution
          </p>
        </div>

        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <div style={{ padding: '6px 12px', borderRadius: 10, background: 'rgba(34,211,238,0.1)', border: '1px solid rgba(34,211,238,0.25)', display: 'flex', alignItems: 'center', gap: 6, fontSize: 11.5, color: '#22d3ee', fontWeight: 600 }}>
            <Calendar size={13} />
            <span>Measured: {substation.reading_date}</span>
          </div>
          <div style={{ padding: '6px 12px', borderRadius: 10, background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.25)', display: 'flex', alignItems: 'center', gap: 6, fontSize: 11.5, color: '#f59e0b', fontWeight: 600 }}>
            <Clock size={13} />
            <span>{substation.reading_time}</span>
          </div>
        </div>
      </div>

      {/* ── REAL 3-YEAR SUBSTATION METRICS (EAST VS WEST) ────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 16 }}>
        
        {/* East Wing Card */}
        <GlassCard elevation="accent" style={{ padding: '20px', borderLeft: '4px solid #22d3ee' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              East Wing Substation (3-Yr Total)
            </span>
            <span className="badge badge-accent" style={{ fontSize: 10.5 }}>{substation.east_pct}% SHARE</span>
          </div>
          <div style={{ fontSize: 26, fontWeight: 800, color: '#22d3ee', marginTop: 10 }}>
            {substation.east_wing_kw.toLocaleString()} <span style={{ fontSize: 14, color: 'var(--text-3)', fontWeight: 500 }}>kW / kWh</span>
          </div>
          <div style={{ marginTop: 14 }}>
            <div style={{ height: 6, background: 'rgba(255,255,255,0.06)', borderRadius: 99, overflow: 'hidden' }}>
              <div style={{ width: `${substation.east_pct}%`, height: '100%', background: '#22d3ee', boxShadow: '0 0 8px #22d3ee' }} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--text-3)', marginTop: 6 }}>
              <span>Heavy Labs, Classrooms & Engineering Wings</span>
              <span style={{ color: 'var(--text-1)', fontWeight: 600 }}>782.7k kW</span>
            </div>
          </div>
        </GlassCard>

        {/* West Wing Card */}
        <GlassCard elevation="accent" style={{ padding: '20px', borderLeft: '4px solid #f59e0b' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              West Wing Substation (3-Yr Total)
            </span>
            <span className="badge badge-warning" style={{ fontSize: 10.5 }}>{substation.west_pct}% SHARE</span>
          </div>
          <div style={{ fontSize: 26, fontWeight: 800, color: '#f59e0b', marginTop: 10 }}>
            {substation.west_wing_kw.toLocaleString()} <span style={{ fontSize: 14, color: 'var(--text-3)', fontWeight: 500 }}>kW / kWh</span>
          </div>
          <div style={{ marginTop: 14 }}>
            <div style={{ height: 6, background: 'rgba(255,255,255,0.06)', borderRadius: 99, overflow: 'hidden' }}>
              <div style={{ width: `${substation.west_pct}%`, height: '100%', background: '#f59e0b', boxShadow: '0 0 8px #f59e0b' }} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--text-3)', marginTop: 6 }}>
              <span>Seminar Halls, Utilities & Mechanical Wings</span>
              <span style={{ color: 'var(--text-1)', fontWeight: 600 }}>162.2k kW</span>
            </div>
          </div>
        </GlassCard>

        {/* Campus Total Card */}
        <GlassCard elevation="accent" style={{ padding: '20px', borderLeft: '4px solid #10b981' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Total Campus 3-Year Consumption
            </span>
            <span className="badge badge-success" style={{ fontSize: 10.5 }}>100% CUMULATIVE</span>
          </div>
          <div style={{ fontSize: 26, fontWeight: 800, color: '#10b981', marginTop: 10 }}>
            {substation.total_campus_kw.toLocaleString()} <span style={{ fontSize: 14, color: 'var(--text-3)', fontWeight: 500 }}>kW / kWh</span>
          </div>
          <div style={{ marginTop: 14, display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 11, color: 'var(--text-3)' }}>
            <span>Verified from Substation Meter Logs</span>
            <span style={{ color: 'var(--success)', fontWeight: 700 }}>945.0k kW Total</span>
          </div>
        </GlassCard>

      </div>

      {/* 7-Day Trend */}
      <GlassCard style={{ minHeight: 320 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <div>
            <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-1)' }}>7-Day Hourly Load Stream</div>
            <div style={{ fontSize: 11.5, color: 'var(--text-3)', marginTop: 2 }}>Actual demand curve across A-Block (kW)</div>
          </div>
          <span className="badge badge-accent">LIVE TELEMETRY STREAM</span>
        </div>
        <div style={{ height: 240 }}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={history} margin={{ top: 8, right: 16, left: -10, bottom: 0 }}>
              <defs>
                <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#22d3ee" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="#22d3ee" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
              <XAxis
                dataKey="timestamp"
                stroke="rgba(255,255,255,0.2)"
                fontSize={10}
                tickLine={false}
                axisLine={false}
                tickFormatter={v => {
                  if (!v) return '';
                  const parts = v.split(' ');
                  return parts[1] === '00:00' || parts[1] === '12:00' ? `${parts[0]} ${parts[1]}` : '';
                }}
              />
              <YAxis stroke="rgba(255,255,255,0.2)" fontSize={10} tickLine={false} axisLine={false} tickFormatter={v => `${v}kW`} />
              <Tooltip
                contentStyle={{ background: 'rgba(6,11,24,0.95)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12 }}
                labelStyle={{ color: 'rgba(255,255,255,0.4)', fontSize: 11 }}
                itemStyle={{ color: 'rgba(255,255,255,0.85)', fontSize: 12 }}
              />
              <Area type="monotone" dataKey="total_power" name="Power (kW)" stroke="#22d3ee" strokeWidth={2} fill="url(#areaGrad)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </GlassCard>

      {/* 3-Year Comparison & Highest Consumers */}
      <div className="analytics-grid">

        {/* 3-Year Yearly Breakdown */}
        <GlassCard style={{ minHeight: 300 }}>
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-1)' }}>3-Year Substation Comparison</div>
            <div style={{ fontSize: 11.5, color: 'var(--text-3)', marginTop: 2 }}>East Wing vs West Wing annual cumulative energy (kW)</div>
          </div>
          <div style={{ height: 210 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={YEARLY} margin={{ top: 5, right: 16, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                <XAxis dataKey="year" stroke="rgba(255,255,255,0.2)" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="rgba(255,255,255,0.2)" fontSize={10} tickLine={false} axisLine={false} tickFormatter={v => `${(v/1000).toFixed(0)}k`} />
                <Tooltip
                  contentStyle={{ background: 'rgba(6,11,24,0.95)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12 }}
                  labelStyle={{ color: 'rgba(255,255,255,0.4)', fontSize: 11 }}
                  itemStyle={{ color: 'rgba(255,255,255,0.85)', fontSize: 12 }}
                  formatter={(v: any) => [`${v.toLocaleString()} kW`, '']}
                  cursor={{ fill: 'rgba(255,255,255,0.03)' }}
                />
                <Bar dataKey="east" name="East Wing" fill="#22d3ee" radius={[4, 4, 0, 0]} />
                <Bar dataKey="west" name="West Wing" fill="#f59e0b" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="analytics-kpi-row" style={{ marginTop: 10 }}>
            {YEARLY.map(({ year, total, peak }) => (
              <div key={year} style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 10, color: 'var(--text-3)', marginBottom: 2 }}>{year}</div>
                <div style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--text-1)' }}>{(total/1000).toFixed(1)}k kW</div>
                <div style={{ fontSize: 10, color: 'var(--cyan)' }}>Peak: {peak} kW</div>
              </div>
            ))}
          </div>
        </GlassCard>

        {/* Top Consumer Categories */}
        <GlassCard>
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-1)' }}>A-Block Major Consumer Categories</div>
            <div style={{ fontSize: 11.5, color: 'var(--text-3)', marginTop: 2 }}>Facility distribution & demand ranking</div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {CONSUMERS.map(({ name, pct, kw, trend, up }, i) => (
              <div key={name}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ width: 20, height: 20, borderRadius: 6, background: BAR_COLORS[i], display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 800, color: 'white' }}>{i + 1}</span>
                    <span style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--text-1)' }}>{name}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-1)' }}>{kw} kW</span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: 11, fontWeight: 600, color: up ? 'var(--danger)' : 'var(--success)' }}>
                      {up ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
                      {trend}%
                    </span>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ flex: 1, height: 5, background: 'rgba(255,255,255,0.06)', borderRadius: 99, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${pct}%`, borderRadius: 99, background: BAR_COLORS[i], boxShadow: `0 0 6px ${BAR_COLORS[i]}80`, transition: 'width 1s ease' }} />
                  </div>
                  <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-3)', width: 36, textAlign: 'right' }}>{pct}%</span>
                </div>
              </div>
            ))}
          </div>
        </GlassCard>

      </div>

    </div>
  );
};

export default Analytics;
