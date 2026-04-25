import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';
import { TOOL_DEFINITIONS } from './tool-definitions';
import { MockMemberService } from '../services/member-service';
import { MockPartnerConfigService } from '../services/partner-config-service';
import { RecommendationEngine } from '../services/recommendation-engine';
import { RuleEnforcer } from '../services/rule-enforcer';
import { MOCK_MEMBERS } from '../mocks/member-data';
import { AppError, BookingType, RecommendationRequest } from '../types';

// --- Service instances (dependency injection) ---
const memberService = new MockMemberService();
const partnerConfigService = new MockPartnerConfigService();
const recommendationEngine = new RecommendationEngine();
const ruleEnforcer = new RuleEnforcer();

/**
 * Creates and configures the MCP server with all tool registrations.
 */
function createMcpServer(): McpServer {
  const server = new McpServer({
    name: 'arrivia-travel-recommendations',
    version: '1.0.0',
  });

  // --- Tool 1: get_member_profile ---
  server.registerTool(
    TOOL_DEFINITIONS.get_member_profile.name,
    {
      description: TOOL_DEFINITIONS.get_member_profile.description,
      inputSchema: {
        memberId: z.string().describe('The unique member ID (e.g., "mem_001")'),
      },
    },
    async ({ memberId }) => {
      try {
        const member = await memberService.getMember(memberId);
        return {
          content: [
            {
              type: 'text' as const,
              text: JSON.stringify(member, null, 2),
            },
          ],
        };
      } catch (error) {
        const message = error instanceof AppError ? error.message : 'Failed to fetch member profile';
        return {
          content: [{ type: 'text' as const, text: JSON.stringify({ error: message }) }],
          isError: true,
        };
      }
    }
  );

  // --- Tool 2: get_travel_recommendations ---
  server.registerTool(
    TOOL_DEFINITIONS.get_travel_recommendations.name,
    {
      description: TOOL_DEFINITIONS.get_travel_recommendations.description,
      inputSchema: {
        memberId: z.string().describe('The unique member ID (e.g., "mem_001")'),
        destinationPreference: z.string().optional().describe('Optional preferred destination keyword'),
        bookingTypePreference: z.enum(['flight', 'hotel', 'rental_car', 'cruise', 'package']).optional()
          .describe('Optional preferred booking type'),
        budgetMax: z.number().positive().optional().describe('Optional maximum budget in USD'),
      },
    },
    async ({ memberId, destinationPreference, bookingTypePreference, budgetMax }) => {
      try {
        const member = await memberService.getMember(memberId);
        const partnerConfig = await partnerConfigService.getPartnerConfig(member.partnerId);

        const request: RecommendationRequest = {
          memberId,
          destinationPreference,
          bookingTypePreference: bookingTypePreference as BookingType | undefined,
          budgetMax,
        };

        const rawRecommendations = await recommendationEngine.generateRecommendations(member, request);
        const result = ruleEnforcer.applyRules(rawRecommendations, partnerConfig, member.loyaltyTier);

        const response = {
          memberId: member.memberId,
          partnerId: partnerConfig.partnerId,
          partnerName: partnerConfig.partnerName,
          loyaltyTier: member.loyaltyTier,
          recommendations: result.recommendations,
          metadata: {
            totalGenerated: result.totalBefore,
            totalAfterFiltering: result.totalAfter,
            appliedRules: result.appliedRules,
            generatedAt: new Date().toISOString(),
          },
        };

        return {
          content: [
            {
              type: 'text' as const,
              text: JSON.stringify(response, null, 2),
            },
          ],
        };
      } catch (error) {
        const message = error instanceof AppError ? error.message : 'Failed to generate recommendations';
        return {
          content: [{ type: 'text' as const, text: JSON.stringify({ error: message }) }],
          isError: true,
        };
      }
    }
  );

  // --- Tool 3: list_available_members ---
  server.registerTool(
    TOOL_DEFINITIONS.list_available_members.name,
    {
      description: TOOL_DEFINITIONS.list_available_members.description,
    },
    async () => {
      const members = Object.values(MOCK_MEMBERS).map((m) => ({
        memberId: m.memberId,
        loyaltyTier: m.loyaltyTier,
        partnerId: m.partnerId,
      }));

      return {
        content: [
          {
            type: 'text' as const,
            text: JSON.stringify(members, null, 2),
          },
        ],
      };
    }
  );

  return server;
}

/**
 * Main entry point — starts the MCP server over stdio transport.
 */
async function main(): Promise<void> {
  const server = createMcpServer();
  const transport = new StdioServerTransport();

  await server.connect(transport);

  // Log to stderr so it doesn't interfere with the stdio JSON-RPC protocol
  process.stderr.write('Arrivia MCP server running on stdio\n');
}

main().catch((error) => {
  process.stderr.write(`MCP server error: ${error}\n`);
  process.exit(1);
});
