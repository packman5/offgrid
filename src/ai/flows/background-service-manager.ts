'use server';

/**
 * @fileOverview Manages the camera service to run in the background using GenAI.
 *
 * - manageBackgroundService - Manages the background service based on device specifics.
 * - ManageBackgroundServiceInput - The input type for the manageBackgroundService function.
 * - ManageBackgroundServiceOutput - The return type for the manageBackgroundService function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'zod';

const ManageBackgroundServiceInputSchema = z.object({
  deviceModel: z.string().describe('The model of the device.'),
  osVersion: z.string().describe('The version of the operating system.'),
  batteryLevel: z.number().describe('The current battery level of the device (0-100).'),
  isScreenOn: z.boolean().describe('Whether the screen is currently on.'),
});
export type ManageBackgroundServiceInput = z.infer<typeof ManageBackgroundServiceInputSchema>;

const ManageBackgroundServiceOutputSchema = z.object({
  shouldKeepAlive: z.boolean().describe('Whether the background service should be kept alive.'),
  reason: z.string().describe('The reason for the decision.'),
});
export type ManageBackgroundServiceOutput = z.infer<typeof ManageBackgroundServiceOutputSchema>;

export async function manageBackgroundService(input: ManageBackgroundServiceInput): Promise<ManageBackgroundServiceOutput> {
  return manageBackgroundServiceFlow(input);
}

const prompt = ai.definePrompt({
  name: 'manageBackgroundServicePrompt',
  input: {schema: ManageBackgroundServiceInputSchema},
  output: {schema: ManageBackgroundServiceOutputSchema},
  prompt: `You are an expert in managing background services on mobile devices.

  Based on the device model, OS version, battery level, and screen state, determine whether the camera service should be kept alive in the background.

  Consider the following:
  - Some devices aggressively kill background services to save battery.
  - Older OS versions may have different background service restrictions.
  - High battery usage may warrant stopping the service to conserve power.
  - The service should ideally keep running when the screen is off.

  Here is the device information:
  Device Model: {{{deviceModel}}}
  OS Version: {{{osVersion}}}
  Battery Level: {{{batteryLevel}}}
  Screen On: {{{isScreenOn}}}

  Based on the above information respond in JSON format:
  {
    "shouldKeepAlive": true or false,
    "reason": "A brief explanation of why the service should be kept alive or stopped."
  }`,
});

const manageBackgroundServiceFlow = ai.defineFlow(
  {
    name: 'manageBackgroundServiceFlow',
    inputSchema: ManageBackgroundServiceInputSchema,
    outputSchema: ManageBackgroundServiceOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
