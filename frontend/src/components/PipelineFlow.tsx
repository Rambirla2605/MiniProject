import React, { useState } from 'react';
import {
  Cpu, Radio, Network, BrainCircuit, Zap,
  CheckCircle2, ArrowRight, ChevronDown, ChevronUp
} from 'lucide-react';

interface PipelineFlowProps {
  currentPower?: number;
  predictedPower?: number;
  safeLimit?: number;
  riskLevel?: string;
  isShedActive?: boolean;
}

export const PipelineFlow: React.FC<PipelineFlowProps> = ({
  currentPower = 72.4,
  predictedPower = 84.8,
  safeLimit = 75.0,
  riskLevel = 'HIGH',
  isShedActive = false,
}) => {
  const [expandedNode, setExpandedNode] = useState<string | null>(null);

  const toggleNode = (node: string) => {
    setExpandedNode(prev => (prev === node ? null : node));
  };

  const isOverload = predictedPower > safeLimit;

  return (
    <div className="pipeline-flow-wrapper">
      {/* Pipeline Header */}
      <div className="pipeline-header">
        <div className="pipeline-title-group">
          <div className="pipeline-badge">
            <span className="live-ping-dot" />
            LIVE TELEMETRY & DIGITAL TWIN FLOW
          </div>
          <h2 className="pipeline-title">
            Hardware ➔ Digital Twin ➔ AI Decision Pipeline
          </h2>
          <p className="pipeline-subtitle">
            Real-time physical sensor stream feeds Raspberry Pi edge nodes, updating the A-Block Digital Twin model to run predictive ML inferencing.
          </p>
        </div>

        <div className="pipeline-meta-chips">
          <div className="pipeline-chip">
            <span className="chip-label">Edge Ingestion</span>
            <span className="chip-value text-cyan">2.0s Telemetry</span>
          </div>
          <div className="pipeline-chip">
            <span className="chip-label">Twin Sync</span>
            <span className="chip-value text-emerald">34 Loads Active</span>
          </div>
          <div className="pipeline-chip">
            <span className="chip-label">AI Status</span>
            <span className={`chip-value ${isOverload ? 'text-rose' : 'text-emerald'}`}>
              {isOverload ? 'Overload Imminent' : 'Optimal Grid'}
            </span>
          </div>
        </div>
      </div>

      {/* Interactive Node Flowchart */}
      <div className="flow-nodes-container">
        {/* Node 1: Physical Sensors */}
        <div 
          className={`flow-node-card ${expandedNode === 'sensors' ? 'node-selected' : ''}`}
          onClick={() => toggleNode('sensors')}
        >
          <div className="flow-node-glow cyan-glow" />
          <div className="node-step-tag">Step 01</div>
          <div className="node-icon-box cyan-icon">
            <Radio size={22} className="pulsing-icon" />
          </div>
          <div className="node-text">
            <span className="node-category">Classroom II ECE B</span>
            <h4 className="node-name">Voltage & Current Sensors</h4>
            <p className="node-detail">AC Voltage Transducer & CT Clamp</p>
          </div>
          <div className="node-stat-pill">
            <span>230.4 V</span>
            <span className="divider">•</span>
            <span>2.35 A</span>
          </div>
          <div className="node-expand-hint">
            {expandedNode === 'sensors' ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            <span>{expandedNode === 'sensors' ? 'Hide spec' : 'View spec'}</span>
          </div>
        </div>

        {/* Connector 1 */}
        <div className="flow-connector">
          <div className="flow-stream-line" />
          <div className="flow-particle cyan-particle" />
          <div className="connector-label">ADC / Serial</div>
          <ArrowRight size={16} className="connector-arrow" />
        </div>

        {/* Node 2: Raspberry Pi Edge */}
        <div 
          className={`flow-node-card ${expandedNode === 'raspberry' ? 'node-selected' : ''}`}
          onClick={() => toggleNode('raspberry')}
        >
          <div className="flow-node-glow violet-glow" />
          <div className="node-step-tag">Step 02</div>
          <div className="node-icon-box violet-icon">
            <Cpu size={22} />
          </div>
          <div className="node-text">
            <span className="node-category">Edge Gateway</span>
            <h4 className="node-name">Raspberry Pi 4B</h4>
            <p className="node-detail">Signal Filtering & JSON Packets</p>
          </div>
          <div className="node-stat-pill">
            <span>HTTP POST</span>
            <span className="divider">•</span>
            <span className="status-online">STREAMING</span>
          </div>
          <div className="node-expand-hint">
            {expandedNode === 'raspberry' ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            <span>{expandedNode === 'raspberry' ? 'Hide spec' : 'View spec'}</span>
          </div>
        </div>

        {/* Connector 2 */}
        <div className="flow-connector">
          <div className="flow-stream-line" />
          <div className="flow-particle violet-particle" />
          <div className="connector-label">REST API</div>
          <ArrowRight size={16} className="connector-arrow" />
        </div>

        {/* Node 3: Digital Twin */}
        <div 
          className={`flow-node-card ${expandedNode === 'digitaltwin' ? 'node-selected' : ''}`}
          onClick={() => toggleNode('digitaltwin')}
        >
          <div className="flow-node-glow indigo-glow" />
          <div className="node-step-tag">Step 03</div>
          <div className="node-icon-box indigo-icon">
            <Network size={22} />
          </div>
          <div className="node-text">
            <span className="node-category">Virtual Model</span>
            <h4 className="node-name">A-Block Digital Twin</h4>
            <p className="node-detail">4-Floor Multi-Room Circuit Model</p>
          </div>
          <div className="node-stat-pill">
            <span className="text-white font-bold">{currentPower} kW</span>
            <span className="divider">•</span>
            <span>Live Sync</span>
          </div>
          <div className="node-expand-hint">
            {expandedNode === 'digitaltwin' ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            <span>{expandedNode === 'digitaltwin' ? 'Hide spec' : 'View spec'}</span>
          </div>
        </div>

        {/* Connector 3 */}
        <div className="flow-connector">
          <div className="flow-stream-line" />
          <div className="flow-particle amber-particle" />
          <div className="connector-label">Feature Matrix</div>
          <ArrowRight size={16} className="connector-arrow" />
        </div>

        {/* Node 4: AI Model & Prediction */}
        <div 
          className={`flow-node-card ${expandedNode === 'aimodel' ? 'node-selected' : ''} ${isOverload ? 'card-border-danger' : ''}`}
          onClick={() => toggleNode('aimodel')}
        >
          <div className={`flow-node-glow ${isOverload ? 'rose-glow' : 'emerald-glow'}`} />
          <div className="node-step-tag">Step 04</div>
          <div className={`node-icon-box ${isOverload ? 'rose-icon' : 'emerald-icon'}`}>
            <BrainCircuit size={22} />
          </div>
          <div className="node-text">
            <span className="node-category">5-Year Trained ML</span>
            <h4 className="node-name">Peak Load Forecast</h4>
            <p className="node-detail">Predicts When & Where Peak Occurs</p>
          </div>
          <div className="node-stat-pill">
            <span className={isOverload ? 'text-rose font-bold' : 'text-emerald font-bold'}>
              {predictedPower} kW Peak
            </span>
            <span className="divider">•</span>
            <span>{riskLevel}</span>
          </div>
          <div className="node-expand-hint">
            {expandedNode === 'aimodel' ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            <span>{expandedNode === 'aimodel' ? 'Hide spec' : 'View spec'}</span>
          </div>
        </div>

        {/* Connector 4 */}
        <div className="flow-connector">
          <div className="flow-stream-line" />
          <div className="flow-particle green-particle" />
          <div className="connector-label">Advisory</div>
          <ArrowRight size={16} className="connector-arrow" />
        </div>

        {/* Node 5: Smart Actuation / Re-Prediction */}
        <div 
          className={`flow-node-card ${expandedNode === 'actuation' ? 'node-selected' : ''} ${isShedActive ? 'node-active-highlight' : ''}`}
          onClick={() => toggleNode('actuation')}
        >
          <div className="flow-node-glow emerald-glow" />
          <div className="node-step-tag">Step 05</div>
          <div className="node-icon-box green-icon">
            <Zap size={22} />
          </div>
          <div className="node-text">
            <span className="node-category">Operator Action</span>
            <h4 className="node-name">Non-Critical Shedding</h4>
            <p className="node-detail">AI Suggests · Operator Confirms</p>
          </div>
          <div className="node-stat-pill">
            <CheckCircle2 size={13} className="text-emerald" />
            <span className="text-emerald font-medium">Critical Loads Safe</span>
          </div>
          <div className="node-expand-hint">
            {expandedNode === 'actuation' ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            <span>{expandedNode === 'actuation' ? 'Hide spec' : 'View spec'}</span>
          </div>
        </div>
      </div>

      {/* Expandable Technical Telemetry Details */}
      {expandedNode && (
        <div className="node-drawer-card animate-slide-down">
          {expandedNode === 'sensors' && (
            <div className="drawer-content">
              <div className="drawer-header">
                <Radio size={18} className="text-cyan" />
                <h5>Physical Sensor Rig Configuration</h5>
              </div>
              <div className="drawer-grid">
                <div className="drawer-col">
                  <strong>Hardware Transducers</strong>
                  <p>• Split-core Current Transformers (CT Clamp 100A:50mA)</p>
                  <p>• INA219 High-Side DC/AC Voltage & Current Monitor</p>
                  <p>• PZEM-004T Multi-function AC Power meter with optocoupler isolation</p>
                </div>
                <div className="drawer-col">
                  <strong>Measured Quantities</strong>
                  <p>• Active Real Power (kW) & Apparent Power (kVA)</p>
                  <p>• RMS Voltage (230V Nominal), Frequency (50 Hz ± 0.05)</p>
                  <p>• Power Factor (cos φ = 0.94 - 0.97)</p>
                </div>
                <div className="drawer-col">
                  <strong>Physical Location</strong>
                  <p>• Dr. NGPIT A-Block Main Electrical Distribution Board (EDB-01)</p>
                  <p>• Secondary sub-metering taps on Floor 2 and Floor 3 risers</p>
                </div>
              </div>
            </div>
          )}

          {expandedNode === 'raspberry' && (
            <div className="drawer-content">
              <div className="drawer-header">
                <Cpu size={18} className="text-violet" />
                <h5>Raspberry Pi 4 Model B Edge Gateway Spec</h5>
              </div>
              <div className="drawer-grid">
                <div className="drawer-col">
                  <strong>Hardware & OS</strong>
                  <p>• Raspberry Pi 4 Model B (Quad-core Cortex-A72 @ 1.5GHz, 4GB RAM)</p>
                  <p>• Debian-based Raspberry Pi OS 64-bit Lite</p>
                  <p>• Python 3.11 with adafruit-circuitpython-ina219 & pyserial</p>
                </div>
                <div className="drawer-col">
                  <strong>Edge Pipeline</strong>
                  <p>• Moving-average Kalman noise filtering on raw ADC samples</p>
                  <p>• 2000ms polling cycle with zero-packet-drop local ring buffer</p>
                  <p>• Secure REST POST to endpoint: <code className="code-badge">/api/sensor-data</code></p>
                </div>
                <div className="drawer-col">
                  <strong>Edge Script</strong>
                  <p>• Runs as continuous systemd service: <code className="code-badge">smartenergy-edge.service</code></p>
                  <p>• Auto-reconnect with exponential backoff on WiFi/LAN interruptions</p>
                </div>
              </div>
            </div>
          )}

          {expandedNode === 'digitaltwin' && (
            <div className="drawer-content">
              <div className="drawer-header">
                <Network size={18} className="text-indigo" />
                <h5>A-Block Digital Twin State Engine</h5>
              </div>
              <div className="drawer-grid">
                <div className="drawer-col">
                  <strong>Campus Topology</strong>
                  <p>• Ground Floor: Admin, Offices, Examination Cell, Central IT Hub</p>
                  <p>• Floor 1: ME Classrooms, Programming Labs I & II (15.0 kW)</p>
                  <p>• Floor 2: EEE Machines Lab, Power Electronics Drives (24.7 kW)</p>
                  <p>• Floor 3: ECE Labs, VLSI, Biomedical Instrumentation (21.8 kW)</p>
                </div>
                <div className="drawer-col">
                  <strong>State Synchronization</strong>
                  <p>• Every physical load is mapped to an in-memory mutable entity</p>
                  <p>• Instantaneous active total: <strong className="text-cyan">{currentPower} kW</strong></p>
                  <p>• Preserves critical loads (CoE, Server Hub, Fire Safety) against tripping</p>
                </div>
                <div className="drawer-col">
                  <strong>Data Feed to AI</strong>
                  <p>• Active wattage directly drives 1-hour and 24-hour rolling averages</p>
                  <p>• Digital Twin reflects actual breaker changes within milliseconds</p>
                </div>
              </div>
            </div>
          )}

          {expandedNode === 'aimodel' && (
            <div className="drawer-content">
              <div className="drawer-header">
                <BrainCircuit size={18} className="text-rose" />
                <h5>Random Forest Regressor & Peak Detection</h5>
              </div>
              <div className="drawer-grid">
                <div className="drawer-col">
                  <strong>Model Specifications</strong>
                  <p>• Scikit-learn Random Forest Regressor (100 Decision Trees)</p>
                  <p>• Validated with 80/20 chronological train-test split</p>
                  <p>• Coefficient of Determination: <strong className="text-emerald">R² = 94.2%</strong></p>
                </div>
                <div className="drawer-col">
                  <strong>Engineered Features</strong>
                  <p>• Power lag 1-hour, lag 24-hour, and 24-hour rolling mean</p>
                  <p>• Hour of day, day of week, month seasonality</p>
                  <p>• Working day occupancy profile & live temperature/humidity</p>
                </div>
                <div className="drawer-col">
                  <strong>Overload Assessment</strong>
                  <p>• Configurable Campus Safe Threshold: <strong className="text-amber">{safeLimit} kW</strong></p>
                  <p>• Current Peak Forecast: <strong className="text-rose">{predictedPower} kW</strong></p>
                  <p>• Calculates breach risk probability and pinpointed location</p>
                </div>
              </div>
            </div>
          )}

          {expandedNode === 'actuation' && (
            <div className="drawer-content">
              <div className="drawer-header">
                <Zap size={18} className="text-emerald" />
                <h5>Smart Actuation & Instant Re-Prediction Loop</h5>
              </div>
              <div className="drawer-grid">
                <div className="drawer-col">
                  <strong>Automated Load Shedding</strong>
                  <p>• AI identifies highest non-critical consumers currently ON</p>
                  <p>• Recommends shedding high-draw seminar halls, secondary chillers</p>
                  <p>• Immediate contactor / breaker toggle via Digital Twin relay API</p>
                </div>
                <div className="drawer-col">
                  <strong>Closed-Loop Re-Prediction</strong>
                  <p>• When non-critical loads turn OFF, Digital Twin updates active kW</p>
                  <p>• Live telemetry simulator receives immediate wattage drop</p>
                  <p>• AI recalculates forecast: predicted peak drops safely below 75 kW!</p>
                </div>
                <div className="drawer-col">
                  <strong>Fail-Safe Guarantees</strong>
                  <p>• Medical clinic, CCTV, CoE cell, and IT Hub strictly locked ON</p>
                  <p>• Prevents power disruptions while preventing grid transformer damage</p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default PipelineFlow;
