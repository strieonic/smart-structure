# API Usage Examples

## Complete Workflow Example

### Step 1: Register and Login

```bash
# Register
curl -X POST http://localhost:5000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "engineer@example.com",
    "password": "SecurePass123",
    "name": "Rajesh Kumar",
    "role": "ENGINEER"
  }'

# Login
curl -X POST http://localhost:5000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "engineer@example.com",
    "password": "SecurePass123"
  }'
```

Response:
```json
{
  "status": "success",
  "data": {
    "user": {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "email": "engineer@example.com",
      "name": "Rajesh Kumar",
      "role": "ENGINEER"
    },
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

### Step 2: Create Land Survey

```bash
curl -X POST http://localhost:5000/api/v1/land-surveys \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "latitude": 19.0760,
    "longitude": 72.8777,
    "plotArea": 1000,
    "soilType": "BLACK_COTTON",
    "slope": 3.5,
    "elevation": 14,
    "waterTableDepth": 6.5,
    "seismicZone": "ZONE_III",
    "floodRisk": "HIGH",
    "nearbyWaterBodies": true,
    "waterBodyDistance": 200,
    "historicalDisasters": [
      {
        "type": "FLOOD",
        "year": 2005,
        "severity": "HIGH"
      },
      {
        "type": "CYCLONE",
        "year": 2019,
        "severity": "MEDIUM"
      }
    ],
    "averageRainfall": 2400,
    "maxTemperature": 38,
    "minTemperature": 16
  }'
```

Response:
```json
{
  "status": "success",
  "data": {
    "id": "660e8400-e29b-41d4-a716-446655440001",
    "userId": "550e8400-e29b-41d4-a716-446655440000",
    "latitude": 19.0760,
    "longitude": 72.8777,
    "plotArea": 1000,
    "soilType": "BLACK_COTTON",
    "seismicZone": "ZONE_III",
    "floodRisk": "HIGH",
    "createdAt": "2024-01-15T10:30:00.000Z"
  }
}
```

### Step 3: Create Building Input

```bash
curl -X POST http://localhost:5000/api/v1/building-inputs \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "landSurveyId": "660e8400-e29b-41d4-a716-446655440001",
    "buildingType": "RESIDENTIAL",
    "totalFloors": 15,
    "floorHeight": 3.0,
    "totalHeight": 45.0,
    "builtUpArea": 12000,
    "orientation": "NORTH_EAST",
    "structuralSystem": "RCC",
    "basementFloors": 2,
    "parkingFloors": 2,
    "expectedOccupancy": 150
  }'
```

Response:
```json
{
  "status": "success",
  "data": {
    "id": "770e8400-e29b-41d4-a716-446655440002",
    "landSurveyId": "660e8400-e29b-41d4-a716-446655440001",
    "buildingType": "RESIDENTIAL",
    "totalFloors": 15,
    "totalHeight": 45.0,
    "orientation": "NORTH_EAST",
    "structuralSystem": "RCC",
    "createdAt": "2024-01-15T10:35:00.000Z"
  }
}
```

### Step 4: Add Wind Data

```bash
curl -X POST http://localhost:5000/api/v1/wind \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "buildingInputId": "770e8400-e29b-41d4-a716-446655440002",
    "windDirection": 270,
    "averageWindSpeed": 35,
    "peakGustSpeed": 55,
    "terrainRoughness": "CATEGORY_2"
  }'
```

Response:
```json
{
  "status": "success",
  "data": {
    "id": "880e8400-e29b-41d4-a716-446655440003",
    "buildingInputId": "770e8400-e29b-41d4-a716-446655440002",
    "windDirection": 270,
    "averageWindSpeed": 35,
    "peakGustSpeed": 55,
    "terrainRoughness": "CATEGORY_2",
    "windPressure": 0.735,
    "windLoad": 2425.50,
    "optimalOrientation": "NORTH",
    "aerodynamicForm": "ROUNDED_CORNERS",
    "ventilationStrategy": {
      "primaryVentilation": {
        "direction": 270,
        "openingPlacement": "WINDWARD_LEEWARD",
        "crossVentilationFeasible": true
      },
      "floorWiseStrategy": "MECHANICAL_ASSISTED",
      "recommendations": [
        "Place primary openings on windward side",
        "Secondary openings on leeward side for cross-ventilation",
        "Avoid openings on high-pressure zones",
        "Consider wind catchers for upper floors"
      ]
    }
  }
}
```

### Step 5: Perform Disaster Analysis

```bash
curl -X POST http://localhost:5000/api/v1/analysis/disaster/770e8400-e29b-41d4-a716-446655440002 \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

Response:
```json
{
  "status": "success",
  "message": "Disaster analysis completed",
  "data": {
    "id": "990e8400-e29b-41d4-a716-446655440004",
    "buildingInputId": "770e8400-e29b-41d4-a716-446655440002",
    "deadLoad": 66000.00,
    "liveLoad": 24000.00,
    "windLoad": 2425.50,
    "seismicLoad": 5760.00,
    "totalLoad": 98185.50,
    "heightCategory": "HIGH_RISE",
    "recommendedFoundation": "DEEP_PILE",
    "foundationDepth": 15.0,
    "columnSpacing": 5.0,
    "beamSizing": "Primary beams: 400mm x 750mm for 5.0m span. Secondary beams: 300mm x 600mm. Consider post-tensioned beams",
    "shearWallRequired": true,
    "earthquakeSafetyScore": 62.0,
    "baseShear": 5760.00,
    "softStoryDetected": false,
    "shearWallPlacement": {
      "required": true,
      "minimumWallArea": 240.00,
      "placement": {
        "coreWalls": "Around lift and staircase cores",
        "peripheralWalls": "At building corners and edges",
        "distribution": "Symmetrically distributed in both directions"
      },
      "recommendations": [
        "Place shear walls symmetrically to avoid torsion",
        "Minimum thickness: 150mm for low-rise, 200mm for high-rise",
        "Continuous from foundation to roof"
      ]
    },
    "minimumPlinthHeight": 1.50,
    "drainageSlope": 3.5,
    "basementFeasible": false,
    "waterResistantMaterials": [
      "PCC (Plain Cement Concrete) for foundation",
      "Waterproof cement for below-ground construction",
      "Polymer-modified waterproofing membrane",
      "Crystalline waterproofing admixture in concrete",
      "HDPE waterproofing sheet for basement (if applicable)",
      "Burnt clay bricks or concrete blocks",
      "Cement plaster with waterproofing compound",
      "Vitrified tiles or ceramic tiles (water-resistant)",
      "Avoid wood flooring at ground level",
      "Epoxy coating for external walls",
      "Bituminous coating for foundation"
    ],
    "vortexSheddingRisk": "MEDIUM",
    "heightToWidthRatio": 4.11,
    "pressureZones": {
      "zones": {
        "windward": {
          "description": "Maximum positive pressure",
          "coefficient": 0.8,
          "pressure": 1.452
        },
        "leeward": {
          "description": "Negative pressure (suction)",
          "coefficient": -0.5,
          "pressure": -0.908
        },
        "side": {
          "description": "Side wall suction",
          "coefficient": -0.7,
          "pressure": -1.271
        },
        "roof": {
          "description": "Roof suction (critical)",
          "coefficient": -0.9,
          "pressure": -1.634
        }
      },
      "criticalZone": "ROOF",
      "recommendation": "Ensure proper roof anchorage to resist uplift forces"
    },
    "shapeOptimization": "STREAMLINED_RECTANGULAR: Use rounded corners with radius ≥ 10% of width. Avoid sharp edges. Consider chamfered corners."
  }
}
```

### Step 6: Perform Vastu Analysis

```bash
curl -X POST http://localhost:5000/api/v1/analysis/vastu/770e8400-e29b-41d4-a716-446655440002 \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

Response:
```json
{
  "status": "success",
  "message": "Vastu analysis completed",
  "data": {
    "id": "aa0e8400-e29b-41d4-a716-446655440005",
    "buildingInputId": "770e8400-e29b-41d4-a716-446655440002",
    "plotShape": "RECTANGULAR",
    "entranceDirection": "NORTH_EAST",
    "vastuComplianceScore": 95.0,
    "overallCompliance": "EXCELLENT",
    "entranceSuitability": "EXCELLENT - Highly auspicious as per Vastu",
    "kitchenZoneCompliance": true,
    "bedroomZoneCompliance": true,
    "staircaseCompliance": true,
    "waterTankDirection": "NORTH_EAST (most auspicious) or NORTH or EAST",
    "borewellDirection": "NORTH_EAST (highly recommended) or NORTH",
    "windVastuCompatibility": "EXCELLENT - Wind and Vastu alignment optimal",
    "violations": [],
    "corrections": [
      {
        "violation": "General Vastu enhancement",
        "solution": "Keep Brahmasthan (center) open and clutter-free",
        "priority": "MEDIUM"
      }
    ]
  }
}
```

### Step 7: Generate Final Report

```bash
curl -X POST http://localhost:5000/api/v1/analysis/report/770e8400-e29b-41d4-a716-446655440002 \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

Response:
```json
{
  "status": "success",
  "message": "Final report generated",
  "data": {
    "id": "bb0e8400-e29b-41d4-a716-446655440006",
    "buildingInputId": "770e8400-e29b-41d4-a716-446655440002",
    "overallSafetyScore": 71.20,
    "costEfficiencyScore": 60.0,
    "sustainabilityScore": 85.0,
    "vastuScore": 95.0,
    "surveySummary": {
      "location": {
        "lat": 19.0760,
        "lng": 72.8777
      },
      "plotArea": 1000,
      "soilType": "BLACK_COTTON",
      "seismicZone": "ZONE_III",
      "floodRisk": "HIGH"
    },
    "riskAnalysis": {
      "earthquakeRisk": {
        "zone": "ZONE_III",
        "safetyScore": 62.0,
        "baseShear": 5760.00
      },
      "floodRisk": {
        "level": "HIGH",
        "plinthHeight": 1.50,
        "basementFeasible": false
      },
      "windRisk": {
        "vortexShedding": "MEDIUM",
        "heightToWidthRatio": 4.11
      }
    },
    "structuralLogic": {
      "loadAnalysis": {
        "deadLoad": 66000.00,
        "liveLoad": 24000.00,
        "totalLoad": 98185.50
      },
      "foundation": {
        "type": "DEEP_PILE",
        "depth": 15.0
      },
      "structural": {
        "columnSpacing": 5.0,
        "beamSizing": "Primary beams: 400mm x 750mm for 5.0m span. Secondary beams: 300mm x 600mm. Consider post-tensioned beams",
        "shearWallRequired": true
      }
    },
    "vastuSummary": {
      "complianceScore": 95.0,
      "overallCompliance": "EXCELLENT",
      "entranceSuitability": "EXCELLENT - Highly auspicious as per Vastu",
      "violations": [],
      "corrections": [
        {
          "violation": "General Vastu enhancement",
          "solution": "Keep Brahmasthan (center) open and clutter-free",
          "priority": "MEDIUM"
        }
      ]
    },
    "finalRecommendations": {
      "structural": [
        "Use DEEP_PILE foundation at 15m depth",
        "Column spacing: 5m",
        "Primary beams: 400mm x 750mm for 5.0m span. Secondary beams: 300mm x 600mm. Consider post-tensioned beams",
        "Shear walls required for lateral stability"
      ],
      "disaster": [
        "Design for base shear: 5760 kN",
        "Minimum plinth height: 1.5m",
        "Drainage slope: 3.5%"
      ],
      "vastu": [
        "Keep Brahmasthan (center) open and clutter-free"
      ],
      "general": [
        "Conduct detailed soil investigation before construction",
        "Engage structural engineer for detailed design",
        "Obtain all necessary approvals and permits",
        "Regular structural health monitoring recommended"
      ]
    },
    "reportStatus": "GENERATED",
    "generatedAt": "2024-01-15T10:45:00.000Z"
  }
}
```

## Additional Examples

### Get All Land Surveys

```bash
curl -X GET http://localhost:5000/api/v1/land-surveys \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### Get Specific Building Input

```bash
curl -X GET http://localhost:5000/api/v1/building-inputs/770e8400-e29b-41d4-a716-446655440002 \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### Update Land Survey

```bash
curl -X PUT http://localhost:5000/api/v1/land-surveys/660e8400-e29b-41d4-a716-446655440001 \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "waterTableDepth": 7.0,
    "averageRainfall": 2500
  }'
```

### Refresh Access Token

```bash
curl -X POST http://localhost:5000/api/v1/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{
    "refreshToken": "YOUR_REFRESH_TOKEN"
  }'
```

## Error Responses

### Validation Error
```json
{
  "status": "error",
  "message": "Validation failed",
  "errors": [
    {
      "field": "body.latitude",
      "message": "Number must be greater than or equal to -90"
    }
  ]
}
```

### Authentication Error
```json
{
  "status": "error",
  "message": "Authentication required"
}
```

### Not Found Error
```json
{
  "status": "error",
  "message": "Resource not found"
}
```

### Rate Limit Error
```json
{
  "status": "error",
  "message": "Too many requests from this IP, please try again later"
}
```
