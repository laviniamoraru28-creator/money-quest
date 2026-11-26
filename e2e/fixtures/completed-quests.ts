import {EQ_STAGES} from "../../src/content/entrepreneur-quest/structures";
import {LQ_MISSIONS} from "../../src/content/leadership-quest/structures";
import {createDefaultState, runSimulator} from "../../src/lib/entrepreneur-quest/state";

export function completedBusiness() {
  const state = createDefaultState();
  return {...state, pitchCompleted:true, completedStageIds:EQ_STAGES.map(stage => stage.id),
    latestSimulatorRun:runSimulator(state.business, {
      materialsMinorUnits:2000, packagingMinorUnits:500, advertisingMinorUnits:1000, savedAsideMinorUnits:1500,
    })};
}

export const completedLeadershipIds = LQ_MISSIONS.map(mission => mission.id);
