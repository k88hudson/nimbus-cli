import { NimbusExperiment, Branch } from "./experiments";
import { factories } from "./messaging-factories";

export interface UserInput {
  slug: string;
  featureId: string;
  application: string;
  audience: string;
  channel: string;
  minVersion: string;
  customMinVersion?: string;
  customFeatureId?: string;
  populationPercentage: number;
  userFacingDescription: string;
  userFacingName: string;
}

export function renderDesktopTargetingString(userInput: UserInput) {
  const minVersion = userInput.customMinVersion || userInput.minVersion;
  let targetingString = `version|versionCompare('${minVersion}') <= 0`;
  if (userInput.channel) {
    targetingString += ` && channel == '${userInput.channel}'`;
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
          featureId: userInput.customFeatureId || userInput.featureId,
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
    userFacingName: userInput.userFacingName,
    userFacingDescription: userInput.userFacingDescription,
    isEnrollmentPaused: false,
    bucketConfig: {
      namespace: userInput.slug,
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
