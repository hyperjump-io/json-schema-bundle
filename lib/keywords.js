const JsonSchema = require("@hyperjump/json-schema");
const { Core } = require("@hyperjump/json-schema-core");
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

module.exports = {
  validate
};
