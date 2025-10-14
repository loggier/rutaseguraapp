
// src/ai/flows/optimize-routes-with-ai.ts
'use server';

/**
 * @fileOverview An AI-powered route optimization tool for school bus routes.
 *
 * - optimizeRoutes - A function that suggests efficient routes based on student locations, traffic, and bus capacity.
 * - OptimizeRoutesInput - The input type for the optimizeRoutes function.
 * - OptimizeRoutesOutput - The return type for the optimizeRoutes function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'zod';

// Define Zod schema for geographic coordinates
const CoordinatesSchema = z.object({
  latitude: z.number().describe('Latitude of the location'),
  longitude: z.number().describe('Longitude of the location'),
});

// Define Zod schema for a student's location and ID
const StudentLocationSchema = z.object({
  studentId: z.string().describe('Unique identifier for the student'),
  location: CoordinatesSchema.describe('Geographic coordinates of the student\u2019s location'),
});

// Define Zod schema for real-time traffic data on a route segment
const TrafficDataSchema = z.object({
  segmentStart: CoordinatesSchema.describe('Starting coordinates of the route segment'),
  segmentEnd: CoordinatesSchema.describe('Ending coordinates of the route segment'),
  trafficDensity: z.number().describe('A number between 0 and 1 indicating traffic density, where 0 is free-flowing and 1 is gridlock'),
});

// Define the input schema for the optimizeRoutes function
const OptimizeRoutesInputSchema = z.object({
  students: z.array(StudentLocationSchema).describe('An array of student IDs and their geographic locations'),
  busCapacity: z.number().describe('The maximum number of students the bus can accommodate'),
  currentTraffic: z.array(TrafficDataSchema).optional().describe('Real-time traffic data for relevant route segments'),
  routeConstraints: z
    .string()
    .optional()
    .describe(
      'Optional: Constraints or preferences for the route, such as avoiding certain areas or prioritizing certain stops'
    ),
});
export type OptimizeRoutesInput = z.infer<typeof OptimizeRoutesInputSchema>;

// Define the output schema for the optimizeRoutes function
const OptimizedRouteSchema = z.object({
  routeOrder: z.array(z.string()).describe('An array of student IDs in the optimal pickup/drop-off order'),
  estimatedTravelTime: z.number().describe('Estimated travel time for the route in minutes'),
  routeMapImageUrl: z
    .string()
    .describe('URL for a static map image of the optimized route')
    .optional(),
  polyline: z
    .string()
    .describe('An encoded polyline string representing the entire route path.')
    .optional(),
});

const OptimizeRoutesOutputSchema = z.object({
  optimizedRoute: OptimizedRouteSchema.describe('The optimized school bus route'),
});

export type OptimizeRoutesOutput = z.infer<typeof OptimizeRoutesOutputSchema>;

export async function optimizeRoutes(input: OptimizeRoutesInput): Promise<OptimizeRoutesOutput> {
  return optimizeRoutesFlow(input);
}

const optimizeRoutesPrompt = ai.definePrompt({
  name: 'optimizeRoutesPrompt',
  input: {schema: OptimizeRoutesInputSchema},
  output: {schema: OptimizeRoutesOutputSchema},
  prompt: `You are an AI route optimization expert for school buses.

Given the following student locations, bus capacity, real-time traffic data (if available), and route constraints (if any), suggest the most efficient route to minimize travel time.

Student Locations:
{{#each students}}
- Student ID: {{this.studentId}}, Location: {{this.location.latitude}}, {{this.location.longitude}}
{{/each}}

Bus Capacity: {{busCapacity}}

{{#if currentTraffic}}
Current Traffic Data:
{{#each currentTraffic}}
- Segment Start: {{this.segmentStart.latitude}}, {{this.segmentStart.longitude}}, Segment End: {{this.segmentEnd.latitude}}, {{this.segmentEnd.longitude}}, Traffic Density: {{this.trafficDensity}}
{{/each}}
{{/if}}

{{#if routeConstraints}}
Route Constraints: {{routeConstraints}}
{{/if}}

Considerations:
*   Prioritize minimizing overall travel time.
*   Ensure that the bus capacity is not exceeded.

Output:
Provide the optimized route including the order of student IDs, the estimated travel time in minutes, a URL for a static map image of the route, and an encoded polyline for the route path.
`,
});

const optimizeRoutesFlow = ai.defineFlow(
  {
    name: 'optimizeRoutesFlow',
    inputSchema: OptimizeRoutesInputSchema,
    outputSchema: OptimizeRoutesOutputSchema,
  },
  async input => {
    const {output} = await optimizeRoutesPrompt(input);
    return output!;
  }
);
