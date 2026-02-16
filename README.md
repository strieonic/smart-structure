<<<<<<< HEAD
# Smart Load Distribution Analyzer

A production-ready backend system for AI-powered civil engineering analysis, providing disaster-resilient, structurally sound, and Vastu-compliant building recommendations for India.

## 🏗️ Features

### Core Modules

1. **Authentication & Authorization**
   - JWT-based authentication
   - Role-based access control (USER, ENGINEER, ADMIN)
   - Refresh token mechanism
   - Rate limiting and audit logging

2. **Land & Survey Analysis**
   - Geolocation-based analysis
   - Soil type classification
   - Seismic zone assessment (IS 1893)
   - Flood risk evaluation
   - Water table depth analysis

3. **Building Input Management**
   - Multiple building types support
   - Structural system selection
   - Orientation analysis
   - Floor-wise specifications

4. **Wind Flow & Aerodynamics**
   - IS 875 Part 3 compliant calculations
   - Wind pressure and load analysis
   - Optimal orientation recommendations
   - Aerodynamic form suggestions
   - Natural ventilation strategies

5. **Load Analysis**
   - Dead load calculation (IS 875 Part 1)
   - Live load calculation (IS 875 Part 2)
   - Height-based classification
   - Foundation type recommendations
   - Column spacing and beam sizing logic

6. **Disaster-Specific Engines**
   - **Earthquake Engine**: Base shear, soft-story detection, shear wall placement
   - **Flood Engine**: Plinth height, drainage slope, basement feasibility
   - **Cyclone Engine**: Vortex shedding risk, pressure zones, shape optimization

7. **Vastu Shastra Analysis**
   - Entrance direction evaluation
   - Room placement recommendations
   - Water tank and borewell positioning
   - Staircase compliance
   - Wind-Vastu compatibility
   - Violation detection and corrections

8. **AI Recommendation Engine**
   - Composite safety scoring
   - Cost-efficiency analysis
   - Sustainability assessment
   - Integrated recommendations

9. **Report Generation**
   - Comprehensive JSON reports
   - Survey summaries
   - Risk analysis
   - Structural logic
   - Vastu compliance
   - Final recommendations

## 🛠️ Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Language**: TypeScript
- **Database**: PostgreSQL
- **ORM**: Prisma
- **Authentication**: JWT
- **Validation**: Zod
- **Logging**: Winston
- **Security**: Helmet, CORS, Rate Limiting

## 📁 Project Structure

```
smart-load-distribution-analyzer/
├── prisma/
│   └── schema.prisma          # Database schema
├── src/
│   ├── config/
│   │   ├── database.ts        # Prisma client
│   │   └── logger.ts          # Winston logger
│   ├── controllers/
│   │   ├── auth.controller.ts
│   │   ├── landSurvey.controller.ts
│   │   ├── buildingInput.controller.ts
│   │   ├── wind.controller.ts
│   │   └── analysis.controller.ts
│   ├── middleware/
│   │   ├── auth.middleware.ts
│   │   ├── error.middleware.ts
│   │   ├── validation.middleware.ts
│   │   ├── rateLimit.middleware.ts
│   │   └── audit.middleware.ts
│   ├── routes/
│   │   ├── auth.routes.ts
│   │   ├── landSurvey.routes.ts
│   │   ├── buildingInput.routes.ts
│   │   ├── wind.routes.ts
│   │   ├── analysis.routes.ts
│   │   └── index.ts
│   ├── services/
│   │   ├── auth.service.ts
│   │   ├── wind.service.ts
│   │   ├── earthquake.service.ts
│   │   ├── flood.service.ts
│   │   ├── cyclone.service.ts
│   │   ├── loadAnalysis.service.ts
│   │   ├── vastu.service.ts
│   │   └── analysis.service.ts
│   ├── validators/
│   │   ├── auth.validator.ts
│   │   ├── landSurvey.validator.ts
│   │   └── buildingInput.validator.ts
│   ├── types/
│   │   └── express.d.ts
│   ├── app.ts
│   └── server.ts
├── .env.example
├── .gitignore
├── package.json
├── tsconfig.json
└── README.md
```

## 🚀 Getting Started

### Prerequisites

- Node.js (v18 or higher)
- PostgreSQL (v14 or higher)
- npm or yarn

### Installation

1. Clone the repository
```bash
git clone <repository-url>
cd smart-load-distribution-analyzer
```

2. Install dependencies
```bash
npm install
```

3. Set up environment variables
```bash
cp .env.example .env
# Edit .env with your configuration
```

4. Set up the database
```bash
# Generate Prisma client
npm run prisma:generate

# Run migrations
npm run prisma:migrate
```

5. Start the development server
```bash
npm run dev
```

The server will start on `http://localhost:5000`

## 📚 API Documentation

### Base URL
```
http://localhost:5000/api/v1
```

### Authentication Endpoints

#### Register User
```http
POST /auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "securePassword123",
  "name": "John Doe",
  "role": "USER"
}
```

#### Login
```http
POST /auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "securePassword123"
}
```

Response:
```json
{
  "status": "success",
  "data": {
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "name": "John Doe",
      "role": "USER"
    },
    "accessToken": "jwt-token",
    "refreshToken": "refresh-token"
  }
}
```

### Land Survey Endpoints

#### Create Land Survey
```http
POST /land-surveys
Authorization: Bearer <token>
Content-Type: application/json

{
  "latitude": 28.6139,
  "longitude": 77.2090,
  "plotArea": 500,
  "soilType": "CLAY",
  "slope": 2.5,
  "elevation": 250,
  "waterTableDepth": 8.5,
  "seismicZone": "ZONE_IV",
  "floodRisk": "MEDIUM",
  "nearbyWaterBodies": true,
  "waterBodyDistance": 500,
  "averageRainfall": 1200
}
```

#### Get All Land Surveys
```http
GET /land-surveys
Authorization: Bearer <token>
```

#### Get Land Survey by ID
```http
GET /land-surveys/:id
Authorization: Bearer <token>
```

### Building Input Endpoints

#### Create Building Input
```http
POST /building-inputs
Authorization: Bearer <token>
Content-Type: application/json

{
  "landSurveyId": "uuid",
  "buildingType": "RESIDENTIAL",
  "totalFloors": 10,
  "floorHeight": 3.0,
  "totalHeight": 30.0,
  "builtUpArea": 5000,
  "orientation": "NORTH_EAST",
  "structuralSystem": "RCC",
  "basementFloors": 1,
  "parkingFloors": 2,
  "expectedOccupancy": 100
}
```

### Wind Data Endpoints

#### Create Wind Data
```http
POST /wind
Authorization: Bearer <token>
Content-Type: application/json

{
  "buildingInputId": "uuid",
  "windDirection": 45,
  "averageWindSpeed": 25,
  "peakGustSpeed": 40,
  "terrainRoughness": "CATEGORY_2"
}
```

### Analysis Endpoints

#### Perform Disaster Analysis
```http
POST /analysis/disaster/:buildingInputId
Authorization: Bearer <token>
```

Response:
```json
{
  "status": "success",
  "message": "Disaster analysis completed",
  "data": {
    "id": "uuid",
    "deadLoad": 27500.00,
    "liveLoad": 10000.00,
    "windLoad": 1250.50,
    "seismicLoad": 3500.00,
    "totalLoad": 42250.50,
    "heightCategory": "MID_RISE",
    "recommendedFoundation": "RAFT",
    "foundationDepth": 2.5,
    "columnSpacing": 6.0,
    "beamSizing": "Primary beams: 300mm x 600mm...",
    "shearWallRequired": true,
    "earthquakeSafetyScore": 75.5,
    "baseShear": 3500.00,
    "softStoryDetected": false,
    "minimumPlinthHeight": 0.90,
    "drainageSlope": 2.5,
    "basementFeasible": true,
    "vortexSheddingRisk": "MEDIUM",
    "heightToWidthRatio": 4.24
  }
}
```

#### Perform Vastu Analysis
```http
POST /analysis/vastu/:buildingInputId
Authorization: Bearer <token>
```

Response:
```json
{
  "status": "success",
  "message": "Vastu analysis completed",
  "data": {
    "id": "uuid",
    "vastuComplianceScore": 85.0,
    "overallCompliance": "EXCELLENT",
    "entranceSuitability": "EXCELLENT - Highly auspicious as per Vastu",
    "kitchenZoneCompliance": true,
    "bedroomZoneCompliance": true,
    "staircaseCompliance": true,
    "waterTankDirection": "NORTH_EAST (most auspicious) or NORTH or EAST",
    "borewellDirection": "NORTH_EAST (highly recommended) or NORTH",
    "windVastuCompatibility": "EXCELLENT - Wind and Vastu alignment optimal",
    "violations": [],
    "corrections": []
  }
}
```

#### Generate Final Report
```http
POST /analysis/report/:buildingInputId
Authorization: Bearer <token>
```

Response:
```json
{
  "status": "success",
  "message": "Final report generated",
  "data": {
    "id": "uuid",
    "overallSafetyScore": 78.5,
    "costEfficiencyScore": 75.0,
    "sustainabilityScore": 80.0,
    "vastuScore": 85.0,
    "surveySummary": { ... },
    "riskAnalysis": { ... },
    "structuralLogic": { ... },
    "vastuSummary": { ... },
    "finalRecommendations": { ... }
  }
}
```

## 🔬 Engineering Calculations

### Wind Load (IS 875 Part 3)
- Design wind speed: Vz = V × k2 × k3
- Wind pressure: pz = 0.6 × Vz²
- Wind load: F = pz × A × Cf

### Earthquake Load (IS 1893)
- Base shear: Vb = (Z × I × Sa/g × W) / (2 × R)
- Zone factors: II (0.10), III (0.16), IV (0.24), V (0.36)

### Load Analysis (IS 875)
- Dead load: Structural weight + walls + finishes
- Live load: Based on building occupancy type
- Total load: DL + LL + WL + EL

## 🔒 Security Features

- JWT authentication with refresh tokens
- Password hashing with bcrypt
- Rate limiting on sensitive endpoints
- Helmet.js for HTTP headers security
- CORS configuration
- Input validation with Zod
- SQL injection prevention (Prisma ORM)
- Audit logging for all critical operations

## 📊 Database Schema

The system uses PostgreSQL with Prisma ORM. Key entities:

- **Users**: Authentication and authorization
- **LandSurveys**: Site and soil data
- **BuildingInputs**: Building specifications
- **WindData**: Wind analysis parameters
- **DisasterAnalysis**: Comprehensive structural analysis
- **VastuReports**: Vastu compliance reports
- **FinalReports**: Integrated recommendations
- **AuditLogs**: System activity tracking

## 🧪 Testing

```bash
# Run tests (when implemented)
npm test

# Run with coverage
npm run test:coverage
```

## 📦 Deployment

### Using Docker (Optional)

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
EXPOSE 5000
CMD ["npm", "start"]
```

### Environment Variables for Production

```env
NODE_ENV=production
PORT=5000
DATABASE_URL=postgresql://user:password@host:5432/dbname
JWT_SECRET=your-production-secret
JWT_REFRESH_SECRET=your-refresh-secret
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Open a Pull Request

## 📄 License

MIT License

## 👥 Authors

Civil Engineering Intelligence Team

## 🙏 Acknowledgments

- IS 875 (Indian Standard for Design Loads)
- IS 1893 (Criteria for Earthquake Resistant Design)
- IS 13920 (Ductile Detailing of RC Structures)
- National Building Code of India
- Vastu Shastra principles

## 📞 Support

For support, email support@smartloadanalyzer.com or open an issue in the repository.
=======
# smart-structure
>>>>>>> 2331b3fcac4dbcfb8c98233a2e416373905c5f08
