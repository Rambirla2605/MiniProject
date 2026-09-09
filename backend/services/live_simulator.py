import asyncio
import random
from datetime import datetime

class LiveSimulator:
    def __init__(self):
        # Base values
        self.voltage = 230.0
        self.current = 18.0
        self.power_factor = 0.94
        self.frequency = 50.0
        
        self.temperature = 28.5
        self.humidity = 55.0
        
        self.twin_power_override = None
        self.last_hardware_time = None
        self.is_hardware_source = False
        
        self.is_running = False
        self.task = None

        self.current_state = self._generate_state()

    def set_twin_active_power(self, power_kw: float):
        """Syncs the simulator with current Digital Twin active loads."""
        self.twin_power_override = power_kw

    def update_from_hardware(self, data: dict):
        """Allows real Raspberry Pi edge nodes to push sensor packets."""
        if "voltage" in data:
            self.voltage = float(data["voltage"])
        if "current" in data:
            self.current = float(data["current"])
        if "power_factor" in data:
            self.power_factor = float(data["power_factor"])
        if "frequency" in data:
            self.frequency = float(data["frequency"])
        if "temperature" in data:
            self.temperature = float(data["temperature"])
        if "humidity" in data:
            self.humidity = float(data["humidity"])
        if "power" in data:
            self.twin_power_override = float(data["power"])

        self.is_hardware_source = True
        self.last_hardware_time = datetime.now()
        self.current_state = self._generate_state()

    def _generate_state(self):
        # Add smooth realistic micro-noise
        self.voltage = self.voltage * 0.85 + (230.0 + random.uniform(-1.5, 1.5)) * 0.15
        self.power_factor = self.power_factor * 0.9 + (random.uniform(0.93, 0.97)) * 0.1
        self.frequency = self.frequency * 0.9 + (50.0 + random.uniform(-0.04, 0.04)) * 0.1
        
        if self.twin_power_override is not None:
            # Scale power with subtle live variations (+/- 1.5%)
            power_kw = max(2.0, self.twin_power_override * (1.0 + random.uniform(-0.015, 0.015)))
            # Compute current from power: I = P / (V * pf) * 1000
            self.current = (power_kw * 1000.0) / (self.voltage * self.power_factor)
        else:
            self.current = self.current * 0.8 + (random.uniform(15, 25)) * 0.2
            power_kw = (self.voltage * self.current * self.power_factor) / 1000.0
        
        return {
            "timestamp": datetime.now().isoformat(),
            "voltage": round(self.voltage, 1),
            "current": round(self.current, 1),
            "power_factor": round(self.power_factor, 2),
            "frequency": round(self.frequency, 2),
            "power": round(power_kw, 2),
            "temperature": round(self.temperature + random.uniform(-0.2, 0.2), 1),
            "humidity": round(self.humidity + random.uniform(-0.5, 0.5), 1),
            "source": "Raspberry Pi (Hardware)" if self.is_hardware_source else "Digital Twin (Simulated Grid)"
        }

    async def _run_loop(self):
        while self.is_running:
            self.current_state = self._generate_state()
            await asyncio.sleep(2) # Update every 2 seconds

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

live_simulator = LiveSimulator()

