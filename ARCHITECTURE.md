# System Architecture

## Overview

The Smart Load Distribution Analyzer follows a clean, layered architecture with clear separation of concerns. The system is built using TypeScript, Express.js, and PostgreSQL with Prisma ORM.

## Architecture Layers

```
┌─────────────────────────────────────────────────────────┐
│                    Client Layer                          │
│              (Frontend Applications)                     │
└─────────────────────────────────────────────────────────┘
                          ↓ HTTP/REST
┌─────────────────────────────────────────────────────────┐
│                   API Gateway Layer                      │
│         (Express.js + Middleware Stack)                  │
│  • Authentication • Rate Limiting • Validation           │
│  • Error Handling • Audit Logging • CORS                 │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│                  Controller Layer                        │
│         (Request/Response Handling)                      │
│  • AuthController • LandSurveyController                 │
│  • BuildingInputController • AnalysisController          │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│                   Service Layer                          │
│            (Business Logic)                              │
│  ┌──────────────────────────────────────────────────┐   │
│  │  Core Services                                    │   │
│  │  • AuthService • AnalysisService                 │   │
│  └──────────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────┐   │
│  │  Engineering Services                             │   │
│  │  • WindService • EarthquakeService               │   │
│  │  • FloodService • CycloneService                 │   │
│  │  • LoadAnalysisService • VastuService            │   │
│  └──────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│                  Data Access Layer                       │
│              (Prisma ORM)                                │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│                   Database Layer                         │
│                 (PostgreSQL)                             │
└─────────────────────────────────────────────────────────┘
```

## Component Details

### 1. API Gateway Layer

**Responsibilities:**
- Request routing
- Authentication & authorization
- Input validation
- Rate limiting
- Error handling
- Audit logging
- Security headers

**Key Components:**
- `auth.middleware.ts` - JWT authentication
- `validation.middleware.ts` - Zod schema validation
- `error.middleware.ts` - Centralized error handling
- `rateLimit.middleware.ts` - Request throttling
- `audit.middleware.ts` - Activity logging

### 2. Controller Layer

**Responsibilities:**
- HTTP request/response handling
- Input extraction
- Service orchestration
- Response formatting

**Controllers:**
- `AuthController` - User authentication
- `LandSurveyController` - Survey data management
- `BuildingInputController` - Building specifications
- `WindController` - Wind data management
- `AnalysisController` - Analysis orchestration

### 3. Service Layer

#### Core Services

**AuthService**
- User registration and login
- JWT token generation
- Password hashing
- Token refresh

**AnalysisService**
- Orchestrates all analysis engines
- Combines results from multiple services
- Generates comprehensive reports
- Calculates composite scores

#### Engineering Services

**WindService**
- IS 875 Part 3 calculations
- Wind pressure computation
- Wind load analysis
- Aerodynamic recommendations
- Ventilation strategies

**EarthquakeService**
- IS 1893 compliance
- Base shear calculation
- Seismic zone analysis
- Soft-story detection
- Shear wall placement logic

**FloodService**
- Plinth height calculation
- Drainage slope determination
- Basement feasibility assessment
- Water-resistant material recommendations

**CycloneService**
- Vortex shedding risk assessment
- Pressure zone analysis
- Shape optimization
- Coastal considerations

**LoadAnalysisService**
- Dead load calculation (IS 875 Part 1)
- Live load calculation (IS 875 Part 2)
- Height classification
- Foundation recommendations
- Structural element sizing

**VastuService**
- Entrance direction evaluation
- Room placement analysis
- Height balance checking
- Wind-Vastu compatibility
- Violation detection
- Correction suggestions

### 4. Data Access Layer

**Prisma ORM:**
- Type-safe database queries
- Automatic migrations
- Connection pooling
- Query optimization
- Transaction management

### 5. Database Layer

**PostgreSQL Schema:**
- Users & authentication
- Land surveys
- Building inputs
- Wind data
- Disaster analysis
- Vastu reports
- Final reports
- Audit logs

## Data Flow

### Complete Analysis Workflow

```
1. User Authentication
   ↓
2. Create Land Survey
   ↓
3. Create Building Input
   ↓
4. Add Wind Data (optional)
   ↓
5. Trigger Disaster Analysis
   ├─→ Load Analysis
   ├─→ Wind Analysis
   ├─→ Earthquake Analysis
   ├─→ Flood Analysis
   └─→ Cyclone Analysis
   ↓
6. Trigger Vastu Analysis
   ├─→ Entrance evaluation
   ├─→ Room placement
   ├─→ Height balance
   └─→ Wind compatibility
   ↓
7. Generate Final Report
   ├─→ Composite scoring
   ├─→ Risk analysis
   ├─→ Recommendations
   └─→ Report generation
```

## Engineering Calculation Modules

### Wind Analysis Module

**Inputs:**
- Wind speed (average & peak)
- Wind direction
- Terrain roughness
- Building dimensions

**Calculations:**
- Design wind speed: `Vz = V × k2 × k3`
- Wind pressure: `pz = 0.6 × Vz²`
- Wind load: `F = pz × A × Cf`

**Outputs:**
- Wind pressure (kN/m²)
- Wind load (kN)
- Optimal orientation
- Aerodynamic form
- Ventilation strategy

### Earthquake Analysis Module

**Inputs:**
- Seismic zone
- Building height & weight
- Structural system
- Soil type

**Calculations:**
- Zone factor (Z)
- Response reduction factor (R)
- Base shear: `Vb = (Z × I × Sa/g × W) / (2 × R)`

**Outputs:**
- Base shear (kN)
- Safety score (0-100)
- Soft-story detection
- Shear wall requirements

### Flood Analysis Module

**Inputs:**
- Flood risk level
- Water table depth
- Soil type
- Rainfall data

**Calculations:**
- Minimum plinth height
- Drainage slope
- Basement feasibility

**Outputs:**
- Plinth height (m)
- Drainage slope (%)
- Material recommendations
- Safety measures

### Load Analysis Module

**Inputs:**
- Building type
- Floor count & height
- Built-up area
- Structural system

**Calculations:**
- Dead load: `DL = (structural + walls + finishes) × area × floors`
- Live load: `LL = intensity × area × floors`
- Total load: `TL = DL + LL + WL + EL`

**Outputs:**
- Load breakdown
- Foundation type
- Column spacing
- Beam sizing

### Vastu Analysis Module

**Inputs:**
- Plot shape
- Orientation
- Entrance direction
- Building height

**Logic:**
- Auspicious directions: North, North-East, East
- Kitchen: South-East or North-West
- Bedroom: South-West
- Staircase: South, West, South-West
- Water: North-East

**Outputs:**
- Compliance score (0-100)
- Violations list
- Corrections
- Wind compatibility

## Security Architecture

### Authentication Flow

```
1. User Login
   ↓
2. Validate Credentials
   ↓
3. Generate JWT Access Token (1h expiry)
   ↓
4. Generate Refresh Token (7d expiry)
   ↓
5. Return Tokens to Client
   ↓
6. Client Stores Tokens
   ↓
7. Subsequent Requests Include Access Token
   ↓
8. Middleware Validates Token
   ↓
9. If Expired, Use Refresh Token
   ↓
10. Generate New Access Token
```

### Security Layers

1. **Transport Security**
   - HTTPS/TLS encryption
   - Secure headers (Helmet.js)

2. **Authentication**
   - JWT tokens
   - Password hashing (bcrypt)
   - Token expiration

3. **Authorization**
   - Role-based access control
   - Resource ownership validation

4. **Input Validation**
   - Zod schema validation
   - SQL injection prevention (Prisma)
   - XSS protection

5. **Rate Limiting**
   - API rate limits
   - Authentication attempt limits

6. **Audit Logging**
   - All critical operations logged
   - User activity tracking

## Scalability Considerations

### Horizontal Scaling

- Stateless API design
- JWT for distributed auth
- Database connection pooling
- Load balancer ready

### Vertical Scaling

- Efficient database queries
- Indexed database fields
- Optimized calculations
- Caching strategies (future)

### Performance Optimization

- Prisma query optimization
- Batch operations
- Async/await patterns
- Compression middleware

## Error Handling Strategy

### Error Types

1. **Validation Errors** (400)
   - Zod validation failures
   - Input format errors

2. **Authentication Errors** (401)
   - Invalid credentials
   - Expired tokens

3. **Authorization Errors** (403)
   - Insufficient permissions
   - Resource access denied

4. **Not Found Errors** (404)
   - Resource doesn't exist

5. **Conflict Errors** (409)
   - Duplicate resources

6. **Server Errors** (500)
   - Unexpected failures
   - Database errors

### Error Response Format

```json
{
  "status": "error",
  "message": "Human-readable error message",
  "errors": [
    {
      "field": "fieldName",
      "message": "Specific error"
    }
  ]
}
```

## Monitoring & Logging

### Logging Levels

- **ERROR**: System failures, exceptions
- **WARN**: Potential issues, deprecations
- **INFO**: Important events, API calls
- **DEBUG**: Detailed debugging information

### Log Destinations

- Console (development)
- File system (production)
- External services (future: ELK, Datadog)

### Metrics to Monitor

- Request rate
- Response time
- Error rate
- Database query performance
- Memory usage
- CPU usage

## Future Enhancements

### Phase 2
- PDF report generation
- Email notifications
- Real-time analysis updates
- Caching layer (Redis)

### Phase 3
- Machine learning integration
- Historical data analysis
- Predictive modeling
- 3D visualization API

### Phase 4
- Multi-language support
- Mobile app backend
- GraphQL API
- Microservices architecture

## Code Standards

### TypeScript
- Strict mode enabled
- Explicit types
- Interface definitions
- No `any` types

### Naming Conventions
- camelCase for variables/functions
- PascalCase for classes/interfaces
- UPPER_CASE for constants
- Descriptive names

### File Organization
- One class per file
- Grouped by feature
- Clear folder structure
- Index files for exports

### Documentation
- JSDoc comments for public APIs
- README for each module
- API documentation
- Architecture diagrams
