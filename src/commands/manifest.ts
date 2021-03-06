import { Command, flags } from "@oclif/command";
import chalk from "chalk";
import fetch from "node-fetch";
import { NodeVM } from "vm2";
import { renderSchema, ManifestConfig } from "../lib/manifest-to-schema";

function getDesktopManifestURI(subpath: string): string {
  return `https://hg.mozilla.org/${subpath}/raw-file/tip/toolkit/components/nimbus/FeatureManifest.js`;
}

const vm = new NodeVM({ wrapper: "none" });

const DESKTOP_CHANNELS = {
  nightly: "mozilla-central",
  beta: "releases/mozilla-beta",
  release: "releases/mozilla-releases",
};
type Channel = keyof typeof DESKTOP_CHANNELS;

export default class Manifest extends Command {
  static description = "Download nimbus manifest (Desktop only right now)";

  static flags = {
    channel: flags.string({
      description: "Channel. NOTE: Desktop only",
      char: "c",
      default: "nightly",
      options: Object.keys(DESKTOP_CHANNELS),
    }),
    schema: flags.string({
      description: "Convert variables for manifest entry to json schema",
    }),
  };

  async fetchManifest(channel: Channel): Promise<string> {
    const uri = getDesktopManifestURI(DESKTOP_CHANNELS[channel]);
    try {
      const resp = await fetch(uri);
      if (resp.ok) {
        return resp.text();
      }
    } catch (error) {
      this.log(chalk.red(error));
    }
    this.log(`No manifest found at ${uri}`);
    return Promise.resolve("");
  }

  async run() {
    const { flags } = this.parse(Manifest);
    const result = await this.fetchManifest(flags.channel as Channel);
    if (!result) {
      throw new Error("No manifest found");
    }

    const manifest = vm.run(result + "\nreturn FeatureManifest;");
    if (!manifest) {
      throw new Error("Tried to parse manfiest but no result was returned");
    }
    if (flags.schema) {
      const config = manifest[flags.schema];
      if (!config) {
        throw new Error(
          `No manifest entry found for ${
            flags.schema
          }. Entries include ${Object.keys(manifest).join(", ")}`
        );
      }
      this.log(
        JSON.stringify(
          renderSchema(flags.schema, config as ManifestConfig),
          null,
          2
        )
      );
    } else {
      this.log(JSON.stringify(manifest, null, 2));
    }
  }
}
