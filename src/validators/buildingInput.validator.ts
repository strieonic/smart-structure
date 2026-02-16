import { z } from 'zod';

export const createBuildingInputSchema = z.object({
  body: z.object({
    landSurveyId: z.string().uuid(),
    buildingType: z.enum(['RESIDENTIAL', 'COMMERCIAL', 'HOSPITAL', 'SCHOOL', 'INDUSTRIAL', 'MIXED_USE']),
    totalFloors: z.number().int().positive().max(200),
    floorHeight: z.number().positive().min(2.5).max(6),
    totalHeight: z.number().positive(),
    builtUpArea: z.number().positive(),
    orientation: z.enum(['NORTH', 'NORTH_EAST', 'EAST', 'SOUTH_EAST', 'SOUTH', 'SOUTH_WEST', 'WEST', 'NORTH_WEST']),
    structuralSystem: z.enum(['RCC', 'STEEL', 'COMPOSITE', 'LOAD_BEARING']),
    basementFloors: z.number().int().min(0).max(5).optional(),
    parkingFloors: z.number().int().min(0).optional(),
    expectedOccupancy: z.number().int().positive().optional(),
  }),
});

export const createWindDataSchema = z.object({
  body: z.object({
    buildingInputId: z.string().uuid(),
    windDirection: z.number().min(0).max(360),
    averageWindSpeed: z.number().positive(),
    peakGustSpeed: z.number().positive(),
    terrainRoughness: z.enum(['CATEGORY_1', 'CATEGORY_2', 'CATEGORY_3', 'CATEGORY_4']),
  }),
});
