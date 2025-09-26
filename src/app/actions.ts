'use server';

import { 
    manageBackgroundService,
    type ManageBackgroundServiceInput,
    type ManageBackgroundServiceOutput
} from '@/ai/flows/background-service-manager';

export async function getBackgroundServiceSuggestion(
  input: ManageBackgroundServiceInput
): Promise<ManageBackgroundServiceOutput> {
  try {
    const result = await manageBackgroundService(input);
    return result;
  } catch (error) {
    console.error("Error in getBackgroundServiceSuggestion action:", error);
    // Return a default safe value in case of an error
    return {
      shouldKeepAlive: false,
      reason: "Could not get a suggestion due to an internal error. Defaulting to not keeping the service alive to save power."
    };
  }
}
