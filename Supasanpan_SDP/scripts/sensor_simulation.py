import requests
import random
import time
import json
from datetime import datetime
import os

# Load configuration
def load_config():
    try:
        with open('config/sensor_config.json', 'r') as f:
            return json.load(f)
    except FileNotFoundError:
        # Default configuration if file doesn't exist
        return {
            "intervals": {
                "backend": 5  # 5 seconds
            },
            "thresholds": {
                "ph": {"min": 6.5, "max": 7.5},
                "tds": {"min": 100, "max": 500},
                "water_level": {"min": 20, "max": 100}
            }
        }

# Load configuration
config = load_config()

# API endpoint
API_URL = "http://localhost:5000/api/sensors/data"

def generate_sensor_data():
    """Generate random sensor data within specified ranges"""
    return {
        "tank_id": random.choice(["Tank01", "Tank02"]),
        "ph_value": round(random.uniform(config["thresholds"]["ph"]["min"], config["thresholds"]["ph"]["max"]), 2),
        "tds_value": random.randint(config["thresholds"]["tds"]["min"], config["thresholds"]["tds"]["max"]),
        "water_level": round(random.uniform(config["thresholds"]["water_level"]["min"], config["thresholds"]["water_level"]["max"]), 2)
    }

def send_sensor_data(data):
    """Send sensor data to the API"""
    try:
        response = requests.post(API_URL, json=data)
        if response.status_code == 201:
            print(f"[{datetime.now()}] Data sent successfully: {data}")
        else:
            print(f"[{datetime.now()}] Error sending data: {response.text}")
    except Exception as e:
        print(f"[{datetime.now()}] Error: {str(e)}")

def main():
    """Main function to run the sensor simulation"""
    print("Starting sensor data simulation...")
    print(f"Data generation interval: {config['intervals']['backend']} seconds")
    print("Press Ctrl+C to stop")
    
    try:
        while True:
            data = generate_sensor_data()
            send_sensor_data(data)
            time.sleep(config["intervals"]["backend"])
    except KeyboardInterrupt:
        print("\nSimulation stopped")

if __name__ == "__main__":
    main() 