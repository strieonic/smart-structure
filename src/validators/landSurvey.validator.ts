import { z } from 'zod';

export const createLandSurveySchema = z.object({
  body: z.object({
    latitude: z.number().min(-90).max(90),
    longitude: z.number().min(-180).max(180),
    plotArea: z.number().positive('Plot area must be positive'),
    soilType: z.enum(['CLAY', 'BLACK_COTTON', 'LATERITE', 'SANDY', 'ROCKY', 'ALLUVIAL']),
    slope: z.number().min(0).max(90),
    elevation: z.number(),
    waterTableDepth: z.number().positive(),
    seismicZone: z.enum(['ZONE_II', 'ZONE_III', 'ZONE_IV', 'ZONE_V']),
    floodRisk: z.enum(['LOW', 'MEDIUM', 'HIGH', 'VERY_HIGH']),
    nearbyWaterBodies: z.boolean(),
    waterBodyDistance: z.number().positive().optional(),
    historicalDisasters: z.array(z.object({
      type: z.string(),
      year: z.number(),
      severity: z.string(),
    })).optional(),
    averageRainfall: z.number().positive().optional(),
    maxTemperature: z.number().optional(),
    minTemperature: z.number().optional(),
  }),
});
