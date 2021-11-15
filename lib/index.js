const JsonSchema = require("@hyperjump/json-schema");
const JsonPointer = require("@hyperjump/json-pointer");
const { Core, Schema, Reference, InvalidSchemaError } = require("@hyperjump/json-schema-core");
const RelateUrl = require("relateurl");
const Bundle = require("./core");
const { splitUri } = require("./common");

require("./draft-04");
require("./draft-06");
require("./draft-07");
require("./draft-2019-09");
require("./draft-2020-12");


const FULL = "full";
const FLAT = "flat";

const defaultOptions = {
  alwaysIncludeDialect: false,
  bundleMode: FLAT
};

const bundle = async (schemaDoc, options = {}) => {
  const fullOptions = { ...defaultOptions, ...options };

  const { ast, schemaUri } = await Core.compile(schemaDoc);
  const externalIds = new Set();
  Bundle.collectExternalIds(schemaUri, externalIds, ast, {});
  externalIds.delete(schemaDoc.id);

  const bundled = toSchema(schemaDoc, {
    includeEmbedded: fullOptions.bundleMode === FULL
  });

  const bundlingLocation = Schema.getConfig(schemaDoc.schemaVersion, "bundlingLocation");
  if (JsonPointer.get(bundlingLocation, bundled) === undefined && externalIds.size > 0) {
    JsonPointer.assign(bundlingLocation, bundled, {});
  }

  for (const uri of externalIds.values()) {
    const externalSchema = await JsonSchema.get(uri);
    const embeddedSchema = toSchema(externalSchema, {
      parentId: schemaDoc.id,
      parentDialect: fullOptions.alwaysIncludeDialect ? "" : schemaDoc.schemaVersion,
      includeEmbedded: fullOptions.bundleMode === FULL
    });
    const embeddedToken = Schema.getConfig(externalSchema.schemaVersion, "embeddedToken");
    const pointer = JsonPointer.append(embeddedSchema[embeddedToken], bundlingLocation);
    JsonPointer.assign(pointer, bundled, embeddedSchema);
  }

  return bundled;
};

const toSchemaDefaultOptions = {
  parentId: "",
  parentDialect: "",
  includeEmbedded: true
};
const toSchema = (schemaDoc, options = {}) => {
  const fullOptions = { ...toSchemaDefaultOptions, ...options };

  const schema = JSON.parse(JSON.stringify(schemaDoc.schema, (key, value) => {
    if (!Reference.isReference(value)) {
      return value;
    }

    const refValue = Reference.value(value);
    const embeddedDialect = refValue.$schema || schemaDoc.schemaVersion;
    const embeddedToken = Schema.getConfig(embeddedDialect, "embeddedToken");
    if (!fullOptions.includeEmbedded && embeddedToken in refValue) {
      return;
    } else {
      return Reference.value(value);
    }
  }));

  const dynamicAnchorToken = Schema.getConfig(schemaDoc.schemaVersion, "dynamicAnchorToken");
  Object.entries(schemaDoc.dynamicAnchors)
    .forEach(([anchor, uri]) => {
      const pointer = splitUri(uri)[1];
      JsonPointer.assign(pointer, schema, {
        [dynamicAnchorToken]: anchor,
        ...JsonPointer.get(pointer, schema)
      });
    });

  const anchorToken = Schema.getConfig(schemaDoc.schemaVersion, "anchorToken");
  Object.entries(schemaDoc.anchors)
    .filter(([anchor]) => anchor !== "")
    .forEach(([anchor, pointer]) => {
      JsonPointer.assign(pointer, schema, {
        [anchorToken]: anchor,
        ...JsonPointer.get(pointer, schema)
      });
    });

  const baseToken = Schema.getConfig(schemaDoc.schemaVersion, "baseToken");
  const id = relativeUri(fullOptions.parentId, schemaDoc.id);
  const dialect = fullOptions.parentDialect === schemaDoc.schemaVersion ? "" : schemaDoc.schemaVersion;
  return {
    ...(id && { [baseToken]: id }),
    ...(dialect && { $schema: dialect }),
    ...schema
  };
};

const relativeUri = (from, to) => {
  if (to.startsWith("file://")) {
    return from === "" ? "" : RelateUrl.relate(from, to);
  } else {
    return to;
  }
};

module.exports = {
  add: JsonSchema.add,
  get: Schema.get,
  bundle: bundle,
  FULL: FULL,
  FLAT: FLAT,
  setMetaOutputFormat: Core.setMetaOutputFormat,
  setShouldMetaValidate: Core.setShouldMetaValidate,
  FLAG: Core.FLAG,
  BASIC: Core.BASIC,
  DETAILED: Core.DETAILED,
  VERBOSE: Core.VERBOSE,
  InvalidSchemaError: InvalidSchemaError
};
