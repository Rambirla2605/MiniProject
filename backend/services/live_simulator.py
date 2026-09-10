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
        self.ece2b_sensor = {
            "connected": False,
            "last_seen": None,
            "packet_count": 0,
            "voltage": 230.5,
            "current": 2.45,
            "power": 0.53,
            "power_factor": 0.95,
            "frequency": 50.01,
            "temperature": 27.8,
            "source": "Simulated Demo (Awaiting Physical Circuit)"
        }
        
        self.is_running = False
        self.task = None
        self.current_state = self._generate_state()

    def set_twin_active_power(self, power_kw: float):
        """Syncs the simulator with current Digital Twin active loads."""
        self.twin_power_override = power_kw

    def update_ece2b_sensor(self, data: dict):
        """
        Accepts real-time telemetry from the physical voltage and current sensor
        attached to Classroom II ECE B (via Raspberry Pi / IoT edge gateway).
        """
        v = float(data.get("voltage", 230.0))
        c = float(data.get("current", 2.2))
        pf = float(data.get("power_factor", 0.95))
        f = float(data.get("frequency", 50.0))
        
        # If power is not directly supplied, calculate P = (V * I * pf) / 1000 kW
        if "power" in data and data["power"] is not None:
            p = float(data["power"])
        else:
            p = round((v * c * pf) / 1000.0, 3)
            
        self.ece2b_sensor["connected"] = True
        self.ece2b_sensor["last_seen"] = datetime.now().isoformat()
        self.ece2b_sensor["packet_count"] += 1
        self.ece2b_sensor["voltage"] = round(v, 2)
        self.ece2b_sensor["current"] = round(c, 3)
        self.ece2b_sensor["power"] = round(p, 3)
        self.ece2b_sensor["power_factor"] = round(pf, 2)
        self.ece2b_sensor["frequency"] = round(f, 2)
        self.ece2b_sensor["temperature"] = round(float(data.get("temperature", 28.0)), 1)
        self.ece2b_sensor["source"] = "Physical Transducer (Live Hardware Connected)"
        
        self.last_hardware_time = datetime.now()

    def simulate_ece2b_connection(self, enable: bool = True):
        """Allows testing the transition from demo mode to live connected hardware."""
        if enable:
            self.ece2b_sensor["connected"] = True
            self.ece2b_sensor["last_seen"] = datetime.now().isoformat()
            self.ece2b_sensor["packet_count"] += 1
            self.ece2b_sensor["voltage"] = 231.8
            self.ece2b_sensor["current"] = 3.12
            self.ece2b_sensor["power"] = round((231.8 * 3.12 * 0.96) / 1000.0, 3)
            self.ece2b_sensor["power_factor"] = 0.96
            self.ece2b_sensor["frequency"] = 50.02
            self.ece2b_sensor["source"] = "Physical Transducer (Live Hardware Connected)"
        else:
            self.ece2b_sensor["connected"] = False
            self.ece2b_sensor["source"] = "Simulated Demo (Awaiting Physical Circuit)"

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

        # Also update demo jitter for II ECE B if not connected
        if not self.ece2b_sensor["connected"]:
            self.ece2b_sensor["voltage"] = round(230.0 + random.uniform(-1.5, 1.5), 1)
            self.ece2b_sensor["current"] = round(2.3 + random.uniform(-0.25, 0.25), 2)
            self.ece2b_sensor["power"] = round((self.ece2b_sensor["voltage"] * self.ece2b_sensor["current"] * 0.95) / 1000.0, 3)
            self.ece2b_sensor["frequency"] = round(50.0 + random.uniform(-0.04, 0.04), 2)
            self.ece2b_sensor["power_factor"] = round(random.uniform(0.93, 0.96), 2)
            self.ece2b_sensor["source"] = "Simulated Demo (Awaiting Physical Circuit)"
        else:
            # If connected, add small real-world noise to simulate active transducer stream
            self.ece2b_sensor["voltage"] = round(self.ece2b_sensor["voltage"] + random.uniform(-0.2, 0.2), 1)
            self.ece2b_sensor["current"] = round(max(0.1, self.ece2b_sensor["current"] + random.uniform(-0.04, 0.04)), 2)
            self.ece2b_sensor["power"] = round((self.ece2b_sensor["voltage"] * self.ece2b_sensor["current"] * self.ece2b_sensor["power_factor"]) / 1000.0, 3)
        
        return {
            "timestamp": datetime.now().isoformat(),
            "voltage": round(self.voltage, 1),
            "current": round(self.current, 1),
            "power_factor": round(self.power_factor, 2),
            "frequency": round(self.frequency, 2),
            "power": round(power_kw, 2),
            "temperature": round(self.temperature + random.uniform(-0.2, 0.2), 1),
            "humidity": round(self.humidity + random.uniform(-0.5, 0.5), 1),
            "source": "Raspberry Pi (Hardware Edge)" if self.is_hardware_source else "Digital Twin (Simulated Grid)",
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
            reading = self.ece2b_sensor
            v = reading["voltage"] if is_on else 0.0
            c = reading["current"] if is_on else 0.0
            p = reading["power"] if is_on else 0.0
            return {
                **load,
                "is_sensor_rig": True,
                "sensor_connected": reading["connected"],
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
                "telemetry_source": "Digital Twin Virtual Sensor (Demo Readings)"
            }

live_simulator = LiveSimulator()


