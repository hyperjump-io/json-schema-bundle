import fs from "fs";
import { expect } from "chai";
import Bundler from ".";
import type { BundleOptions } from ".";
import type { SchemaObject } from "@hyperjump/json-schema";


type Test = {
  description: string;
  options?: BundleOptions;
  schema: SchemaObject | string;
  externalSchemas: SchemaObject[];
  bundledSchema: SchemaObject;
};

fs.readdirSync(`${__dirname}/tests`, { withFileTypes: true })
  .filter((entry) => entry.isFile() && entry.name.endsWith(".json"))
  .forEach((entry) => {
    const file = `${__dirname}/tests/${entry.name}`;
    const suite = JSON.parse(fs.readFileSync(file, "utf8")) as Test[];

    describe(entry.name, () => {
      suite.forEach((test) => {
        it(test.description, async () => {
          let uri;
          if (typeof test.schema === "string") {
            uri = `file://${__dirname}/fixtures/${test.schema}`;
          } else {
            Bundler.add(test.schema, "https://bundler.hyperjump.io/schema");
            uri = "https://bundler.hyperjump.io/schema";
          }
          test.externalSchemas.forEach((schema) => {
            Bundler.add(schema);
          });
          const schema = await Bundler.get(uri);
          const bundle = await Bundler.bundle(schema, test.options);
          expect(bundle).eql(test.bundledSchema);
        });
      });
    });
  });
