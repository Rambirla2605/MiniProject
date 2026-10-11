import asyncio
import random
from datetime import datetime

class LiveSimulator:
    def __init__(self):
        # Campus main feed base values
        self.voltage = 230.2
        self.current = 18.4
        self.power_factor = 0.95
        self.frequency = 50.0
        self.temperature = 28.5
        self.humidity = 55.0
        
        self.twin_power_override = None
        self.last_hardware_time = None
        self.is_hardware_source = False
        
        # Classroom II ECE B dedicated sensor state
        # ece2b_real_mode: when True, shows real hardware values if connected, else strictly 0
        self.ece2b_real_mode = False
        self.last_ece2b_packet_time = None
        
        self.sim_ece2b_voltage = 230.5
        self.sim_ece2b_current = 2.45
        self.sim_ece2b_power = 0.53
        
        self.real_hardware_reading = {
            "voltage": 0.0,
            "current": 0.0,
            "power": 0.0,
            "power_factor": 0.0,
            "frequency": 0.0,
            "temperature": 27.8,
            "last_seen": None,
            "packet_count": 0
        }
        
        self.ece2b_sensor = self._get_current_ece2b_dict()
        
        self.is_running = False
        self.task = None
        self.current_state = self._generate_state()

    def is_ece2b_connected(self) -> bool:
        """Returns True if a real telemetry packet was received within the last 20 seconds."""
        if not self.last_ece2b_packet_time:
            return False
        elapsed = (datetime.now() - self.last_ece2b_packet_time).total_seconds()
        return elapsed <= 20

    def set_real_sensor_mode(self, enable: bool):
        """Toggle Real Hardware Sensor mode. If True and disconnected, values show 0."""
        self.ece2b_real_mode = bool(enable)
        self.ece2b_sensor = self._get_current_ece2b_dict()
        self.current_state = self._generate_state()

    def get_ece2b_status(self) -> dict:
        """Returns current II ECE B status respecting real mode and connection status."""
        return self._get_current_ece2b_dict()

    def _get_current_ece2b_dict(self) -> dict:
        is_conn = self.is_ece2b_connected()
        if self.ece2b_real_mode:
            if is_conn:
                return {
                    "connected": True,
                    "real_mode": True,
                    "last_seen": self.real_hardware_reading.get("last_seen"),
                    "packet_count": self.real_hardware_reading.get("packet_count", 0),
                    "voltage": self.real_hardware_reading["voltage"],
                    "current": self.real_hardware_reading["current"],
                    "power": self.real_hardware_reading["power"],
                    "power_factor": self.real_hardware_reading["power_factor"],
                    "frequency": self.real_hardware_reading["frequency"],
                    "temperature": self.real_hardware_reading.get("temperature", 28.0),
                    "source": "Physical Transducer (Live Telemetry Active)"
                }
            else:
                return {
                    "connected": False,
                    "real_mode": True,
                    "last_seen": self.real_hardware_reading.get("last_seen"),
                    "packet_count": self.real_hardware_reading.get("packet_count", 0),
                    "voltage": 0.0,
                    "current": 0.0,
                    "power": 0.0,
                    "power_factor": 0.0,
                    "frequency": 0.0,
                    "temperature": 27.0,
                    "source": "Physical Sensor Offline (0 V)"
                }
        else:
            return {
                "connected": True,
                "real_mode": False,
                "last_seen": self.real_hardware_reading.get("last_seen"),
                "packet_count": self.real_hardware_reading.get("packet_count", 0),
                "voltage": round(self.sim_ece2b_voltage, 1),
                "current": round(self.sim_ece2b_current, 2),
                "power": round(self.sim_ece2b_power, 3),
                "power_factor": 0.95,
                "frequency": 50.01,
                "temperature": 27.8,
                "source": "Classroom II ECE B Simulated Baseline"
            }

    def set_twin_active_power(self, power_kw: float):
        """Syncs the simulator with current Digital Twin active loads."""
        self.twin_power_override = power_kw

    def update_ece2b_sensor(self, data: dict):
        """
        Accepts real-time telemetry from the physical voltage and current sensor
        attached to Classroom II ECE B (via ESP32 / IoT edge node).
        """
        v = float(data.get("voltage", 0.0))
        # If current not provided in packet (e.g. voltage-only ZMPT101B node), estimate current if V > 10
        if "current" in data and data["current"] is not None:
            c = float(data["current"])
        else:
            c = 2.2 if v > 10 else 0.0
            
        pf = float(data.get("power_factor", 0.95 if v > 10 else 0.0))
        f = float(data.get("frequency", 50.0 if v > 10 else 0.0))
        
        if "power" in data and data["power"] is not None:
            p = float(data["power"])
        else:
            p = round((v * c * pf) / 1000.0, 3)
            
        now_dt = datetime.now()
        self.last_ece2b_packet_time = now_dt
        self.real_hardware_reading = {
            "voltage": round(v, 2),
            "current": round(c, 3),
            "power": round(p, 3),
            "power_factor": round(pf, 2),
            "frequency": round(f, 2),
            "temperature": round(float(data.get("temperature", 28.0)), 1),
            "last_seen": now_dt.isoformat(),
            "packet_count": self.real_hardware_reading.get("packet_count", 0) + 1
        }
        self.ece2b_sensor = self._get_current_ece2b_dict()
        
        # If in real mode and grid voltage feed is synced
        if self.ece2b_real_mode and v > 10:
            self.voltage = round(v, 2)
            self.power_factor = round(pf, 2)
            self.frequency = round(f, 2)
            self.last_hardware_time = now_dt
            self.current_state = self._generate_state()

    def simulate_ece2b_connection(self, enable: bool = True):
        """Allows testing the transition between live connected hardware and disconnected 0 state."""
        if enable:
            now_dt = datetime.now()
            self.last_ece2b_packet_time = now_dt
            self.real_hardware_reading = {
                "voltage": 231.8,
                "current": 3.12,
                "power": round((231.8 * 3.12 * 0.96) / 1000.0, 3),
                "power_factor": 0.96,
                "frequency": 50.02,
                "temperature": 27.5,
                "last_seen": now_dt.isoformat(),
                "packet_count": self.real_hardware_reading.get("packet_count", 0) + 1
            }
        else:
            self.last_ece2b_packet_time = None
        self.ece2b_sensor = self._get_current_ece2b_dict()

    def update_from_hardware(self, data: dict):
        """Campus-wide edge gateway ingestion."""
        self.update_ece2b_sensor(data)
        if "voltage" in data:
            self.voltage = float(data["voltage"])
        if "current" in data:
            self.current = float(data["current"])
        if "power_factor" in data:
            self.power_factor = float(data["power_factor"])
        if "frequency" in data:
            self.frequency = float(data["frequency"])
        if "power" in data:
            self.twin_power_override = float(data["power"])

        self.is_hardware_source = True
        self.last_hardware_time = datetime.now()
        self.current_state = self._generate_state()

    def _generate_state(self):
        # Jitter campus baseline
        self.voltage = self.voltage * 0.85 + (230.0 + random.uniform(-1.2, 1.2)) * 0.15
        self.power_factor = self.power_factor * 0.9 + (random.uniform(0.93, 0.97)) * 0.1
        self.frequency = self.frequency * 0.9 + (50.0 + random.uniform(-0.03, 0.03)) * 0.1
        
        if self.twin_power_override is not None:
            power_kw = max(2.0, self.twin_power_override * (1.0 + random.uniform(-0.015, 0.015)))
            self.current = (power_kw * 1000.0) / (self.voltage * self.power_factor)
        else:
            self.current = self.current * 0.8 + (random.uniform(15, 25)) * 0.2
            power_kw = (self.voltage * self.current * self.power_factor) / 1000.0

        # Update simulated baseline jitter only when NOT in real sensor mode
        if not self.ece2b_real_mode:
            self.sim_ece2b_voltage = round(self.sim_ece2b_voltage + random.uniform(-0.2, 0.2), 1)
            self.sim_ece2b_current = round(max(0.1, self.sim_ece2b_current + random.uniform(-0.04, 0.04)), 2)
            self.sim_ece2b_power = round((self.sim_ece2b_voltage * self.sim_ece2b_current * 0.95) / 1000.0, 3)
            
        self.ece2b_sensor = self._get_current_ece2b_dict()
        
        return {
            "timestamp": datetime.now().isoformat(),
            "voltage": round(self.voltage, 1),
            "current": round(self.current, 1),
            "power_factor": round(self.power_factor, 2),
            "frequency": round(self.frequency, 2),
            "power": round(power_kw, 2),
            "temperature": round(self.temperature + random.uniform(-0.2, 0.2), 1),
            "humidity": round(self.humidity + random.uniform(-0.5, 0.5), 1),
            "source": "Raspberry Pi (Hardware Edge)" if self.is_hardware_source else "Digital Twin Real-Time Stream",
            "ece2b_sensor": self.ece2b_sensor
        }

    async def _run_loop(self):
        while self.is_running:
            self.current_state = self._generate_state()
            await asyncio.sleep(2)

    def start(self):
        if not self.is_running:
            self.is_running = True
            self.task = asyncio.create_task(self._run_loop())

    def stop(self):
        self.is_running = False
        if self.task:
            self.task.cancel()

    def get_current_data(self):
        return self.current_state

    def get_load_telemetry(self, load: dict):
        """Generates real-time telemetry metrics for any load."""
        is_ece2b = (load.get("id") == "LD-F3-ECE2B" or "II ECE B" in load.get("name", ""))
        is_on = load.get("status") == "ON"
        
        if is_ece2b:
            reading = self._get_current_ece2b_dict()
            is_conn = reading["connected"]
            v = reading["voltage"] if is_on else 0.0
            c = reading["current"] if is_on else 0.0
            p = reading["power"] if is_on else 0.0
            return {
                **load,
                "is_sensor_rig": True,
                "real_mode": reading.get("real_mode", False),
                "sensor_connected": is_conn,
                "voltage": v,
                "current": c,
                "power_kw": p,
                "power_factor": reading["power_factor"] if is_on else 0.0,
                "frequency": reading["frequency"] if is_on else 0.0,
                "temperature": reading["temperature"],
                "last_seen": reading.get("last_seen"),
                "packet_count": reading["packet_count"],
                "telemetry_source": reading["source"]
            }
        else:
            base_kw = load.get("power_kw", 2.0)
            if is_on:
                v = round(230.0 + random.uniform(-1.8, 1.8), 1)
                pf = round(random.uniform(0.92, 0.97), 2)
                p = round(base_kw * (1.0 + random.uniform(-0.02, 0.02)), 2)
                c = round((p * 1000.0) / (v * pf), 2)
                f = round(50.0 + random.uniform(-0.03, 0.03), 2)
                temp = round(28.0 + random.uniform(-1.0, 1.5), 1)
            else:
                v = 0.0
                pf = 0.0
                p = 0.0
                c = 0.0
                f = 0.0
                temp = 25.0

            return {
                **load,
                "is_sensor_rig": False,
                "sensor_connected": False,
                "voltage": v,
                "current": c,
                "power_kw": p,
                "power_factor": pf,
                "frequency": f,
                "temperature": temp,
                "telemetry_source": "Digital Twin Real-Time Stream"
            }

live_simulator = LiveSimulator()


