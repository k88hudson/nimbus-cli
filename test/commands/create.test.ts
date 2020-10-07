import { expect, test } from "@oclif/test";

describe("create", () => {
  test
    .stdout()
    .command(["help"])
    .it("runs help", (ctx) => {
      expect(ctx.stdout).to.contain(
        "An experimental cli for creating nimbus experiments"
      );
    });
});
