import { Command } from "@oclif/command";
import { prompt } from "inquirer";
import chalk from "chalk";
import fetch from "node-fetch";
import {
  uniqueNamesGenerator,
  adjectives,
  colors,
} from "unique-names-generator";
import audiences from "../lib/audiences";
import { UserInput, generateFromInput } from "../lib/generate-from-input";
import { getFirefoxDesktopReleases } from "../lib/release-utils";
import { openRS } from "../lib/open-rs";

function whenDesktop(answers: UserInput) {
  return answers.application === "firefox-desktop";
}

export default class Create extends Command {
  static description = "create a nimbus experiment";

  async run() {
    const desktopVersions = await getFirefoxDesktopReleases();

    const userInput: UserInput = await prompt([
      {
        type: "input",
        name: "slug",
        message: "Choose a unique experiment slug (hyphen-separated)",
        default: uniqueNamesGenerator({
          dictionaries: [adjectives, colors],
          separator: "-",
          length: 2,
        }),
        async validate(value) {
          const resp = await fetch(
            `https://experimenter.services.mozilla.com/api/v4/experiments/${value}/`
          );
          if (resp.status !== 404) {
            return "That name is taken, please choose a unique name";
          }
          return true;
        },
      },
      {
        type: "input",
        name: "userFacingName",
        message: "Choose a public name",
        default: "Diagnostic test experiment",
      },
      {
        type: "input",
        name: "userFacingDescription",
        message: "Choose a public description",
        default: "This is a test experiment for diagnostic purposes.",
      },
      {
        type: "list",
        name: "application",
        message: "Which application do you want to run your experiment on?",
        choices: ["firefox-desktop", "fenix", "reference-browser"],
      },
      {
        type: "list",
        name: "channel",
        message: "Which channel do you want to target?",
        choices: [{ name: "(any)", value: "" }, "nightly", "beta", "release"],
        default: "",
        when: whenDesktop,
      },
      {
        type: "list",
        name: "minVersion",
        message:
          "What is the minimum Firefox version your experiment should run on?",
        choices: desktopVersions,
        when: whenDesktop,
      },
      {
        type: "input",
        name: "customMinVersion",
        message: "Custom minimum version (e.g. 82.1)",
        when(answers) {
          return whenDesktop(answers) && !answers.minVersion;
        },
      },
      {
        type: "list",
        name: "featureId",
        message: "Which feature do you want configure?",
        choices: [
          { name: "(none)", value: "" },
          "about-welcome",
          "cfr",
          "moments",
          "custom...",
        ],
        default: "",
        when: whenDesktop,
      },
      {
        type: "input",
        name: "customFeatureId",
        message: "Enter your custom feature id",
        when(answers) {
          return answers.featureId === "custom";
        },
      },
      {
        type: "list",
        name: "audience",
        message: "Which audience?",
        choices: [
          { name: "(none)", value: "" },
          ...Object.values(audiences).map(({ name, targeting }) => ({
            name,
            value: targeting,
          })),
        ],
        when: whenDesktop,
      },
      {
        type: "number",
        name: "populationPercentage",
        message: "What percentage of the population?",
        default: 1,
      },
    ]);

    const result = generateFromInput(userInput);

    this.log(JSON.stringify(result, null, 2));

    const { shouldTest } = await prompt([
      {
        type: "confirm",
        name: "shouldTest",
        message: "Do you want to test your experiment?",
        default: false,
      },
    ]);
    if (!shouldTest) {
      return;
    }

    const collectionId = whenDesktop(userInput)
      ? "nimbus-desktop-experiments"
      : "nimbus-mobile-experiments";

    await prompt([
      {
        type: "confirm",
        name: "isConnected",
        message: `First, make sure you are connected to the VPN. Have you finished connecting?`,
        default: true,
      },
    ]);

    this.log("> Ok, first you will need to open the Remote Settings admin.");
    const url = await openRS(collectionId);
    this.log(
      chalk.grey(`  If it doesn't open automatically, open this URL in your browser:
  ${url}`)
    );

    await prompt([
      {
        type: "confirm",
        name: "hasPasted",
        message:
          "Have you pasted in your JSON and pressed the 'Create record' button?",
        default: true,
      },
    ]);

    await prompt([
      {
        type: "confirm",
        name: "hasRequestedReview",
        message: "Ok, now look for the 'Request Review' button and press that.",
        default: true,
      },
    ]);

    this
      .log(`> Good job! Now you need to ask someone to review your staging changes.
  After that, your experiment should show up here:
  https://settings.stage.mozaws.net/v1/buckets/main/collections/${collectionId}/records`);
  }
}
