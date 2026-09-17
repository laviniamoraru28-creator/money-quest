/** Run with: npx tsx scripts/test-simulator-engine.ts
 * Exercises applyWeek() against every event type, including the two
 * "shortfall vs covered" branches for expense events and the
 * "goal met vs not yet" branches for milestone events — the exact
 * places a logic bug would silently produce a wrong running balance. */
import { applyWeek, getSpendableIncome } from "../src/simulator/engine";
import { createInitialState } from "../src/simulator/types";
import type { SimScenario, WeekAllocation } from "../src/simulator/types";

let failures = 0;
function check(label: string, actual: unknown, expected: unknown) {
  const pass = JSON.stringify(actual) === JSON.stringify(expected);
  console.log(`${pass ? "✅" : "❌"} ${label}: got ${JSON.stringify(actual)}, expected ${JSON.stringify(expected)}`);
  if (!pass) failures++;
}

const scenario: SimScenario = {
  key: "test",
  title: "Test Scenario",
  ageBand: "explorer",
  difficulty: "standard",
  startingBalanceMinorUnits: 0,
  savingsGoal: { name: "Test Goal", targetMinorUnits: 1000 },
  xpReward: 10,
  coinRewardMinorUnits: 100,
  estimatedMinutes: 3,
  weeks: [
    { id: "w1", weekLabel: "Week 1", incomeMinorUnits: 1000 },
    {
      id: "w2",
      weekLabel: "Week 2",
      incomeMinorUnits: 1000,
      event: {
        id: "e2",
        type: "expense",
        title: "Lost water bottle",
        description: "You need a new one.",
        costMinorUnits: 300,
        expenseConsequenceCovered: "Your buffer covered it!",
        expenseConsequenceShortfall: "You had to dip into savings.",
      },
    },
    {
      id: "w3",
      weekLabel: "Week 3",
      incomeMinorUnits: 1000,
      event: {
        id: "e3",
        type: "opportunity",
        title: "Game on sale",
        description: "Buy it or skip it?",
        choices: [
          { key: "buy", label: "Buy it", category: "wants", costMinorUnits: 500, consequence: "You bought the game." },
          { key: "skip", label: "Skip it", category: "wants", costMinorUnits: 0, consequence: "You kept your coins." },
        ],
      },
    },
    {
      id: "w4",
      weekLabel: "Week 4",
      incomeMinorUnits: 500,
      event: { id: "e4", type: "windfall", title: "Birthday money!", description: "Extra coins!", bonusMinorUnits: 500 },
    },
    {
      id: "w5",
      weekLabel: "Week 5",
      incomeMinorUnits: 0,
      event: {
        id: "e5",
        type: "milestone",
        title: "Goal check",
        description: "",
        celebrationMessage: "You reached your goal!",
        notYetMessage: "Not quite yet — keep going!",
      },
    },
  ],
};

let state = createInitialState(scenario);

// noUncheckedIndexedAccess correctly flags scenario.weeks[n] as possibly
// undefined — TypeScript can't retain "this literal has exactly 5
// elements" through the SimWeek[] type on SimScenario. Destructuring
// once here, with an explicit guard, replaces every later
// scenario.weeks[n] indexing with a named, guaranteed-defined
// variable — safer than repeating a check at each of the 7 places
// below that used to index directly, and more readable too.
const [week1, week2, week3, week4, week5] = scenario.weeks;
if (!week1 || !week2 || !week3 || !week4 || !week5) {
  throw new Error("Test scenario must have exactly 5 weeks — fix the scenario literal above");
}

// Week 1: plain week, no event. Allocate evenly-ish.
const w1Alloc: WeekAllocation = { needs: 400, wants: 300, savings: 200, giving: 50, unexpected: 50 };
check("Week 1 spendable income", getSpendableIncome(week1), 1000);
let result = applyWeek(state, scenario, week1, w1Alloc);
state = result.newState;
check("After week 1, balance (200 savings + 50 unexpected)", state.balanceMinorUnits, 250);
check("After week 1, totalSavings", state.totalSavingsMinorUnits, 200);

// Week 2: expense event, cost 300, buffer allocation only 200 -> shortfall of 100
const w2Alloc: WeekAllocation = { needs: 400, wants: 300, savings: 100, giving: 0, unexpected: 200 };
result = applyWeek(state, scenario, week2, w2Alloc);
state = result.newState;
// balance before event: 250 + 100(savings) + 200(unexpected) = 550
// expense cost 300: covered by 200 buffer, shortfall 100 drawn from balance
// balance after: 550 - 200(buffer consumed) - 100(shortfall) = 250
check("After week 2 (expense with shortfall), balance", state.balanceMinorUnits, 250);
check("Week 2 consequence is the shortfall message", result.eventConsequence, "You had to dip into savings.");
check("Total unexpected spent tracks full cost even on shortfall", state.totalUnexpectedSpentMinorUnits, 300);

// Week 3: opportunity event, child chooses to buy (cost 500 from wants)
const w3Alloc: WeekAllocation = { needs: 400, wants: 300, savings: 200, giving: 50, unexpected: 50 };
result = applyWeek(state, scenario, week3, w3Alloc, "buy");
state = result.newState;
// balance before choice: 250 + 200(savings) + 50(unexpected) = 500
// choice cost 500 drawn from balance -> 0
check("After week 3 (bought the game), balance", state.balanceMinorUnits, 0);
check("Week 3 wants total includes base wants across all weeks plus the choice cost", state.totalWantsMinorUnits, 300 + 300 + 300 + 500);

// Week 4: windfall — spendable income should be 500 base + 500 bonus = 1000
check("Week 4 spendable income includes windfall bonus", getSpendableIncome(week4), 1000);
const w4Alloc: WeekAllocation = { needs: 300, wants: 200, savings: 400, giving: 50, unexpected: 50 };
result = applyWeek(state, scenario, week4, w4Alloc);
state = result.newState;
check("After week 4, totalSavings", state.totalSavingsMinorUnits, 200 + 100 + 200 + 400);

// Week 5: milestone check. totalSavings so far = 900, goal target = 1000 -> NOT yet met
const w5Alloc: WeekAllocation = { needs: 0, wants: 0, savings: 0, giving: 0, unexpected: 0 };
result = applyWeek(state, scenario, week5, w5Alloc);
check("Milestone NOT falsely celebrated when goal isn't actually met", result.eventConsequence, "Not quite yet — keep going!");

console.log(failures === 0 ? "\n✅ All simulator engine checks passed." : `\n❌ ${failures} check(s) failed.`);

// --- Separate scenario: exercise the "expense fully covered by buffer" branch,
// which the main run above never hits (it only tests the shortfall branch).
const coveredScenario: SimScenario = { ...scenario, startingBalanceMinorUnits: 0 };
let coveredState = createInitialState(coveredScenario);
const coveredWeek = {
  id: "cw",
  weekLabel: "Covered Week",
  incomeMinorUnits: 1000,
  event: {
    id: "ce",
    type: "expense" as const,
    title: "Small repair",
    description: "A small cost.",
    costMinorUnits: 200,
    expenseConsequenceCovered: "Your buffer covered it completely!",
    expenseConsequenceShortfall: "You had to dip into savings.",
  },
};
const coveredAlloc: WeekAllocation = { needs: 400, wants: 300, savings: 50, giving: 50, unexpected: 200 };
const coveredResult = applyWeek(coveredState, coveredScenario, coveredWeek, coveredAlloc);
check("Expense fully covered by buffer: consequence is the COVERED message", coveredResult.eventConsequence, "Your buffer covered it completely!");
check("Expense fully covered: balance unaffected beyond the buffer itself (50 savings + 0 leftover unexpected)", coveredResult.newState.balanceMinorUnits, 50);

console.log(failures === 0 ? "\n✅ All checks (including covered-branch) passed." : `\n❌ ${failures} total check(s) failed.`);
process.exit(failures === 0 ? 0 : 1);
