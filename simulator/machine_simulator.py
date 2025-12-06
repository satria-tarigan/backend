#!/usr/bin/env python3
"""
Predictive Machine Copilot - Machine Data Streaming Simulator
Simulates 3 factory machines sending real industrial IoT data every 5 seconds
Based on AI4I 2020 Predictive Maintenance Dataset
"""

import requests
import json
import time
import random
import math
from datetime import datetime, timezone
import threading
from typing import Dict, List
import logging

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

class MachineSimulator:
    """Simulates factory machines sending streaming data"""

    def __init__(self, backend_url: str = "http://localhost:3000"):
        self.backend_url = backend_url
        self.ingest_endpoint = f"{backend_url}/api/v1/ingest"
        self.machines = self._initialize_machines()
        self.running = False

    def _initialize_machines(self) -> List[Dict]:
        """Initialize machine configurations with industrial IoT metrics"""
        return [
            {
                "machine_id": "MCH-001",
                "name": "CNC Machine A",
                "location": "factory_floor_north",
                "air_temp_base": 298.15,    # Base air temperature in K (25°C)
                "air_temp_std": 2.0,        # Standard deviation for air temp
                "process_temp_offset": 10,   # Process temp offset from air temp
                "process_temp_std": 1.0,     # Standard deviation for process temp
                "power": 2860,              # Power for rotational speed calculation
                "torque_mean": 40,          # Torque mean value
                "torque_std": 10,           # Torque standard deviation
                "tool_wear_base": 0,        # Base tool wear in minutes
                "quality_variant": "M",      # H/M/L for tool wear rate
                "tool_wear_rate": {         # Minutes per cycle
                    "H": 5,
                    "M": 3,
                    "L": 2
                },
                "status": "active",
                "failure_probability": 0.01  # 1% chance of failure
            },
            {
                "machine_id": "MCH-002",
                "name": "CNC Machine B",
                "location": "factory_floor_south",
                "air_temp_base": 300.15,    # Base air temperature in K (27°C)
                "air_temp_std": 2.0,
                "process_temp_offset": 10,
                "process_temp_std": 1.0,
                "power": 2850,
                "torque_mean": 38,
                "torque_std": 8,
                "tool_wear_base": 50,
                "quality_variant": "H",
                "tool_wear_rate": {
                    "H": 5,
                    "M": 3,
                    "L": 2
                },
                "status": "active",
                "failure_probability": 0.008
            },
            {
                "machine_id": "MCH-003",
                "name": "CNC Machine C",
                "location": "factory_floor_east",
                "air_temp_base": 295.15,    # Base air temperature in K (22°C)
                "air_temp_std": 2.0,
                "process_temp_offset": 10,
                "process_temp_std": 1.0,
                "power": 2870,
                "torque_mean": 42,
                "torque_std": 12,
                "tool_wear_base": 120,
                "quality_variant": "L",
                "tool_wear_rate": {
                    "H": 5,
                    "M": 3,
                    "L": 2
                },
                "status": "active",
                "failure_probability": 0.015
            }
        ]

    def _generate_realistic_metrics(self, machine: Dict) -> Dict:
        """Generate realistic industrial IoT metrics based on AI4I 2020 dataset"""
        metrics = {}

        # Generate air temperature using random walk (K)
        air_temp_change = random.gauss(0, machine["air_temp_std"])
        machine["air_temp_base"] += air_temp_change
        # Normalize back to reasonable range
        machine["air_temp_base"] = max(295, min(305, machine["air_temp_base"]))
        metrics["air_temperature"] = round(machine["air_temp_base"], 1)

        # Process temperature = air temperature + 10K with random walk
        process_temp_change = random.gauss(0, machine["process_temp_std"])
        process_temp = machine["air_temp_base"] + machine["process_temp_offset"] + process_temp_change
        metrics["process_temperature"] = round(process_temp, 1)

        # Rotational speed calculated from power with noise
        # Simplified formula: rpm = sqrt(power * 1000 / torque_constant)
        torque_constant = 0.1
        base_rpm = math.sqrt(machine["power"] * 1000 / torque_constant)
        rpm_noise = random.gauss(0, 100)
        metrics["rotational_speed"] = int(max(1000, min(4000, base_rpm + rpm_noise)))

        # Torque with normal distribution (no negative values)
        torque = random.gauss(machine["torque_mean"], machine["torque_std"])
        metrics["torque"] = round(max(0, torque), 1)

        # Tool wear increases based on quality variant
        if machine["status"] == "active":
            wear_rate = machine["tool_wear_rate"][machine["quality_variant"]]
            machine["tool_wear_base"] += wear_rate
        metrics["tool_wear"] = machine["tool_wear_base"]

        # Quality variant
        metrics["quality_variant"] = machine["quality_variant"]

        # Machine failure logic
        machine_failure = False
        failure_mode = None

        # Different failure scenarios based on conditions
        if machine["tool_wear_base"] > 200:  # Tool wear failure
            machine_failure = True
            failure_mode = "tool_wear_failure"
        elif metrics["process_temperature"] > 350:  # Heat dissipation failure
            machine_failure = True
            failure_mode = "heat_dissipation_failure"
        elif metrics["rotational_speed"] < 2000:  # Power failure
            machine_failure = True
            failure_mode = "power_failure"
        elif metrics["torque"] > 80:  # Overstrain failure
            machine_failure = True
            failure_mode = "overstrain_failure"
        elif random.random() < machine["failure_probability"]:  # Random failure
            machine_failure = True
            failure_mode = "random_failure"

        metrics["machine_failure"] = machine_failure
        metrics["failure_mode"] = failure_mode

        # Log failures
        if machine_failure:
            logger.warning(f"Machine {machine['machine_id']} failure: {failure_mode}")

        return metrics

    def _update_machine_status(self, machine: Dict):
        """Randomly update machine status"""
        if random.random() < machine["failure_probability"]:
            machine["status"] = "error"
            logger.error(f"Machine {machine['machine_id']} entered failure state")
        elif random.random() < 0.02:  # 2% chance of maintenance
            machine["status"] = "maintenance"
            logger.info(f"Machine {machine['machine_id']} entered maintenance mode")
            # Reset some parameters during maintenance
            if machine["tool_wear_base"] > 100:
                machine["tool_wear_base"] = max(0, machine["tool_wear_base"] - 50)  # Tool maintenance
        elif machine["status"] == "error" and random.random() < 0.3:  # 30% chance to recover
            machine["status"] = "active"
            logger.info(f"Machine {machine['machine_id']} recovered and is active")
            # Reset tool wear on recovery
            machine["tool_wear_base"] = max(0, machine["tool_wear_base"] - 100)
        elif machine["status"] == "maintenance" and random.random() < 0.2:  # 20% chance to finish maintenance
            machine["status"] = "active"
            logger.info(f"Machine {machine['machine_id']} maintenance completed")
            # Reset parameters after maintenance
            machine["air_temp_base"] = 298.15  # Reset to normal temperature
            machine["tool_wear_base"] = 0      # Reset tool wear

    def _generate_payload(self, machine: Dict) -> Dict:
        """Generate JSON payload for machine data"""
        timestamp = datetime.now(timezone.utc).isoformat()

        # Generate maintenance info (occasionally)
        maintenance_info = None
        if random.random() < 0.1:  # 10% chance to include maintenance info
            maintenance_info = {
                "last_maintenance": (datetime.now(timezone.utc).replace(
                    day=random.randint(1, 28)
                )).isoformat(),
                "next_maintenance": (datetime.now(timezone.utc).replace(
                    day=random.randint(1, 28),
                    month=(datetime.now().month % 12) + 1
                )).isoformat(),
                "maintenance_type": random.choice(["routine", "emergency", "preventive"])
            }

        return {
            "machine_id": machine["machine_id"],
            "timestamp": timestamp,
            "metrics": self._generate_realistic_metrics(machine),
            "status": machine["status"],
            "location": machine["location"],
            "maintenance_info": maintenance_info
        }

    def _send_data(self, payload: Dict) -> bool:
        """Send data to backend endpoint"""
        try:
            response = requests.post(
                self.ingest_endpoint,
                json=payload,
                headers={"Content-Type": "application/json"},
                timeout=10
            )

            if response.status_code in [200, 201]:
                logger.info(
                    f"✅ Data sent successfully for {payload['machine_id']} - "
                    f"Status: {response.status_code}"
                )
                return True
            else:
                logger.error(
                    f"❌ Failed to send data for {payload['machine_id']} - "
                    f"Status: {response.status_code}, Response: {response.text}"
                )
                return False

        except requests.exceptions.RequestException as e:
            logger.error(f"❌ Network error sending data for {payload['machine_id']}: {e}")
            return False

    def _run_machine_simulation(self, machine: Dict):
        """Run simulation for a single machine"""
        logger.info(f"Starting simulation for {machine['machine_id']}")

        while self.running:
            try:
                # Update machine status
                self._update_machine_status(machine)

                # Generate and send data
                payload = self._generate_payload(machine)
                success = self._send_data(payload)

                if not success:
                    # Wait longer if failed
                    time.sleep(10)

                # Wait for next cycle
                time.sleep(5)

            except KeyboardInterrupt:
                break
            except Exception as e:
                logger.error(f"Error in simulation for {machine['machine_id']}: {e}")
                time.sleep(5)

        logger.info(f"Stopped simulation for {machine['machine_id']}")

    def start(self):
        """Start the simulation for all machines"""
        logger.info("🚀 Starting Machine Data Streaming Simulator")
        logger.info(f"📡 Sending data to: {self.ingest_endpoint}")
        logger.info(f"🏭 Simulating {len(self.machines)} machines")

        self.running = True

        # Create threads for each machine
        threads = []
        for machine in self.machines:
            thread = threading.Thread(
                target=self._run_machine_simulation,
                args=(machine,),
                daemon=True
            )
            thread.start()
            threads.append(thread)

        try:
            # Keep main thread alive
            while self.running:
                time.sleep(1)
        except KeyboardInterrupt:
            logger.info("🛑 Received shutdown signal")
            self.stop()

        # Wait for all threads to complete
        for thread in threads:
            thread.join(timeout=2)

    def stop(self):
        """Stop the simulation"""
        self.running = False
        logger.info("⏹️ Stopping all simulations...")

def main():
    """Main function to run the simulator"""
    import argparse

    parser = argparse.ArgumentParser(description="Machine Data Streaming Simulator")
    parser.add_argument(
        "--url",
        default="http://localhost:3000",
        help="Backend URL (default: http://localhost:3000)"
    )
    parser.add_argument(
        "--test",
        action="store_true",
        help="Run in test mode (send single payload and exit)"
    )

    args = parser.parse_args()

    simulator = MachineSimulator(args.url)

    if args.test:
        # Test mode: send one payload from each machine and exit
        logger.info("🧪 Running in test mode")
        for machine in simulator.machines:
            payload = simulator._generate_payload(machine)
            print(f"\n📦 Sample payload for {machine['machine_id']}:")
            print(json.dumps(payload, indent=2))
            simulator._send_data(payload)
            time.sleep(1)
        logger.info("✅ Test completed")
    else:
        # Normal mode: continuous simulation
        simulator.start()

if __name__ == "__main__":
    main()