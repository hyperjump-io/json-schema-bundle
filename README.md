# Hyperjump - JSON Schema Bundler

JSON Schema Bundler (JSB) is built on [JSON Schema Core](https://github.com/hyperjump-io/json-schema-core).

* Supported JSON Schema Dialects
  * draft-04 | draft-06 | draft-07 | Draft 2019-09 | Draft 2020-12
* Schemas can reference other schemas using a different draft
* Load schemas from filesystem (file://), network (http(s)://), or JavaScript

## Install
JSB includes support for node.js JavaScript (CommonJS and ES Modules),
TypeScript, and browsers.

### Node.js
```bash
npm install @hyperjump/json-schema-bundler
```

### Browser
When in a browser context, JSB is designed to use the browser's `fetch`
implementation instead of a node.js fetch clone. The Webpack bundler does this
properly without any extra configuration, but if you are using the Rollup
bundler you will need to include the `browser: true` option in your Rollup
configuration.

```javascript
  plugins: [
    resolve({
      browser: true
    }),
    commonjs()
  ]
```

### Versioning
This project is in beta and there may be breaking changes at any time. When it's
stable enough, I'll publish v1.0.0 and follow semantic versioning from there on
out.

## Usage
```javascript
const Bundler = require("@hyperjump/json-schema-bundler");


// Optionally load schema manually
Bundler.add({
  "$id": "https://json-schema.hyperjump.io/schemas/string",
  "$schema": "https://json-schema.org/draft/2020-12/schema",

  "type": "string"
});

// Get the initial schema to pass to the bundler
const main = await Bundler.get(`file://${__dirname}/schemas/main.schema.json`);

// The bundler will fetch from the file system, network, or internal schemas as
// needed to build to bundle.
const bundle = await Bundler.bundle(main);
```

## TypeScript
Although the package is written in JavaScript, type definitions are included for
TypeScript support. The following example shows the types you might want to
know.

```typescript
import Bundler from "@hyperjump/json-schema-bundler";
import type { SchemaDocument, Draft202012Schema, InvalidSchemaError } from "@hyperjump/json-schema-bundler";


(async function () {
  const schemaJson: Draft202012Schema = {
    "$id": "https://json-schema.hyperjump.io/schemas/string",
    "$schema": "https://json-schema.org/draft/2020-12/schema",

    "type": "string"
  };
  Bundler.add(schemaJson);

  try {
    const main: SchemaDocument = await Bundler.get(`file://${__dirname}/schemas/main.schema.json`);
    const bundle: Draft202012Schema = await Bundler.bundle(main);
    console.log(JSON.stringify(bundle, null, "  "));
  } catch (error: unknown) {
    if (error instanceof InvalidSchemaError) {
      console.log(error.output);
    } else {
      console.log(error);
    }
  }
}());
```

## API
* **add**: (schema: object, url?: URI, schemaVersion?: string) => SDoc

    Load a schema. See [JSC - $id](https://github.com/hyperjump-io/json-schema-core#id)
    and [JSC - $schema](https://github.com/hyperjump-io/json-schema-core#schema-1)
    for more information.
* **get**: (url: URI, contextDoc?: SDoc, recursive: boolean = false) => Promise<SDoc>

    Fetch a schema. Schemas can come from an HTTP request, a file, or a schema
    that was added with `add`.
* **bundle**: (schema: SDoc) => Promise<SchemaObject>

    Create a bundled schema starting with the given schema. External schemas
    will be fetched from the filesystem, the network, or internally as needed.
* **setMetaOutputFormat**: (outputFormat: OutputFormat = DETAILED) => undefined

    Set the output format for meta-validation. Meta-validation output is only
    returned if meta-validation results in an error.
* **setShouldMetaValidate**: (isEnabled: boolean) => undefined

    Enable or disable meta-validation.
* **OutputFormat**: [**FLAG** | **BASIC** | **DETAILED** | **VERBOSE**]

    See [JSC - Output](https://github.com/hyperjump-io/json-schema-core#output)
    for more information on output formats.

## Contributing

### Tests

Run the tests

```bash
npm test
```

Run the tests with a continuous test runner

```bash
npm test -- --watch
```
