const fs = require("fs");
const http = require("http");
const path = require("path");
const { spawnSync } = require("child_process");

const root = path.resolve(__dirname, "..");
const startPort = Number(process.env.PORT || 4174);
const maxPort = startPort + 1;

spawnSync(process.execPath, [path.join(root, "scripts", "build-preview-bundle.js")], {
  cwd: root,
  stdio: "inherit"
});

const types = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".svg": "image/svg+xml; charset=utf-8",
  ".css": "text/css; charset=utf-8"
};

function send(res, status, body, type) {
  res.writeHead(status, { "Content-Type": type || "text/plain; charset=utf-8" });
  res.end(body);
}

function createServer() {
  return http.createServer((req, res) => {
    const url = new URL(req.url, "http://127.0.0.1");
    const pathname = decodeURIComponent(url.pathname);
    const requested = pathname === "/" || pathname === "/preview/" ? "/preview/index.html" : pathname;
    const filePath = path.resolve(root, requested.replace(/^\/+/, ""));

    if (!filePath.startsWith(root)) {
      send(res, 403, "Forbidden");
      return;
    }

    fs.readFile(filePath, (error, data) => {
      if (error) {
        send(res, 404, "Not found");
        return;
      }
      send(res, 200, data, types[path.extname(filePath)] || "application/octet-stream");
    });
  });
}

function listen(port) {
  const server = createServer();
  server.on("error", (error) => {
    if (error.code === "EADDRINUSE" && port < maxPort) {
      listen(port + 1);
      return;
    }
    console.error(error.message);
    process.exit(1);
  });
  server.listen(port, "127.0.0.1", () => {
    console.log(`Preview running at http://127.0.0.1:${port}/preview/`);
  });
}

listen(startPort);
