import { Command } from "@oclif/command";
import { prompt } from "inquirer";
import fetch from "node-fetch";
import {
  uniqueNamesGenerator,
  adjectives,
  colors,
} from "unique-names-generator";
import audiences from "../lib/audiences";
import { UserInput, generateFromInput } from "../lib/generate-from-input";
import { getFirefoxDesktopReleases } from "../lib/release-utils";

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
        message: "Choose a unique experiments slug (hyphen-separated)",
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
        type: "list",
        name: "application",
        message: "Which application do you want to run your experiment on?",
        choices: ["firefox-desktop", "fenix"],
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
          return !answers.minVersion;
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
  }
}
