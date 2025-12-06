# Predictive Machine Copilot Backend API

Backend API untuk sistem Predictive Machine Copilot dengan AI Chatbot dan Real-time Machine Monitoring menggunakan Express.js, Langchain, dan Google Gemini.

## Features

- **AI Chatbot**: Powered by Langchain and Google Gemini untuk machine assistance
- **Machine Monitoring**: Real-time streaming data dari factory machines
- **Predictive Analytics**: Alert system untuk machine anomalies
- **Ticketing System**: Complete maintenance ticket management dengan CRUD operations
- **Data Streaming**: Real-time machine data ingestion dengan rate limiting
- **Real-time Chat**: Session-based conversation management
- **Analytics**: Comprehensive machine performance dan ticket statistics
- **Validation**: Request validation dengan Joi
- **Rate Limiting**: Built-in protection against abuse
- **Security**: Helmet.js untuk security headers

## Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- Google Gemini API Key
- Python 3.7+ (untuk machine simulator)

## Installation

1. Clone repository:
```bash
cd backend
```

2. Install Node.js dependencies:
```bash
npm install
```

3. Copy environment variables:
```bash
cp .env.example .env
```

4. Update `.env` file dengan konfigurasi Anda:
```
GEMINI_API_KEY=your_gemini_api_key_here
PORT=3000
NODE_ENV=development
```

5. Start the server:
```bash
# Development
npm run dev

# Production
npm start
```

6. Setup Machine Simulator (opsional):
```bash
cd simulator
pip install -r requirements.txt
python machine_simulator.py
```

## API Endpoints

### General
- `GET /api` - API information
- `GET /api/status` - API status check
- `GET /health` - Health check

### AI Chatbot
- `POST /api/chatbot/chat` - Chat dengan AI untuk machine assistance
- `GET /api/chatbot/history/:sessionId` - Get chat history
- `DELETE /api/chatbot/session/:sessionId` - Clear chat session
- `GET /api/chatbot/config` - Get chatbot configuration

### Machine Data Streaming
- `POST /api/v1/ingest` - Receive streaming data dari machines
- `GET /api/v1/machines/status` - Get all machines real-time status
- `GET /api/v1/machines/:id/latest` - Get latest machine data
- `GET /api/v1/machines/:id/history` - Get machine historical data
- `GET /api/v1/analytics` - Get streaming analytics

### Maintenance Ticketing
- `POST /api/ticketing/tickets` - Create new maintenance ticket
- `GET /api/ticketing/tickets` - Get all tickets (dengan filters)
- `GET /api/ticketing/tickets/:id` - Get ticket by ID
- `PUT /api/ticketing/tickets/:id` - Update ticket
- `DELETE /api/ticketing/tickets/:id` - Delete ticket
- `POST /api/ticketing/tickets/:id/comments` - Add comment ke ticket
- `GET /api/ticketing/analytics` - Get ticket analytics
- `GET /api/ticketing/categories` - Get ticket categories

## Machine Simulator

Python script yang mensimulasikan 3 factory machines mengirimkan data streaming setiap 5 detik.

### Run Simulator
```bash
cd backend/simulator
pip install -r requirements.txt

# Normal mode (continuous)
python machine_simulator.py

# Test mode (single payload)
python machine_simulator.py --test

# Custom backend URL
python machine_simulator.py --url http://localhost:3000
```

### Simulated Machines
- **MCH-001**: CNC Machine A (factory_floor_north)
- **MCH-002**: CNC Machine B (factory_floor_south)
- **MCH-003**: CNC Machine C (factory_floor_east)

## Postman Collection

1. Import Postman collection:
   - File: `postman/Predictive-Machine-Copilot-API.postman_collection.json`
   - Environment: `postman/Predictive-Machine-Copilot-Environment.postman_environment.json`

2. Set environment variables di Postman:
   - `baseUrl`: http://localhost:3000/api
   - Update dengan server URL Anda jika berbeda

## Project Structure

```
backend/
├── src/
│   ├── controllers/          # Route controllers
│   │   ├── chatbotController.js
│   │   ├── ticketingController.js
│   │   └── streamingController.js
│   ├── middleware/           # Custom middleware
│   │   ├── errorHandler.js
│   │   ├── notFound.js
│   │   └── validation.js
│   ├── routes/              # API routes
│   │   ├── index.js
│   │   ├── chatbot.js
│   │   ├── ticketing.js
│   │   └── streaming.js
│   ├── services/            # Business logic services
│   │   └── aiAgent.js
│   └── app.js              # Express app configuration
├── simulator/               # Machine data simulator
│   ├── machine_simulator.py
│   ├── requirements.txt
│   └── README.md
├── postman/                 # Postman collections
│   ├── Predictive-Machine-Copilot-API.postman_collection.json
│   └── Predictive-Machine-Copilot-Environment.postman_environment.json
├── .env.example            # Environment variables template
├── package.json
└── README.md
```

## Usage Examples

### Chat dengan AI untuk Machine Assistance
```bash
curl -X POST http://localhost:3000/api/chatbot/chat \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Machine MCH-001 menunjukkan temperature tinggi, apa yang harus saya lakukan?"
  }'
```

### Machine Data Streaming (Based on AI4I 2020 Dataset)
```bash
curl -X POST http://localhost:3000/api/v1/ingest \
  -H "Content-Type: application/json" \
  -d '{
    "machine_id": "MCH-001",
    "metrics": {
      "air_temperature": 298.5,
      "process_temperature": 308.7,
      "rotational_speed": 2860,
      "torque": 42.3,
      "tool_wear": 120,
      "quality_variant": "M",
      "machine_failure": false
    },
    "status": "active",
    "location": "factory_floor_north"
  }'
```

### Get Machine Status
```bash
curl http://localhost:3000/api/v1/machines/status
```

### Create Maintenance Ticket
```bash
curl -X POST http://localhost:3000/api/ticketing/tickets \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Temperature tinggi di MCH-001",
    "description": "Machine menunjukkan temperature 85°C, melebihi normal operating temperature",
    "category": "technical",
    "priority": "high",
    "requesterName": "Operator John",
    "requesterEmail": "john@factory.com"
  }'
```

## Error Handling

API returns consistent error responses:

```json
{
  "success": false,
  "error": "Error message description"
}
```

Common status codes:
- `200` - Success
- `201` - Created
- `400` - Bad Request (validation error)
- `404` - Not Found
- `429` - Too Many Requests (rate limit)
- `500` - Internal Server Error

## Rate Limiting

- Default: 100 requests per 15 minutes per IP
- Streaming endpoint: 300 requests per minute (untuk real-time data)
- Configurable via environment variables

## Security Features

- Helmet.js untuk security headers
- Request body size limits
- Input validation dengan Joi
- CORS configuration
- Rate limiting dengan express-rate-limit

## Machine Data Format

### Streaming Data Payload (Based on AI4I 2020 Dataset)
```json
{
  "machine_id": "MCH-001",
  "timestamp": "2025-12-06T10:30:00Z",
  "metrics": {
    "air_temperature": 298.5,
    "process_temperature": 308.7,
    "rotational_speed": 2860,
    "torque": 42.3,
    "tool_wear": 120,
    "quality_variant": "M",
    "machine_failure": false,
    "failure_mode": null
  },
  "status": "active",
  "location": "factory_floor_north"
}
```

### Metrics Description
- **air_temperature**: Air temperature in Kelvin (random walk, σ = 2K around 300K)
- **process_temperature**: Process temperature in Kelvin (air temp + 10K, σ = 1K)
- **rotational_speed**: Calculated from power (2860W) with noise (rpm)
- **torque**: Torque in Newton-meters (μ = 40Nm, σ = 10Nm, no negative values)
- **tool_wear**: Tool wear in minutes (H: +5min, M: +3min, L: +2min per cycle)
- **quality_variant**: Quality variant (H/M/L) affects tool wear rate
- **machine_failure**: Boolean indicating if machine has failed
- **failure_mode**: Type of failure (tool_wear_failure, heat_dissipation_failure, power_failure, overstrain_failure, random_failure)

### Alert Conditions
- Air temperature > 320K (47°C) - Warning
- Process temperature > 340K (67°C) - Critical
- Rotational speed > 3500 rpm - Warning
- Torque > 60 Nm - Critical
- Tool wear > 240 minutes (4 hours) - Warning
- Machine failure - Critical

## Development

### Running Tests
```bash
npm test
```

### Environment Variables
Copy `.env.example` ke `.env` dan update:
- `GEMINI_API_KEY`: Required untuk AI chatbot
- `PORT`: Server port (default: 3000)
- `NODE_ENV`: Environment (development/production)
- `RATE_LIMIT_*`: Rate limiting configuration

### Machine Simulator Development
```bash
cd simulator
python machine_simulator.py --test  # Test dengan single payload
```

## Simulator Features

### Industrial IoT Metrics
- **Realistic Temperature Simulation**: Random walk process with standard deviations
- **Power-Based RPM Calculation**: Based on actual motor power specifications
- **Gaussian Torque Distribution**: Statistically accurate torque generation
- **Tool Wear Accumulation**: Different rates based on quality variants
- **Multiple Failure Modes**: 5 realistic failure scenarios

### Machine Behaviors
- **Temperature Drift**: Gradual temperature changes over time
- **Wear Accumulation**: Progressive tool wear based on usage
- **Maintenance Cycles**: Automatic maintenance and recovery
- **Failure Probability**: Random failure events with configurable rates

### Quality Variants
- **H (High)**: +5 minutes tool wear per cycle
- **M (Medium)**: +3 minutes tool wear per cycle
- **L (Low)**: +2 minutes tool wear per cycle

## Future Enhancements

- [ ] Database integration (PostgreSQL/MongoDB)
- [ ] Redis untuk session storage
- [ ] JWT authentication
- [ ] WebSocket support untuk real-time updates
- [ ] Machine learning untuk predictive maintenance
- [ ] Advanced analytics dashboard API
- [ ] Email/SMS notifications untuk alerts
- [ ] File upload support untuk machine documents
- [ ] API documentation dengan Swagger
- [ ] Unit dan integration tests
- [ ] Docker support
- [ ] Kubernetes deployment

## License

MIT License