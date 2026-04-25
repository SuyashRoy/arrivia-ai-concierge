/**
 * MCP tool schemas and descriptions.
 *
 * Each tool includes a clear, detailed description so AI agents understand
 * what the tool does and what input it expects.
 */

export const TOOL_DEFINITIONS = {
  get_member_profile: {
    name: 'get_member_profile',
    description:
      "Retrieve a travel loyalty member's profile including their loyalty tier, travel history, and partner affiliation. Use this to understand a member before requesting recommendations.",
  },

  get_travel_recommendations: {
    name: 'get_travel_recommendations',
    description:
      "Generate personalized travel recommendations for a member based on their travel history, loyalty tier, and partner-specific rules. Recommendations are scored by relevance and filtered according to the member's partner configuration. Returns scored results with reasoning explaining why each was recommended.",
  },

  list_available_members: {
    name: 'list_available_members',
    description:
      'List all available member IDs in the system. Useful for discovering which members can be queried for profiles and recommendations.',
  },
} as const;
