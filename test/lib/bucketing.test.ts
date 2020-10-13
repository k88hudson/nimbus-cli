import { expect } from "@oclif/test";
import { isInBucketAllocation, chooseBranch } from "../../src/lib/bucketing";

const REFERENCE_EXPERIMENT = {
  slug: "devoted-coral",
  endDate: null,
  branches: [
    {
      slug: "control",
      ratio: 1,
    },
    {
      slug: "treatment",
      ratio: 1,
    },
  ],
  probeSets: [],
  startDate: null,
  targeting: "version|versionCompare('83.0a1') <= 0",
  application: "firefox-desktop",
  bucketConfig: {
    count: 1000,
    start: 0,
    total: 10000,
    namespace: "devoted-coral",
    randomizationUnit: "normandy_id",
  },
  userFacingName: "Diagnostic test experiment",
  referenceBranch: "control",
  isEnrollmentPaused: false,
  proposedEnrollment: 7,
  userFacingDescription: "This is a test experiment for diagnostic purposes.",
  id: "devoted-coral",
  last_modified: 1602606290626,
};

const EXPECTED = {
  notInExperiment: "06fc73e8-c985-47eb-b092-ee43bc3c3d8a",
  control: "90beb0f6-801a-4e5b-80f6-34538a997bc3",
  treatment: "fb9e106c-f018-42a2-b03d-19a39e15df16",
};

describe("isInBucketAllocation", () => {
  it("should allocate into experiment for treatment", async () => {
    expect(
      await isInBucketAllocation(
        REFERENCE_EXPERIMENT.bucketConfig,
        EXPECTED.treatment
      )
    ).to.be.true;
  });
  it("should allocate into experiment for control", async () => {
    expect(
      await isInBucketAllocation(
        REFERENCE_EXPERIMENT.bucketConfig,
        EXPECTED.control
      )
    ).to.be.true;
  });
  it("should not allocate into experiment", async () => {
    expect(
      await isInBucketAllocation(
        REFERENCE_EXPERIMENT.bucketConfig,
        EXPECTED.notInExperiment
      )
    ).to.be.false;
  });
});

describe("chooseBranch", () => {
  it("should choose the treatment branch", async () => {
    expect(
      (await chooseBranch(REFERENCE_EXPERIMENT, EXPECTED.treatment)).slug
    ).equal("treatment");
  });

  it("should choose the control branch", async () => {
    expect(
      (await chooseBranch(REFERENCE_EXPERIMENT, EXPECTED.control)).slug
    ).equal("control");
  });
});
