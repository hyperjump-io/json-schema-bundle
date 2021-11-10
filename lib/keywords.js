const JsonSchema = require("@hyperjump/json-schema");
const { Core } = require("@hyperjump/json-schema-core");
const Bundle = require("./core");
const { splitUri } = require("./common");


const validate = {
  ...JsonSchema.Keywords.validate,
  collectExternalIds: (schemaUri, externalIds, ast, dynamicAnchors) => {
    const nodes = ast[schemaUri][2];

    if (typeof nodes !== "boolean") {
      for (const [keywordId, schemaUri, keywordValue] of nodes) {
        const id = splitUri(schemaUri)[0];
        externalIds.add(id);
        const keyword = Core.getKeyword(keywordId);

        if (keyword.collectExternalIds) {
          keyword.collectExternalIds(keywordValue, externalIds, ast, dynamicAnchors);
        }
      }
    }
  }
};

const ref = {
  ...JsonSchema.Keywords.ref,
  collectExternalIds: Bundle.collectExternalIds
};

const additionalItems6 = {
  ...JsonSchema.Keywords.additionalItems6,
  collectExternalIds: Bundle.collectExternalIds
};

const additionalProperties6 = {
  ...JsonSchema.Keywords.additionalProperties6,
  collectExternalIds: Bundle.collectExternalIds
};

const allOf = {
  ...JsonSchema.Keywords.allOf,
  collectExternalIds: (allOf, externalIds, ast, dynamicAnchors) => {
    allOf.forEach((schemaUri) => Bundle.collectExternalIds(schemaUri, externalIds, ast, dynamicAnchors));
  }
};

const anyOf = {
  ...JsonSchema.Keywords.anyOf,
  collectExternalIds: (anyOf, externalIds, ast, dynamicAnchors) => {
    anyOf.forEach((schemaUri) => Bundle.collectExternalIds(schemaUri, externalIds, ast, dynamicAnchors));
  }
};

const containsMinContainsMaxContains = {
  ...JsonSchema.Keywords.containsMinContainsMaxContains,
  collectExternalIds: Bundle.collectExternalIds
};

const dependentSchemas = {
  ...JsonSchema.Keywords.dependentSchemas,
  collectExternalIds: (dependentSchemas, externalIds, ast, dynamicAnchors) => {
    Object.values(dependentSchemas).forEach((schemaUri) => Bundle.collectExternalIds(schemaUri, externalIds, ast, dynamicAnchors));
  }
};

const if_ = {
  ...JsonSchema.Keywords.if,
  collectExternalIds: Bundle.collectExternalIds
};

const then = {
  ...JsonSchema.Keywords.then,
  collectExternalIds: Bundle.collectExternalIds
};

const else_ = {
  ...JsonSchema.Keywords.else,
  collectExternalIds: Bundle.collectExternalIds
};

const items = {
  ...JsonSchema.Keywords.items,
  collectExternalIds: Bundle.collectExternalIds
};

const items202012 = {
  ...JsonSchema.Keywords.items202012,
  collectExternalIds: Bundle.collectExternalIds
};

const not = {
  ...JsonSchema.Keywords.not,
  collectExternalIds: Bundle.collectExternalIds
};

const oneOf = {
  ...JsonSchema.Keywords.oneOf,
  collectExternalIds: (oneOf, externalIds, ast, dynamicAnchors) => {
    oneOf.forEach((schemaUri) => Bundle.collectExternalIds(schemaUri, externalIds, ast, dynamicAnchors));
  }
};

const patternProperties = {
  ...JsonSchema.Keywords.patternProperties,
  collectExternalIds: (patternProperties, externalIds, ast, dynamicAnchors) => {
    patternProperties.forEach(([, schemaUri]) => Bundle.collectExternalIds(schemaUri, externalIds, ast, dynamicAnchors));
  }
};

const tupleItems = {
  ...JsonSchema.Keywords.tupleItems,
  collectExternalIds: (tupleItems, externalIds, ast, dynamicAnchors) => {
    tupleItems.forEach((schemaUri) => Bundle.collectExternalIds(schemaUri, externalIds, ast, dynamicAnchors));
  }
};

const properties = {
  ...JsonSchema.Keywords.properties,
  collectExternalIds: (properties, externalIds, ast, dynamicAnchors) => {
    Object.values(properties).forEach((schemaUri) => Bundle.collectExternalIds(schemaUri, externalIds, ast, dynamicAnchors));
  }
};

const propertyNames = {
  ...JsonSchema.Keywords.propertyNames,
  collectExternalIds: Bundle.collectExternalIds
};

const unevaluatedItems = {
  ...JsonSchema.Keywords.unevaluatedItems,
  collectExternalIds: Bundle.collectExternalIds
};

const unevaluatedProperties = {
  ...JsonSchema.Keywords.unevaluatedProperties,
  collectExternalIds: Bundle.collectExternalIds
};

module.exports = {
  validate,
  ref,
  additionalItems6,
  additionalProperties6,
  allOf,
  anyOf,
  containsMinContainsMaxContains,
  dependentSchemas,
  if: if_,
  then,
  else: else_,
  items,
  items202012,
  not,
  oneOf,
  patternProperties,
  tupleItems,
  properties,
  propertyNames,
  unevaluatedItems,
  unevaluatedProperties
};
