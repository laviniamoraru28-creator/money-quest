/** Run with: npx tsx scripts/test-local-progress-state.ts */
import {
  createDefaultState,
  computeLevel,
  applyActivityCompletion,
  createGoal,
  contributeToGoal,
  withdrawFromGoal,
  computeWeeksToGoal,
  removeGoal,
} from "../src/lib/local-progress/state";

let failures = 0;
function check(label: string, condition: boolean) {
  console.log(`${condition ? "✅" : "❌"} ${label}`);
  if (!condition) failures++;
}

// --- Level ---
check("Level 1 at 0 XP", computeLevel(0) === 1);
check("Level 2 at exactly 100 XP", computeLevel(100) === 2);
check("Level 1 at 99 XP (not yet)", computeLevel(99) === 1);

// --- Correctness-gated XP: the core improvement this rebuild makes ---
{
  const fresh = createDefaultState();
  const wrongAnswer = applyActivityCompletion(fresh, "lesson-1", false, 20, 500);
  check("An incorrect completion awards ZERO XP (the old system's design debt, fixed)", wrongAnswer.xpAwarded === 0);
  check("An incorrect completion awards ZERO coins", wrongAnswer.coinsAwarded === 0);
  check("An incorrect completion does not mark the activity as completed", wrongAnswer.state.completedActivityIds.length === 0);

  const correctAnswer = applyActivityCompletion(fresh, "lesson-1", true, 20, 500);
  check("A correct completion awards the full XP", correctAnswer.xpAwarded === 20);
  check("A correct completion awards the full coins", correctAnswer.coinsAwarded === 500);
  check("A correct completion marks the activity completed", correctAnswer.state.completedActivityIds.includes("lesson-1"));
  check("wasFirstCompletion is true the first time", correctAnswer.wasFirstCompletion);

  const replay = applyActivityCompletion(correctAnswer.state, "lesson-1", true, 20, 500);
  check("Replaying an already-completed activity awards no further XP (anti-farming)", replay.xpAwarded === 0);
  check("Replaying doesn't duplicate the completed-activity entry", replay.state.completedActivityIds.length === 1);
}

// --- Goals ---
{
  let state = createDefaultState();
  state = applyActivityCompletion(state, "a1", true, 10, 1000).state;
  state = createGoal(state, "A toy robot", 500);
  check("A new goal starts at 0 progress", state.goals[0].currentMinorUnits === 0);
  check("A new goal is not achieved", state.goals[0].achievedAt === null);

  const contributeResult = contributeToGoal(state, state.goals[0].id, 500);
  check("A valid contribution succeeds", contributeResult.success);
  check("Reaching the exact target achieves the goal", contributeResult.goalAchieved);
  check("Wallet balance decreases by the contributed amount", contributeResult.state.walletBalanceMinorUnits === 500);

  const overContribute = contributeToGoal(state, state.goals[0].id, 99999);
  check("Contributing more than the wallet holds fails safely, doesn't go negative", !overContribute.success && overContribute.state.walletBalanceMinorUnits === 1000);

  const afterRemoval = removeGoal(contributeResult.state, contributeResult.state.goals[0].id);
  check("Removing a goal actually removes it", afterRemoval.goals.length === 0);
}

// --- Savings Goal Adventure: withdraw ("what if you spend some?") ---
{
  let state = createDefaultState();
  state = applyActivityCompletion(state, "a1", true, 10, 1000).state;
  state = createGoal(state, "A bike", 800);
  state = contributeToGoal(state, state.goals[0].id, 300).state;
  check("Contribution landed before testing withdraw", state.goals[0].currentMinorUnits === 300);

  const withdrawResult = withdrawFromGoal(state, state.goals[0].id, 100);
  check("A valid withdrawal succeeds", withdrawResult.success);
  check("Withdrawing reduces the goal's progress", withdrawResult.state.goals[0].currentMinorUnits === 200);
  check("Withdrawing returns the money to the wallet", withdrawResult.state.walletBalanceMinorUnits === 800); // 1000 - 300 + 100

  const overWithdraw = withdrawFromGoal(state, state.goals[0].id, 99999);
  check(
    "Withdrawing more than the goal holds fails safely, doesn't go negative",
    !overWithdraw.success && overWithdraw.state.goals[0].currentMinorUnits === 300
  );

  const zeroWithdraw = withdrawFromGoal(state, state.goals[0].id, 0);
  check("Withdrawing zero or less is rejected, not treated as a no-op success", !zeroWithdraw.success);

  const achievedState = contributeToGoal(state, state.goals[0].id, 500).state; // reaches 800/800
  check("Goal is achieved before testing withdraw-after-achieved", achievedState.goals[0].achievedAt !== null);
  const withdrawAfterAchieved = withdrawFromGoal(achievedState, achievedState.goals[0].id, 50);
  check("Withdrawing from an already-achieved goal is rejected", !withdrawAfterAchieved.success);
}

// --- Savings Goal Adventure: the "plan it out" weeks calculation ---
{
  check("A sensible rate rounds UP to the next whole week (partial weeks still count as a week)", computeWeeksToGoal(1000, 300) === 4); // 3.33 -> 4
  check("An exact multiple takes exactly that many weeks", computeWeeksToGoal(900, 300) === 3);
  check("Zero remaining takes zero weeks, regardless of rate", computeWeeksToGoal(0, 300) === 0);
  check("A zero weekly rate returns null (undefined, not Infinity)", computeWeeksToGoal(1000, 0) === null);
  check("A negative weekly rate also returns null", computeWeeksToGoal(1000, -50) === null);
}

// --- Reset ---
{
  const fresh = createDefaultState();
  check("A fresh/reset state has zero XP", fresh.xpTotal === 0);
  check("A fresh/reset state has zero wallet balance", fresh.walletBalanceMinorUnits === 0);
  check("A fresh/reset state has no completed activities", fresh.completedActivityIds.length === 0);
  check("A fresh/reset state has no goals", fresh.goals.length === 0);
}

console.log(failures === 0 ? "\n✅ All local progress state checks passed." : `\n❌ ${failures} check(s) failed.`);
process.exit(failures === 0 ? 0 : 1);
