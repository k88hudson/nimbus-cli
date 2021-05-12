type ValidVariableType = "string" | "boolean" | "int" | "json";

export interface ManifestConfig {
  description: string;
  variables?: {
    [key: string]: {
      type: ValidVariableType;
      fallbackPref?: string;
      choices?: any[];
    };
  };
}

const VALID_TYPES = {
  boolean: {
    type: "boolean",
  },
  int: {
    type: "integer",
  },
  string: {
    type: "string",
  },
  json: {
    type: "object",
    additionalProperties: {},
  },
};

export function renderSchema(featureId: string, manifest: ManifestConfig) {
  const properties: Record<string, any> = {};
  if (manifest.variables) {
    Object.entries(manifest.variables).forEach(([key, config]) => {
      if (!VALID_TYPES[config.type]) {
        throw new Error(`${config.type} is not a recognized type`);
      }
      properties[key] = { ...VALID_TYPES[config.type] };
      if (config.choices) {
        properties.enum = config.choices;
      }
    });
  }

  return {
    $schema: "http://json-schema.org/draft-07/schema#",
    title: featureId,
    description: manifest.description,
    type: "object",
    properties,
    additionalProperties: false,
  };
}
