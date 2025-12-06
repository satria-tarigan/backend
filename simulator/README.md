# Predictive Machine Copilot - Machine Data Streaming Simulator

Python script yang mensimulasikan 3 mesin pabrik mengirimkan data streaming ke Predictive Machine Copilot backend API setiap 5 detik untuk real-time monitoring dan predictive maintenance.

## 📋 Features

- **3 Simulated Machines**: Production Line A, Production Line B, Packaging Unit
- **Real-time Data**: Temperature, pressure, vibration, efficiency, production count
- **Realistic Variations**: Natural fluctuations and occasional anomalies
- **Dynamic Status**: Machines can enter error, maintenance, or active states
- **Push Ingestion**: Data dikirim ke backend via HTTP POST
- **Error Handling**: Robust error handling dengan retry logic
- **Test Mode**: Mode testing untuk validasi payload

## 🚀 Quick Start

### 1. Install Dependencies
```bash
cd backend/simulator
pip install -r requirements.txt
```

### 2. Start Backend Server
```bash
# Di folder backend
npm run dev
```

### 3. Run Simulator

**Normal Mode (Continuous):**
```bash
python machine_simulator.py
```

**Custom Backend URL:**
```bash
python machine_simulator.py --url http://localhost:3000
```

**Test Mode (Single Payload):**
```bash
python machine_simulator.py --test
```

## 📊 JSON Payload Format

```json
{
  "machine_id": "MCH-001",
  "timestamp": "2025-12-06T10:30:00.123Z",
  "metrics": {
    "temperature": 72.5,
    "pressure": 105.3,
    "vibration": 1.2,
    "production_count": 150,
    "efficiency": 87.5,
    "power_consumption": 52.1
  },
  "status": "active",
  "location": "factory_floor_north",
  "maintenance_info": {
    "last_maintenance": "2025-11-15T10:00:00Z",
    "next_maintenance": "2025-12-15T10:00:00Z",
    "maintenance_type": "routine"
  }
}
```

## 🏭 Simulated Machines

### Machine MCH-001 - Production Line A
- **Location**: factory_floor_north
- **Base Metrics**: Temp 70°C, Pressure 100 PSI, Vibration 1.0 mm/s
- **Error Probability**: 5%

### Machine MCH-002 - Production Line B
- **Location**: factory_floor_south
- **Base Metrics**: Temp 68°C, Pressure 95 PSI, Vibration 0.8 mm/s
- **Error Probability**: 3%

### Machine MCH-003 - Packaging Unit
- **Location**: packaging_area
- **Base Metrics**: Temp 25°C, Pressure 80 PSI, Vibration 0.5 mm/s
- **Error Probability**: 2%

## 🎯 Data Scenarios

### Normal Operation
- Metrics fluctuate within realistic ranges
- Production count increases gradually
- Status remains "active"

### Anomalies (10% chance)
- **Temperature Spike**: 85-95°C
- **Pressure Drop**: 50-70 PSI
- **High Vibration**: 4-6 mm/s

### Status Changes
- **Error**: Machine enters error state (based on probability)
- **Maintenance**: Scheduled maintenance mode
- **Recovery**: Machine returns to active state

## 📡 API Endpoint

**Target URL**: `POST {backend_url}/api/v1/ingest`

### Response Success
```json
{
  "success": true,
  "message": "Data ingested successfully",
  "data": {
    "id": "uuid-123",
    "machine_id": "MCH-001",
    "timestamp": "2025-12-06T10:30:00Z",
    "alerts": [
      {
        "type": "high_temperature",
        "severity": "warning",
        "value": 87.5,
        "threshold": 80
      }
    ]
  }
}
```

## 🐛 Troubleshooting

### Connection Issues
```bash
# Test backend connectivity
curl http://localhost:3000/health

# Test ingestion endpoint
curl -X POST http://localhost:3000/api/v1/ingest \
  -H "Content-Type: application/json" \
  -d '{"machine_id":"TEST","metrics":{"temperature":25}}'
```

### Common Errors
1. **Connection Refused**: Backend server tidak running
2. **404 Not Found**: Endpoint URL salah
3. **Validation Error**: JSON payload tidak valid
4. **Rate Limited**: Terlalu banyak request

### Debug Mode
```bash
# Enable verbose logging
python machine_simulator.py 2>&1 | tee simulator.log
```

## 📈 Monitoring

### Check Machine Status
```bash
# GET all machines status
curl http://localhost:3000/api/v1/machines/status

# GET specific machine data
curl http://localhost:3000/api/v1/machines/MCH-001/latest
```

### Analytics
```bash
# Get streaming analytics
curl http://localhost:3000/api/v1/analytics
```

## ⚙️ Configuration

### Environment Variables
```bash
# Simulator settings
MACHINE_INTERVAL=5      # Seconds between data sends
ANOMALY_CHANCE=0.1      # 10% chance of anomalies
LOG_LEVEL=INFO          # Logging level
```

### Backend Configuration
```bash
# In backend/.env
RATE_LIMIT_WINDOW_MS=60000  # 1 minute
RATE_LIMIT_MAX_REQUESTS=300 # 300 requests/minute
```

## 🔧 Development

### Adding New Machines
```python
{
    "machine_id": "MCH-004",
    "name": "Quality Control",
    "location": "qc_area",
    "base_metrics": {
        "temperature": 22.0,
        "pressure": 85.0,
        "vibration": 0.3,
        "efficiency": 98.0,
        "power_consumption": 25.0
    },
    "production_count": 0,
    "status": "active",
    "error_probability": 0.01
}
```

### Custom Metrics
```python
# Tambahkan metric baru di base_metrics
base_metrics["custom_metric"] = 100.0

# Generate realistic variations
metrics["custom_metric"] = round(
    base["custom_metric"] + random.uniform(-10, 10),
    2
)
```

## 📝 Push vs Pull Ingestion

### Push Ingestion (✅ Recommended untuk use case ini)
**Advantages:**
- Real-time data collection
- Efficient untuk high-frequency data
- Machine doesn't need to maintain connection state
- Lower latency
- Better untuk time-series data

**Disadvantages:**
- Backend handles high request volume
- Need rate limiting
- Potential data loss if backend down

### Pull Polling
**Advantages:**
- Backend controls frequency
- Easier rate limiting
- Better untuk low-frequency data

**Disadvantages:**
- Higher latency
- Machine maintains state
- Not real-time
- Inefficient untuk streaming data

**Decision**: Push ingestion lebih cocok karena:
- Real-time monitoring requirements
- High-frequency sensor data (every 5 seconds)
- Time-critical alerts and anomalies
- Multiple machines streaming simultaneously

## 🎯 Next Steps

1. **Dashboard Integration**: Connect ke real-time dashboard
2. **Alert System**: Implement notification untuk critical anomalies
3. **Database Integration**: Store historical data untuk analytics
4. **Machine Learning**: Predictive maintenance algorithms
5. **WebSockets**: Real-time updates ke frontend
6. **Load Testing**: Stress test dengan lebih banyak mesin