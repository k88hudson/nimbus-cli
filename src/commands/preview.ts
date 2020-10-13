import { Command } from "@oclif/command";
import { prompt, DistinctQuestion } from "inquirer";
import chalk from "chalk";
import fetch from "node-fetch";
import { getTestIds } from "../lib/bucketing";
import { NimbusExperiment } from "../lib/experiments";

interface UserInput {
  env: RSEnvironment;
  collectionId: Collection;
  slug: string;
}

type Record = NimbusExperiment;

const ENDPOINTS = {
  release: "firefox.settings.services.mozilla.com",
  staging: "settings.stage.mozaws.net",
};
type RSEnvironment = keyof typeof ENDPOINTS;
type Collection = "nimbus-desktop-experiments" | "nimbus-mobile-experiments";

async function getRecordsForCollection(
  collectionId: Collection,
  env: RSEnvironment
): Promise<Array<Record>> {
  const url = `https://${ENDPOINTS[env]}/v1/buckets/main/collections/${collectionId}/records`;
  const resp = await fetch(url);
  if (!resp.ok) {
    return [];
  }
  return (await resp.json()).data;
}

async function getPromptValue<T>(question: DistinctQuestion<T>) {
  const { value }: { value?: T } = await prompt([
    { ...question, name: "value" },
  ]);
  return value;
}

// async function findSlug(slug: string) {
//   for (const collectionId of [
//     "nimbus-desktop-experiments",
//     "nimbus-mobile-experiments",
//   ]) {
//     const records = await getRecordsForCollection(collectionId, "staging");
//     const foundRecord = records.find((r) => r.slug === slug);
//     if (foundRecord) {
//       return foundRecord;
//     }
//   }
// }

async function getSlugs({
  collectionId,
  env,
}: UserInput): Promise<{ valid: NimbusExperiment[]; invalid: string[] }> {
  const invalid: Array<string> = [];
  const records = (await getRecordsForCollection(collectionId, env)).filter(
    (exp) => {
      if (!exp.slug) {
        invalid.push(exp.id);
        return false;
      }
      return true;
    }
  );
  return { invalid, valid: records };
}

export default class Preview extends Command {
  static description = "find test ids to force an experiment branch";

  async run() {
    const userInput: UserInput = await prompt([
      {
        type: "list",
        name: "env",
        message: "Which environment?",
        choices: ["staging", "release"],
        default: "staging",
      },
      {
        type: "list",
        name: "collectionId",
        message: "Which collection?",
        choices: ["nimbus-mobile-experiments", "nimbus-desktop-experiments"],
      },
    ]);
    const { valid, invalid } = await getSlugs(userInput);

    if (invalid.length > 0) {
      this.log(
        `Found some invalid experiments in this collection: ${JSON.stringify(
          invalid,
          null,
          2
        )}`
      );
    }
    if (valid.length <= 0) {
      this.log(
        `Sorry, no valid experiments found in this environment/collection: ${JSON.stringify(
          userInput,
          null,
          2
        )}`
      );
      return;
    }

    const slug = await getPromptValue<string>({
      type: "list",
      message: "Which slug",
      choices: valid.map((r) => r.slug),
    });

    if (slug) {
      const record = valid.find((r) => r.slug === slug);

      this.log(chalk.underline("Here's your experiment config:"));
      this.log(JSON.stringify(record, null, 2));

      if (!record) {
        return;
      }

      const branchValues = await getTestIds(record);

      this.log(
        chalk.underline.yellow("\n--------- TESTING INSTRUCTIONS ---------\n")
      );
      const printedPrefs = Object.entries(branchValues)
        .map(([key, value]) => `  ${chalk.grey(`#${key}`)}\n  ${value}`)
        .join("\n\n");

      this.log(
        `In order to force your browser to enroll in one of the branches for
this experiment, you must set your ${chalk.yellow(
          record.bucketConfig.randomizationUnit
        )} to one of the following values:\n\n${printedPrefs}\n`
      );

      if (record.bucketConfig.randomizationUnit === "normandy_id") {
        this.log(
          `For Desktop, you can set normandy_id by changing your ${chalk.yellow(
            "app.normandy.user_id"
          )} pref.`
        );
      }

      if (record.targeting) {
        this
          .log(`Don't forget you must also satisfy the following targeting expression:\n
  ${chalk.yellow(record.targeting)}\n`);
      }
    }
  }
}
