'use server';

/**
 * @fileOverview An AI agent that forecasts supply shortages for a specific part based on past transaction data.
 *
 * - forecastSupply - A function that handles the supply forecasting process.
 * - ForecastSupplyInput - The input type for the forecastSupply function.
 * - ForecastSupplyOutput - The return type for the forecastSupply function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ForecastSupplyInputSchema = z.object({
  partName: z.string().describe('The name of the part to forecast supply for.'),
  transactionHistory: z.string().describe('A string containing past transaction data, including dates and quantities.'),
  seasonalVariations: z.string().describe('A description of any seasonal variations affecting demand for the part.'),
  vendorLeadTimeDays: z.number().describe('The typical lead time in days for ordering the part from vendors.'),
});
export type ForecastSupplyInput = z.infer<typeof ForecastSupplyInputSchema>;

const ForecastSupplyOutputSchema = z.object({
  predictedShortageDate: z.string().describe('The predicted date when the supply of the part will run low, in ISO format (YYYY-MM-DD).'),
  confidenceScore: z.number().describe('A score between 0 and 1 indicating the confidence in the prediction (1 being the most confident).'),
  recommendations: z.string().describe('Recommendations for the manufacturer based on the predicted shortage date, including order quantity and timing.'),
});
export type ForecastSupplyOutput = z.infer<typeof ForecastSupplyOutputSchema>;

export async function forecastSupply(input: ForecastSupplyInput): Promise<ForecastSupplyOutput> {
  return forecastSupplyFlow(input);
}

const forecastSupplyPrompt = ai.definePrompt({
  name: 'forecastSupplyPrompt',
  input: {schema: ForecastSupplyInputSchema},
  output: {schema: ForecastSupplyOutputSchema},
  prompt: `You are an expert supply chain analyst specializing in forecasting part shortages for automotive manufacturers.

You will analyze past transaction data, seasonal variations, and vendor lead times to predict when the supply of a specific part will run low.

Based on the predicted shortage date, you will provide recommendations for the manufacturer, including order quantity and timing.

Part Name: {{{partName}}}
Transaction History: {{{transactionHistory}}}
Seasonal Variations: {{{seasonalVariations}}}
Vendor Lead Time (days): {{{vendorLeadTimeDays}}}

Consider all these factors to predict the date when the supply of this part will run low.  The date must be provided in ISO format (YYYY-MM-DD).
Also, calculate a confidence score (0 to 1) for your prediction.
Finally, provide order recommendations to avoid production delays.
`,
});

const forecastSupplyFlow = ai.defineFlow(
  {
    name: 'forecastSupplyFlow',
    inputSchema: ForecastSupplyInputSchema,
    outputSchema: ForecastSupplyOutputSchema,
  },
  async input => {
    const {output} = await forecastSupplyPrompt(input);
    return output!;
  }
);
