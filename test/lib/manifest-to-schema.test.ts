import { expect } from "@oclif/test";
import { renderSchema, ManifestConfig } from "../../src/lib/manifest-to-schema";
import Ajv from "ajv";
const ajv = new Ajv();

const REFERENCE_MANIFEST: ManifestConfig = {
  description: "A test manifest",
  variables: {
    enabled: {
      type: "boolean",
    },
    text: {
      type: "string",
    },
    count: {
      type: "int",
    },
    options: {
      type: "json",
    },
  },
};

const parse = ajv.compile(renderSchema("quicksuggest", REFERENCE_MANIFEST));

describe("manifestToSchema", () => {
  it("should validate valid variables", () => {
    const output = parse({
      enabled: true,
      text: "hi",
      count: 5,
      options: {
        foo: "bar",
      },
    });
    expect(output).to.be.true;
  });
  it("should validate invalid variables", () => {
    const output = parse({
      enabled: "invalid",
    });
    expect(output).to.be.false;
  });
  it("should not allow additional properties", () => {
    const output = parse({
      enabled: true,
      something: false,
    });
    expect(output).to.be.false;
  });
});
