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


const defaultOptions = {
  alwaysIncludeDialect: false
};

const bundle = async (schemaDoc, options = defaultOptions) => {
  const { ast, schemaUri } = await Core.compile(schemaDoc);
  const externalIds = new Set();
  Bundle.collectExternalIds(schemaUri, externalIds, ast, {});
  externalIds.delete(schemaDoc.id);

  const bundled = toSchema(schemaDoc);

  const bundlingLocation = Schema.getConfig(schemaDoc.schemaVersion, "bundlingLocation");
  if (JsonPointer.get(bundlingLocation, bundled) === undefined && externalIds.size > 0) {
    JsonPointer.assign(bundlingLocation, bundled, {});
  }

  for (const uri of externalIds.values()) {
    const externalSchema = await JsonSchema.get(uri);
    const embeddedSchema = toSchema(externalSchema, schemaDoc.id, options.alwaysIncludeDialect ? "" : schemaDoc.schemaVersion);
    const embeddedToken = Schema.getConfig(externalSchema.schemaVersion, "embeddedToken");
    const pointer = JsonPointer.append(embeddedSchema[embeddedToken], bundlingLocation);
    JsonPointer.assign(pointer, bundled, embeddedSchema);
  }

  return bundled;
};

const toSchema = (schemaDoc, parentId = "", parentDialect = "") => {
  const schema = JSON.parse(JSON.stringify(schemaDoc.schema, (key, value) => {
    return Reference.isReference(value) ? Reference.value(value) : value;
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
  const id = relativeUri(parentId, schemaDoc.id);
  const dialect = parentDialect === schemaDoc.schemaVersion ? "" : schemaDoc.schemaVersion;
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
  setMetaOutputFormat: Core.setMetaOutputFormat,
  setShouldMetaValidate: Core.setShouldMetaValidate,
  FLAG: Core.FLAG,
  BASIC: Core.BASIC,
  DETAILED: Core.DETAILED,
  VERBOSE: Core.VERBOSE,
  InvalidSchemaError: InvalidSchemaError
};
