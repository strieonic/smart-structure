# Folder Structure Explanation

## Root Directory

```
smart-load-distribution-analyzer/
├── prisma/                 # Database schema and migrations
├── src/                    # Source code
├── dist/                   # Compiled JavaScript (generated)
├── logs/                   # Application logs (generated)
├── node_modules/           # Dependencies (generated)
├── .env                    # Environment variables (create from .env.example)
├── .env.example            # Environment template
├── .gitignore              # Git ignore rules
├── package.json            # Project dependencies and scripts
├── tsconfig.json           # TypeScript configuration
├── README.md               # Project documentation
├── ARCHITECTURE.md         # System architecture details
├── DEPLOYMENT.md           # Deployment guide
├── API_EXAMPLES.md         # API usage examples
└── FOLDER_STRUCTURE.md     # This file
```

## Prisma Directory

```
prisma/
└── schema.prisma           # Database schema definition
    ├── Models:
    │   ├── User            # User authentication
    │   ├── AuditLog        # Activity tracking
    │   ├── LandSurvey      # Site survey data
    │   ├── BuildingInput   # Building specifications
    │   ├── WindData        # Wind analysis data
    │   ├── DisasterAnalysis # Structural analysis results
    │   ├── VastuReport     # Vastu compliance reports
    │   └── FinalReport     # Comprehensive reports
    └── Enums:
        ├── UserRole
        ├── SoilType
        ├── SeismicZone
        ├── FloodRisk
        ├── BuildingType
        ├── StructuralSystem
        ├── Orientation
        ├── FoundationType
        └── HeightCategory
```

## Source Directory

```
src/
├── config/                 # Configuration files
│   ├── database.ts         # Prisma client setup
│   └── logger.ts           # Winston logger configuration
│
├── controllers/            # Request handlers
│   ├── auth.controller.ts          # Authentication endpoints
│   ├── landSurvey.controller.ts    # Land survey CRUD
│   ├── buildingInput.controller.ts # Building input CRUD
│   ├── wind.controller.ts          # Wind data management
│   └── analysis.controller.ts      # Analysis orchestration
│
├── middleware/             # Express middleware
│   ├── auth.middleware.ts          # JWT authentication
│   ├── error.middleware.ts         # Error handling
│   ├── validation.middleware.ts    # Input validation
│   ├── rateLimit.middleware.ts     # Rate limiting
│   └── audit.middleware.ts         # Audit logging
│
├── routes/                 # API route definitions
│   ├── auth.routes.ts              # /api/v1/auth/*
│   ├── landSurvey.routes.ts        # /api/v1/land-surveys/*
│   ├── buildingInput.routes.ts     # /api/v1/building-inputs/*
│   ├── wind.routes.ts              # /api/v1/wind/*
│   ├── analysis.routes.ts          # /api/v1/analysis/*
│   └── index.ts                    # Route aggregation
│
├── services/               # Business logic
│   ├── auth.service.ts             # Authentication logic
│   ├── analysis.service.ts         # Analysis orchestration
│   ├── wind.service.ts             # Wind calculations (IS 875)
│   ├── earthquake.service.ts       # Seismic analysis (IS 1893)
│   ├── flood.service.ts            # Flood risk assessment
│   ├── cyclone.service.ts          # Cyclone analysis
│   ├── loadAnalysis.service.ts     # Load calculations
│   └── vastu.service.ts            # Vastu Shastra logic
│
├── validators/             # Zod validation schemas
│   ├── auth.validator.ts           # Auth input validation
│   ├── landSurvey.validator.ts     # Survey input validation
│   └── buildingInput.validator.ts  # Building input validation
│
├── types/                  # TypeScript type definitions
│   └── express.d.ts                # Express type extensions
│
├── app.ts                  # Express app configuration
└── server.ts               # Server entry point
```

## Detailed Component Breakdown

### Config Directory

**database.ts**
- Initializes Prisma client
- Configures connection pooling
- Sets up query logging
- Handles database events

**logger.ts**
- Winston logger setup
- Log levels configuration
- File and console transports
- Log formatting

### Controllers Directory

**Purpose:** Handle HTTP requests and responses

**auth.controller.ts**
- `register()` - User registration
- `login()` - User authentication
- `refreshToken()` - Token refresh

**landSurvey.controller.ts**
- `create()` - Create land survey
- `getAll()` - List user's surveys
- `getById()` - Get specific survey
- `update()` - Update survey data
- `delete()` - Delete survey

**buildingInput.controller.ts**
- `create()` - Create building input
- `getById()` - Get building details
- `update()` - Update building data

**wind.controller.ts**
- `create()` - Add wind data
- `getByBuildingId()` - Get wind analysis

**analysis.controller.ts**
- `performDisasterAnalysis()` - Run structural analysis
- `performVastuAnalysis()` - Run Vastu analysis
- `generateFinalReport()` - Create comprehensive report
- `getDisasterAnalysis()` - Retrieve disaster analysis
- `getVastuReport()` - Retrieve Vastu report
- `getFinalReport()` - Retrieve final report

### Middleware Directory

**auth.middleware.ts**
- `authenticate()` - Verify JWT token
- `authorize()` - Check user roles

**error.middleware.ts**
- `AppError` class - Custom error type
- `errorHandler()` - Centralized error handling
- Handles Zod, Prisma, and custom errors

**validation.middleware.ts**
- `validate()` - Zod schema validation
- Validates request body, query, params

**rateLimit.middleware.ts**
- `apiLimiter` - General API rate limiting
- `authLimiter` - Authentication rate limiting

**audit.middleware.ts**
- `auditLog()` - Log user actions
- Captures request details
- Stores in database

### Routes Directory

**Purpose:** Define API endpoints and apply middleware

Each route file:
- Imports controller
- Applies authentication
- Applies validation
- Applies audit logging
- Defines HTTP methods

**Route Structure:**
```
/api/v1/
├── /auth
│   ├── POST /register
│   ├── POST /login
│   └── POST /refresh
├── /land-surveys
│   ├── POST /
│   ├── GET /
│   ├── GET /:id
│   ├── PUT /:id
│   └── DELETE /:id
├── /building-inputs
│   ├── POST /
│   ├── GET /:id
│   └── PUT /:id
├── /wind
│   ├── POST /
│   └── GET /building/:buildingInputId
└── /analysis
    ├── POST /disaster/:buildingInputId
    ├── POST /vastu/:buildingInputId
    ├── POST /report/:buildingInputId
    ├── GET /disaster/:buildingInputId
    ├── GET /vastu/:buildingInputId
    └── GET /report/:buildingInputId
```

### Services Directory

**Purpose:** Implement business logic and calculations

**auth.service.ts**
- User registration
- Password hashing
- JWT generation
- Token refresh

**analysis.service.ts**
- Orchestrates all analysis services
- Combines results
- Generates final reports
- Calculates composite scores

**wind.service.ts**
- Wind pressure calculation (IS 875 Part 3)
- Wind load computation
- Optimal orientation
- Aerodynamic recommendations
- Ventilation strategies

**earthquake.service.ts**
- Base shear calculation (IS 1893)
- Seismic zone analysis
- Soft-story detection
- Shear wall placement
- Safety scoring

**flood.service.ts**
- Plinth height calculation
- Drainage slope determination
- Basement feasibility
- Water-resistant materials

**cyclone.service.ts**
- Vortex shedding assessment
- Pressure zone analysis
- Shape optimization
- Coastal considerations

**loadAnalysis.service.ts**
- Dead load calculation (IS 875 Part 1)
- Live load calculation (IS 875 Part 2)
- Height classification
- Foundation recommendations
- Structural sizing

**vastu.service.ts**
- Entrance evaluation
- Room placement
- Height balance
- Wind-Vastu compatibility
- Violation detection
- Correction suggestions

### Validators Directory

**Purpose:** Define Zod schemas for input validation

**auth.validator.ts**
- `registerSchema` - Registration validation
- `loginSchema` - Login validation

**landSurvey.validator.ts**
- `createLandSurveySchema` - Survey input validation
- Validates coordinates, soil type, seismic zone, etc.

**buildingInput.validator.ts**
- `createBuildingInputSchema` - Building validation
- `createWindDataSchema` - Wind data validation

### Types Directory

**express.d.ts**
- Extends Express Request interface
- Adds `user` property for authenticated requests
- Type-safe request handling

## File Naming Conventions

### Controllers
- Pattern: `{resource}.controller.ts`
- Example: `auth.controller.ts`

### Services
- Pattern: `{domain}.service.ts`
- Example: `wind.service.ts`

### Routes
- Pattern: `{resource}.routes.ts`
- Example: `landSurvey.routes.ts`

### Middleware
- Pattern: `{function}.middleware.ts`
- Example: `auth.middleware.ts`

### Validators
- Pattern: `{resource}.validator.ts`
- Example: `buildingInput.validator.ts`

## Import Patterns

### Absolute Imports (from src/)
```typescript
import prisma from '../config/database';
import logger from '../config/logger';
import { AppError } from '../middleware/error.middleware';
```

### Relative Imports (same directory)
```typescript
import { WindService } from './wind.service';
import { EarthquakeService } from './earthquake.service';
```

### External Packages
```typescript
import express from 'express';
import { z } from 'zod';
import { PrismaClient } from '@prisma/client';
```

## Generated Directories

### dist/
- Compiled JavaScript files
- Generated by `npm run build`
- Mirror of src/ structure
- Used in production

### logs/
- error.log - Error level logs
- combined.log - All logs
- Generated by Winston
- Rotate daily (recommended)

### node_modules/
- NPM dependencies
- Generated by `npm install`
- Not committed to git

## Configuration Files

### tsconfig.json
- TypeScript compiler options
- Strict mode enabled
- Output directory: dist/
- Source directory: src/

### package.json
- Project metadata
- Dependencies
- Scripts:
  - `dev` - Development server
  - `build` - Compile TypeScript
  - `start` - Production server
  - `prisma:*` - Database commands

### .env
- Environment variables
- Database URL
- JWT secrets
- Port configuration
- Not committed to git

### .gitignore
- node_modules/
- dist/
- .env
- logs/
- *.log

## Best Practices

1. **One responsibility per file**
2. **Clear naming conventions**
3. **Logical grouping by feature**
4. **Separation of concerns**
5. **Type safety throughout**
6. **Consistent file structure**
7. **Documentation in code**
8. **Index files for exports**
