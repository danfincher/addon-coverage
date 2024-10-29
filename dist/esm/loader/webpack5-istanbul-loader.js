import { fromSource, fromMapFileSource } from "convert-source-map"; // @ts-expect-error no types

import fs from "fs";
import path from "path";

function sanitizeSourceMap(rawSourceMap) {
  return typeof rawSourceMap === "string" ? JSON.parse(rawSourceMap) : rawSourceMap;
}

export default function (source, sourceMap) {
  let map = sourceMap ? sanitizeSourceMap(sourceMap) : getInlineSourceMap.call(this, source);
  const options = this.getOptions();
  const callback = this.async();

  if (!map) {
    callback(null, source, sourceMap);
    return;
  } // Instrument the code


  const instrumenter = options.instrumenter;
  const code = instrumenter.instrumentSync(source, this.resourcePath, map);
  const lastSourceMap = instrumenter.lastSourceMap();
  callback(null, code, lastSourceMap);
}
/**
 * If the source code has an inline base64-encoded source map,
 * then this function decodes it, parses it, and returns it.
 */

function getInlineSourceMap(source) {
  try {
    // Check for an inline source map
    const inlineSourceMap = fromSource(source) || fromMapFileSource(source, function (filename) {
      return fs.readFileSync(path.resolve(path.dirname(this.resourcePath), filename), "utf-8");
    });

    if (inlineSourceMap) {
      // Use the inline source map
      return inlineSourceMap.sourcemap;
    }
  } catch (e) {
    // Exception is thrown by fromMapFileSource when there is no source map file
    if (e instanceof Error && e.message.includes("An error occurred while trying to read the map file at")) {
      this.emitWarning(e);
    } else {
      throw e;
    }
  }
}