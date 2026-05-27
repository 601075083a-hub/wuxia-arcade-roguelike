const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const modules = [
  "preview/preview-entry.js",
  "src/app.js",
  "src/core/game-state.js",
  "src/core/asset-loader.js",
  "src/ui/renderer.js",
  "data/fragments.js",
  "data/moves.js",
  "data/externals.js",
  "data/internals.js",
  "data/enemies.js",
  "data/map.js"
];

function normalizeId(filePath) {
  return filePath.replace(/\\/g, "/").replace(/^\.\//, "");
}

function resolveModule(fromId, request) {
  if (!request.startsWith(".")) return request;
  const fromDir = path.posix.dirname(fromId);
  let resolved = path.posix.normalize(path.posix.join(fromDir, request));
  if (!path.posix.extname(resolved)) resolved += ".js";
  return normalizeId(resolved);
}

const moduleSet = new Set(modules.map(normalizeId));
const records = modules.map((id) => {
  const abs = path.join(root, id);
  const source = fs.readFileSync(abs, "utf8");
  const deps = {};
  source.replace(/require\(["']([^"']+)["']\)/g, (_match, request) => {
    const resolved = resolveModule(id, request);
    deps[request] = resolved;
    if (!moduleSet.has(resolved)) {
      throw new Error(`Missing bundled module: ${resolved} required by ${id}`);
    }
    return _match;
  });
  return { id, deps, source };
});

const body = records
  .map((record) => {
    return `${JSON.stringify(record.id)}: [function(require, module, exports) {\n${record.source}\n}, ${JSON.stringify(record.deps)}]`;
  })
  .join(",\n");

const bundle = `(function(modules) {
  var cache = {};
  function localRequire(id) {
    if (cache[id]) return cache[id].exports;
    if (!modules[id]) throw new Error("Cannot find module " + id);
    var module = { exports: {} };
    cache[id] = module;
    var deps = modules[id][1];
    function require(request) {
      return localRequire(deps[request] || request);
    }
    modules[id][0](require, module, module.exports);
    return module.exports;
  }
  localRequire("preview/preview-entry.js");
})({
${body}
});
`;

fs.writeFileSync(path.join(root, "preview", "bundle.js"), bundle);
console.log("Built preview/bundle.js");
