import { NimbusExperiment, Branch } from "./types";
import { factories } from "./messaging-factories";

export interface UserInput {
  slug: string;
  featureId: string;
  application: string;
  audience: string;
  channel: string;
  minVersion: string;
  populationPercentage: number;
}

export function renderDesktopTargetingString(userInput: UserInput) {
  let targetingString = `version|versionCompare('${userInput.minVersion}')`;
  if (userInput.channel) {
    targetingString += ` && browserSettings.update.channel == '${userInput.channel}'`;
  }
  if (userInput.audience) {
    targetingString += ` && ${userInput.audience}`;
  }
  return targetingString;
}

export function generateFromInput(userInput: UserInput) {
  const branches = ["control", "treatment"].map(
    (branchSlug): Branch => {
      const branch: Branch = {
        slug: branchSlug,
        ratio: 1,
      };
      if (userInput.featureId) {
        const factory = factories[userInput.featureId];
        branch.feature = {
          featureId: userInput.featureId,
          enabled: true,
          value: factory ? factory(userInput.slug, branchSlug) : {},
        };
      }
      return branch;
    }
  );

  const result: NimbusExperiment = {
    slug: userInput.slug,
    id: userInput.slug,
    application: userInput.application,
    userFacingName: "TODO Name",
    userFacingDescription: "TODO Desc",
    isEnrollmentPaused: false,
    bucketConfig: {
      namespace: userInput.featureId ? userInput.featureId : userInput.slug,
      randomizationUnit:
        userInput.application === "firefox-desktop"
          ? "normandy_id"
          : "nimbus_id",
      start: 0,
      count: userInput.populationPercentage * 100,
      total: 10000,
    },
    probeSets: [],
    startDate: null,
    endDate: null,
    proposedEnrollment: 7,
    referenceBranch: "control",
    branches,
  };

  if (userInput.application === "firefox-desktop") {
    result.targeting = renderDesktopTargetingString(userInput);
  }

  return result;
}
