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
        
        self.temperature = 24.5
        self.humidity = 45.0
        
        self.is_running = False
        self.task = None

        self.current_state = self._generate_state()

    def _generate_state(self):
        # Add smooth noise
        self.voltage = self.voltage * 0.8 + (230.0 + random.uniform(-2, 2)) * 0.2
        self.current = self.current * 0.8 + (random.uniform(15, 25)) * 0.2
        self.power_factor = self.power_factor * 0.9 + (random.uniform(0.92, 0.98)) * 0.1
        self.frequency = self.frequency * 0.9 + (50.0 + random.uniform(-0.05, 0.05)) * 0.1
        
        power_kw = (self.voltage * self.current * self.power_factor) / 1000.0
        
        return {
            "timestamp": datetime.now().isoformat(),
            "voltage": round(self.voltage, 1),
            "current": round(self.current, 1),
            "power_factor": round(self.power_factor, 2),
            "frequency": round(self.frequency, 2),
            "power": round(power_kw, 2),
            "temperature": round(self.temperature + random.uniform(-0.5, 0.5), 1),
            "humidity": round(self.humidity + random.uniform(-1, 1), 1),
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
