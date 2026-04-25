/**
 * CLI demonstration tool for the Arrivia Travel Recommendations API.
 *
 * Usage:
 *   npx tsx cli/demo.ts --member mem_001
 *   npx tsx cli/demo.ts --interactive
 *   npx tsx cli/demo.ts --list
 */

import { MockMemberService } from '../src/services/member-service';
import { MockPartnerConfigService } from '../src/services/partner-config-service';
import { RecommendationEngine } from '../src/services/recommendation-engine';
import { RuleEnforcer } from '../src/services/rule-enforcer';
import { MOCK_MEMBERS } from '../src/mocks/member-data';
import { Member, PartnerConfig, RecommendationResponse, RuleEnforcementResult } from '../src/types';
import * as readline from 'readline';

// --- Service instances ---
const memberService = new MockMemberService();
const partnerConfigService = new MockPartnerConfigService();
const recommendationEngine = new RecommendationEngine();
const ruleEnforcer = new RuleEnforcer();

// --- Pretty-print helpers ---

function printHeader(text: string): void {
  console.log('\n' + '='.repeat(60));
  console.log(`  ${text}`);
  console.log('='.repeat(60));
}

function printSubHeader(text: string): void {
  console.log(`\n--- ${text} ---`);
}

function printMemberSummary(member: Member): void {
  printSubHeader('Member Profile');
  console.log(`  ID:           ${member.memberId}`);
  console.log(`  Loyalty Tier: ${member.loyaltyTier}`);
  console.log(`  Partner:      ${member.partnerId}`);
  console.log(`  Bookings:     ${member.travelHistory.length} past trips`);

  if (member.preferences) {
    console.log(`  Budget:       ${member.preferences.budgetLevel ?? 'not set'}`);
    console.log(`  Style:        ${member.preferences.travelStyle ?? 'not set'}`);
    if (member.preferences.preferredRegions?.length) {
      console.log(`  Regions:      ${member.preferences.preferredRegions.join(', ')}`);
    }
  }

  if (member.travelHistory.length > 0) {
    printSubHeader('Travel History');
    for (const trip of member.travelHistory.slice(0, 5)) {
      const stars = trip.rating ? ' *'.repeat(trip.rating) : '';
      console.log(`  - ${trip.destination} (${trip.region}) | ${trip.bookingType} | ${trip.dates.start}${stars}`);
    }
    if (member.travelHistory.length > 5) {
      console.log(`  ... and ${member.travelHistory.length - 5} more`);
    }
  }
}

function printPartnerRules(config: PartnerConfig): void {
  printSubHeader(`Partner Rules: ${config.partnerName}`);
  console.log(`  Partner ID:          ${config.partnerId}`);
  console.log(`  Max Recommendations: ${config.maxRecommendationsPerSession ?? 'unlimited'}`);
  console.log(`  Excluded Types:      ${config.excludedBookingTypes.length > 0 ? config.excludedBookingTypes.join(', ') : 'none'}`);
  console.log(`  Allowed Regions:     ${config.allowedRegions ? config.allowedRegions.join(', ') : 'all'}`);
}

function printRecommendations(response: RecommendationResponse): void {
  printSubHeader('Recommendations');
  console.log(`  Generated: ${response.metadata.totalGenerated} | After filtering: ${response.metadata.totalAfterFiltering}`);

  if (response.recommendations.length === 0) {
    console.log('\n  No recommendations available after applying partner rules.');
    console.log('  This may be due to partner configuration restrictions.');
  }

  for (let i = 0; i < response.recommendations.length; i++) {
    const rec = response.recommendations[i];
    console.log(`\n  [${i + 1}] ${rec.title}`);
    console.log(`      Destination:  ${rec.destination} (${rec.region})`);
    console.log(`      Type:         ${rec.bookingType}`);
    console.log(`      Price:        $${rec.estimatedPrice.amount} ${rec.estimatedPrice.currency}`);
    console.log(`      Confidence:   ${(rec.confidenceScore * 100).toFixed(0)}%`);
    console.log(`      Points:       ${rec.loyaltyPointsEarned ?? 'N/A'}`);
    if (rec.tierExclusive) {
      console.log(`      ** Tier Exclusive Deal **`);
    }
    console.log(`      Reasoning:    ${rec.reasoning}`);
  }

  printSubHeader('Applied Rules');
  if (response.metadata.appliedRules.length === 0) {
    console.log('  No partner rules applied.');
  } else {
    for (const rule of response.metadata.appliedRules) {
      console.log(`  - ${rule}`);
    }
  }
}

// --- Core demo logic ---

async function runDemoForMember(memberId: string): Promise<void> {
  printHeader(`Arrivia Travel Recommendations Demo — ${memberId}`);

  try {
    // Fetch member
    const member = await memberService.getMember(memberId);
    printMemberSummary(member);

    // Fetch partner config
    const partnerConfig = await partnerConfigService.getPartnerConfig(member.partnerId);
    printPartnerRules(partnerConfig);

    // Generate recommendations
    const rawRecs = await recommendationEngine.generateRecommendations(member, { memberId });
    const result: RuleEnforcementResult = ruleEnforcer.applyRules(rawRecs, partnerConfig, member.loyaltyTier);

    const response: RecommendationResponse = {
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

    printRecommendations(response);
  } catch (error) {
    console.error(`\n  Error: ${error instanceof Error ? error.message : String(error)}`);
  }

  console.log('\n' + '='.repeat(60) + '\n');
}

function listMembers(): void {
  printHeader('Available Members');
  for (const member of Object.values(MOCK_MEMBERS)) {
    console.log(`  ${member.memberId}  | ${member.loyaltyTier.padEnd(8)} | ${member.partnerId}`);
  }
  console.log('');
}

async function interactiveMode(): Promise<void> {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  const ask = (question: string): Promise<string> =>
    new Promise((resolve) => rl.question(question, resolve));

  printHeader('Arrivia Recommendations — Interactive Mode');
  listMembers();

  let running = true;
  while (running) {
    const input = await ask('\nEnter member ID (or "list", "quit"): ');
    const trimmed = input.trim().toLowerCase();

    if (trimmed === 'quit' || trimmed === 'q' || trimmed === 'exit') {
      running = false;
    } else if (trimmed === 'list' || trimmed === 'ls') {
      listMembers();
    } else if (trimmed) {
      await runDemoForMember(trimmed);
    }
  }

  rl.close();
  console.log('Goodbye!');
}

// --- CLI argument parsing ---

async function main(): Promise<void> {
  const args = process.argv.slice(2);

  if (args.includes('--list') || args.includes('-l')) {
    listMembers();
    return;
  }

  if (args.includes('--interactive') || args.includes('-i')) {
    await interactiveMode();
    return;
  }

  const memberIdx = args.indexOf('--member');
  if (memberIdx !== -1 && args[memberIdx + 1]) {
    await runDemoForMember(args[memberIdx + 1]);
    return;
  }

  // No args: show usage
  console.log('Arrivia Travel Recommendations CLI Demo');
  console.log('');
  console.log('Usage:');
  console.log('  npx tsx cli/demo.ts --member <memberId>    Run demo for a specific member');
  console.log('  npx tsx cli/demo.ts --interactive           Interactive mode');
  console.log('  npx tsx cli/demo.ts --list                  List available members');
  console.log('');
  console.log('Examples:');
  console.log('  npx tsx cli/demo.ts --member mem_001');
  console.log('  npx tsx cli/demo.ts -i');
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
