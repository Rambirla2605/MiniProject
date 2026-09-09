import { useEffect, useState } from 'react';
import { fetchHistoricalData } from '../services/api';
import GlassCard from '../components/GlassCard';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, BarChart, Bar, Cell
} from 'recharts';
import { BarChart2, TrendingUp, TrendingDown, BrainCircuit } from 'lucide-react';

const YEARLY = [
  { year: '2020', consumption: 840200, peak: 71.2, avg: 38.4 },
  { year: '2021', consumption: 890150, peak: 73.8, avg: 40.1 },
  { year: '2022', consumption: 910400, peak: 75.1, avg: 41.2 },
  { year: '2023', consumption: 870000, peak: 69.5, avg: 39.3 },
  { year: '2024', consumption: 850000, peak: 67.4, avg: 38.7 },
];

const CONSUMERS = [
  { name: 'HVAC / Ventilation',  pct: 42.3, kw: 18.6, trend: 7.2,  up: true  },
  { name: 'Lighting',            pct: 23.0, kw: 10.1, trend: 2.1,  up: false },
  { name: 'Computers & Labs',    pct: 14.0, kw:  6.1, trend: 0.3,  up: true  },
  { name: 'Laboratory Equipment',pct: 11.0, kw:  4.8, trend: 1.5,  up: true  },
  { name: 'Water & Utilities',   pct:  5.0, kw:  2.2, trend: 0.0,  up: false },
  { name: 'Other Equipment',     pct:  4.7, kw:  2.0, trend: 0.5,  up: false },
];

const BAR_COLORS = ['#6366f1','#818cf8','#a78bfa','#7c3aed','#4f46e5','#4338ca'];

const Analytics = () => {
  const [history, setHistory] = useState<any[]>([]);

  useEffect(() => {
    const load = async () => {
      try { setHistory(await fetchHistoricalData(7)); } catch {}
    };
    load();
  }, []);

  return (
    <div className="flex flex-col gap-6">

      {/* Page Title */}
      <div>
        <h1 style={{ fontSize: 20, fontWeight: 800, color: 'var(--text-1)', letterSpacing: '-0.3px', display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ color: 'var(--cyan)' }}><BarChart2 size={22} /></span>
          Energy Analytics
        </h1>
        <p style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 3 }}>
          6+ Months Historical Data · Demo Prototype · Academic Building Energy Profile
        </p>
      </div>

      {/* How historical data feeds AI — info card */}
      <div style={{
        display: 'flex', alignItems: 'flex-start', gap: 14, padding: '14px 18px',
        borderRadius: 12, background: 'rgba(99,102,241,0.07)',
        border: '1px solid rgba(99,102,241,0.2)',
      }}>
        <span style={{ color: 'var(--accent-light)', flexShrink: 0, marginTop: 1 }}><BrainCircuit size={18} /></span>
        <div>
          <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--accent-light)', marginBottom: 4 }}>
            Historical Data → AI Model
          </div>
          <p style={{ fontSize: 12, color: 'var(--text-2)', lineHeight: 1.6, margin: 0 }}>
            Historical energy-consumption data is analyzed to identify patterns — daily cycles, weekday vs weekend,
            seasonal variation, and peak periods. These patterns are used to train the AI prediction model to
            forecast future energy consumption and support optimization decisions.
          </p>
        </div>
      </div>

      {/* 7-Day Trend */}
      <GlassCard style={{ minHeight: 340 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <div>
            <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-1)' }}>Recent Consumption Trend</div>
            <div style={{ fontSize: 11.5, color: 'var(--text-3)', marginTop: 2 }}>Hourly energy consumption (kW) — last 7 days</div>
          </div>
          <span className="badge badge-accent">DEMO DATA</span>
        </div>
        <div style={{ height: 260 }}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={history} margin={{ top: 8, right: 16, left: -10, bottom: 0 }}>
              <defs>
                <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%"   stopColor="#22d3ee" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="#22d3ee" stopOpacity={0}   />
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
                  const [date, time] = v.split(' ');
                  return time === '00:00' || time === '12:00' ? `${date} ${time}` : '';
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

      {/* Yearly Comparison + Consumers */}
      <div className="analytics-grid">

        {/* Yearly Bar Chart */}
        <GlassCard style={{ minHeight: 300 }}>
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-1)' }}>Annual Consumption Comparison</div>
            <div style={{ fontSize: 11.5, color: 'var(--text-3)', marginTop: 2 }}>Annual energy totals (kWh) — Demo data based on academic building profile</div>
          </div>
          <div style={{ height: 220 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={YEARLY} margin={{ top: 5, right: 16, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                <XAxis dataKey="year" stroke="rgba(255,255,255,0.2)" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="rgba(255,255,255,0.2)" fontSize={10} tickLine={false} axisLine={false} tickFormatter={v => `${(v/1000).toFixed(0)}k`} />
                <Tooltip
                  contentStyle={{ background: 'rgba(6,11,24,0.95)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12 }}
                  labelStyle={{ color: 'rgba(255,255,255,0.4)', fontSize: 11 }}
                  itemStyle={{ color: 'rgba(255,255,255,0.85)', fontSize: 12 }}
                  formatter={(v: any) => [`${v.toLocaleString()} kWh`, 'Consumption']}
                  cursor={{ fill: 'rgba(255,255,255,0.03)' }}
                />
                <Bar dataKey="consumption" radius={[6, 6, 0, 0]}>
                  {YEARLY.map((_, i) => (
                    <Cell key={i} fill={BAR_COLORS[i]} style={{ filter: `drop-shadow(0 0 6px ${BAR_COLORS[i]}60)` }} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="analytics-kpi-row">
            {YEARLY.map(({ year, peak, avg }) => (
              <div key={year} style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 10, color: 'var(--text-3)', marginBottom: 2 }}>{year}</div>
                <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-1)' }}>↑{peak} kW</div>
                <div style={{ fontSize: 10, color: 'var(--text-3)' }}>~{avg} avg</div>
              </div>
            ))}
          </div>
        </GlassCard>

        {/* Top Consumers Table */}
        <GlassCard>
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-1)' }}>Energy Consumption by Category</div>
            <div style={{ fontSize: 11.5, color: 'var(--text-3)', marginTop: 2 }}>Estimated load distribution — Demo data</div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {CONSUMERS.map(({ name, pct, kw, trend, up }, i) => (
              <div key={name}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ width: 20, height: 20, borderRadius: 6, background: BAR_COLORS[i], display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 800, color: 'white' }}>{i + 1}</span>
                    <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-1)' }}>{name}</span>
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
