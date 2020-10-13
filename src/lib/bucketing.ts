// Copied from https://searchfox.org/mozilla-central/source/toolkit/components/utils/jsm

/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

"use strict";
import * as crypto from "crypto";

import { BucketConfig, NimbusExperiment } from "./experiments";
import { v4 as uuidv4 } from "uuid";

const hashBits = 48;
const hashLength = hashBits / 4; // each hexadecimal digit represents 4 bits
// eslint-disable-next-line no-mixed-operators
const hashMultiplier = 2 ** hashBits - 1;

/**
 * Map from the range [0, 1] to [0, 2^48].
 * @param  {number} frac A float from 0.0 to 1.0.
 * @return {string} A 48 bit number represented in hex, padded to 12 characters.
 */
function fractionToKey(frac: number): string {
  if (frac < 0 || frac > 1) {
    throw new Error(`frac must be between 0 and 1 inclusive (got ${frac})`);
  }

  return Math.floor(frac * hashMultiplier)
    .toString(16)
    .padStart(hashLength, "0");
}

/**
 * Check if an input hash is contained in a bucket range.
 *
 * isHashInBucket(fractionToKey(0.5), 3, 6, 10) -> returns true
 *
 *              minBucket
 *              |     hash
 *              v     v
 *    [0, 1, 2, 3, 4, 5, 6, 7, 8, 9]
 *                       ^
 *                       maxBucket
 *
 * @param {string} inputHash Input hash
 * @param {int} minBucket The lower boundary, inclusive, of the range to check.
 * @param {int} maxBucket The upper boundary, exclusive, of the range to check.
 * @param {int} bucketCount The total number of buckets. Should be greater than or equal to maxBucket.
 * @returns {boolean} is the hash in the bucket range?
 */
function isHashInBucket(
  inputHash: string,
  minBucket: number,
  maxBucket: number,
  bucketCount: number
): boolean {
  const minHash = fractionToKey(minBucket / bucketCount);
  const maxHash = fractionToKey(maxBucket / bucketCount);
  return minHash <= inputHash && inputHash < maxHash;
}

/**
 * @param {any} data Any input
 * @promise A hash of `data`, truncated to the 12 most significant characters.
 */
async function truncatedHash(data: any): Promise<string> {
  const input = new TextEncoder().encode(JSON.stringify(data));

  // const hash = await hasher.digest("SHA-256", input);
  // return bufferToHex(hash).slice(0, 12);

  // truncate hash to 12 characters (2^48), because the full hash is larger
  // than JS can meaningfully represent as a number.
  return crypto.createHmac("sha256", input).digest("hex").slice(0, 12);
}

/**
 * Sample by splitting the input into two buckets, one with a size (rate) and
 * another with a size (1.0 - rate), and then check if the input's hash falls
 * into the first bucket.
 *
 * @param    {object}  input Input to hash to determine the sample.
 * @param    {Number}  rate  Number between 0.0 and 1.0 to sample at. A value of
 *                           0.25 returns true 25% of the time.
 * @promises {boolean} True if the input is in the sample.
 */
export async function stableSample(input: any, rate: number) {
  const inputHash = await truncatedHash(input);
  const samplePoint = fractionToKey(rate);

  return inputHash < samplePoint;
}

/**
 * Sample by splitting the input space into a series of buckets, and checking
 * if the given input is in a range of buckets.
 *
 * The range to check is defined by a start point and length, and can wrap
 * around the input space. For example, if there are 100 buckets, and we ask to
 * check 50 buckets starting from bucket 70, then buckets 70-99 and 0-19 will
 * be checked.
 *
 * @param {object}     input Input to hash to determine the matching bucket.
 * @param {integer}    start Index of the bucket to start checking.
 * @param {integer}    count Number of buckets to check.
 * @param {integer}    total Total number of buckets to group inputs into.
 * @promises {boolean} True if the given input is within the range of buckets
 *                     we're checking. */
export async function bucketSample(
  input: any,
  start: number,
  count: number,
  total: number
) {
  const inputHash = await truncatedHash(input);
  const wrappedStart = start % total;
  const end = wrappedStart + count;

  // If the range we're testing wraps, we have to check two ranges: from start
  // to max, and from min to end.
  if (end > total) {
    return (
      isHashInBucket(inputHash, 0, end % total, total) ||
      isHashInBucket(inputHash, wrappedStart, total, total)
    );
  }

  return isHashInBucket(inputHash, wrappedStart, end, total);
}

/**
 * Sample over a list of ratios such that, over the input space, each ratio
 * has a number of matches in correct proportion to the other ratios.
 *
 * For example, given the ratios:
 *
 * [1, 2, 3, 4]
 *
 * 10% of all inputs will return 0, 20% of all inputs will return 1, 30% will
 * return 2, and 40% will return 3. You can determine the percent of inputs
 * that will return an index by dividing the ratio by the sum of all ratios
 * passed in. In the case above, 4 / (1 + 2 + 3 + 4) == 0.4, or 40% of the
 * inputs.
 *
 * @param {any} input The input to the sample
 * @param {Array<integer>} ratios List of ratios
 * @promises {integer}
 *   Index of the ratio that matched the input
 * @rejects {Error}
 *   If the list of ratios doesn't have at least one element
 */
export async function ratioSample(input: any, ratios: Array<number>) {
  if (ratios.length === 0) {
    throw new Error(
      `ratios must be at least 1 element long (got length: ${ratios.length})`
    );
  }

  const inputHash = await truncatedHash(input);
  const ratioTotal = ratios.reduce((acc, ratio) => acc + ratio);

  let samplePoint = 0;
  for (let k = 0; k < ratios.length - 1; k++) {
    samplePoint += ratios[k];
    if (inputHash <= fractionToKey(samplePoint / ratioTotal)) {
      return k;
    }
  }

  // No need to check the last bucket if the others didn't match.
  return ratios.length - 1;
}

export function isInBucketAllocation(
  bucketConfig: BucketConfig,
  randomizationUnitUniqueId: string
): Promise<boolean> {
  return bucketSample(
    [randomizationUnitUniqueId, bucketConfig.namespace],
    bucketConfig.start,
    bucketConfig.count,
    bucketConfig.total
  );
}

export async function chooseBranch(
  { branches, slug, application }: NimbusExperiment,
  randomizationUnitUniqueId: string
) {
  let sdkId: string;
  switch (application) {
    case "desktop":
      // https://searchfox.org/mozilla-central/source/toolkit/components/messaging-system/experiments/ExperimentManager.jsm
      sdkId = "experimentmanager";
      break;
    default:
      sdkId = "nimbus";
  }
  const ratios = branches.map(({ ratio = 1 }) => ratio);

  // It's important that the input be:
  // - Unique per-user (no one is bucketed alike)
  // - Unique per-experiment (bucketing differs across multiple experiments)
  // - Differs from the input used for sampling the recipe (otherwise only
  //   branches that contain the same buckets as the recipe sampling will
  //   receive users)
  const input = `${sdkId}-${randomizationUnitUniqueId}-${slug}-branch`;

  const index = await ratioSample(input, ratios);
  return branches[index];
}

/**
 * Generate Normandy UserId respective to a branch
 * for a given experiment recipe
 *
 * @param {ExperimentRecipe} recipe An Experiment recipe
 * @param {string} recipe.arguments.slug
 * @param {Array<{slug: string; ratio: number}>} recipe.arguments.branches
 * @param {{namespace: string; start: number; count: number; total: number;}?} recipe.arguments.bucketConfig
 * @param {targeting?} recipe.targeting
 * @returns {Promise<{[branchName: string]: string}>} An object where
 * the keys are branch names and the values are user IDs that will enroll
 * a user for that particular branch. Also includes a `notInExperiment` value
 * that will not enroll the user in the experiment
 */
export async function getTestIds(experiment: NimbusExperiment) {
  const branchValues: { [branchId: string]: string } = {};
  const { branches, bucketConfig } = experiment;

  while (Object.keys(branchValues).length < branches.length + 1) {
    const id = uuidv4();
    const enrolls = await bucketSample(
      [id, bucketConfig.namespace],
      bucketConfig.start,
      bucketConfig.count,
      bucketConfig.total
    );
    // Does this id enroll the user in the experiment
    if (enrolls) {
      // Choose a random branch
      const { slug: pickedBranch } = await chooseBranch(experiment, id);

      if (!Object.keys(branchValues).includes(pickedBranch)) {
        branchValues[pickedBranch] = id;
      }
    } else if (!branchValues.notInExperiment) {
      branchValues.notInExperiment = id;
    }
  }

  return branchValues;
}
