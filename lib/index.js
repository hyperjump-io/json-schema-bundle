const JsonSchema = require("@hyperjump/json-schema");
const JsonPointer = require("@hyperjump/json-pointer");
const { Core, Schema, Reference, InvalidSchemaError } = require("@hyperjump/json-schema-core");
const RelateUrl = require("relateurl");
const Bundle = require("./core");
const { splitUri } = require("./common");

require("./draft-2019-09");
require("./draft-2020-12");


const bundle = async (schemaDoc) => {
  const { ast, schemaUri } = await Core.compile(schemaDoc);
  const externalIds = new Set();
  Bundle.collectExternalIds(schemaUri, externalIds, ast, {});
  externalIds.delete(schemaDoc.id);

  const bundled = toSchema(schemaDoc);

  if (!("$defs" in bundled)) {
    bundled.$defs = {};
  }

  for (const uri of externalIds.values()) {
    const externalSchema = await JsonSchema.get(uri);
    const embeddedSchema = toSchema(externalSchema, schemaDoc.id);
    const embeddedToken = Schema.getConfig(externalSchema.schemaVersion, "embeddedToken");
    const id = embeddedSchema[embeddedToken];
    bundled.$defs[id] = externalSchema;
  }

  return bundled;
};

const toSchema = (schemaDoc, parentId = "") => {
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
  return {
    ...(id && { [baseToken]: id }),
    $schema: schemaDoc.schemaVersion,
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
