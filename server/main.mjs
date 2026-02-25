// main.mjs
import express from "express";
import { Console } from "node:console";
import { readFileSync, existsSync } from "node:fs";
import path, { basename } from "node:path";
import { env, cwd, stdout, stderr } from "node:process";

const app = express();
const rootPath = cwd();
const logger = new Console(stdout, stderr);

// env variables
const port = env.PORT || 3000;
const logLevel = env.LOG_LEVEL || "info";
const basePath = env.VITE_BASE_PLACEHOLDER || "";
const finalBase = basePath ? `${basePath}` : "";
const indexFilePath = path.join(rootPath, "dist", "index.html");

app.get("/health", (req, res) => res.send("ok").end());

const replacements = {
  base: env.BASE || "",
  fixedBackendUrl: env.FIXED_BACKEND_URL || "",
  fixedBackendAdminId: env.FIXED_BACKEND_ADMIN || "",
  steamApiKey: env.STEAM_API_KEY || "",
};

const applyReplacements = (text) => {
  return text
    .replace(
      /\/VITE_BASE_PLACEHOLDER/g,
      replacements.base ? `/${replacements.base}` : "",
    )
    .replace(
      /VITE_FIXED_BACKEND_URL_PLACEHOLDER/g,
      replacements.fixedBackendUrl ? `${replacements.fixedBackendUrl}` : "",
    )
    .replace(
      /VITE_FIXED_BACKEND_ADMIN_PLACEHOLDER/g,
      replacements.fixedBackendAdminId
        ? `${replacements.fixedBackendAdminId}`
        : "",
    )
    .replace(
      /VITE_STEAM_API_KEY_PLACEHOLDER/g,
      replacements.steamApiKey ? `${replacements.steamApiKey}` : "",
    );
};

app.use((req, res, next) => {
  const url = req.url;
  const filePath = path.join(rootPath, "dist", url);

  if (!existsSync(filePath) || ["", "/"].includes(url)) {
    if (["debug"].includes(logLevel))
      logger.log(
        `404 <filePath:${filePath}> => sending index file <url:${url}>`,
      );
    const indexFile = readFileSync(indexFilePath, "utf8");
    if (["debug"].includes(logLevel))
      logger.log(
        `replacing VITE_BASE_PLACEHOLDER in index file with ${finalBase}`,
      );

    // we need to catch the starting slash to ensure if env is empty the result is not starting with //
    res.send(applyReplacements(indexFile)).end();
    return;
  }

  if (["debug"].includes(logLevel))
    logger.log(`loading <file:${filePath}> <url:${url}>`);
  //   return next();

  // env replacements in css and js files

  if (!url.endsWith(".css") && !url.endsWith(".js")) return next();
  let fileContents = readFileSync(filePath, "utf8");

  if (fileContents.includes("VITE_")) {
    if (["debug"].includes(logLevel))
      logger.info(`replacing placeholders in ${filePath}`);
    // for (const [from, to] of staticReplacements)
    fileContents = applyReplacements(fileContents);
  }

  res.contentType(basename(filePath)).send(fileContents).end();
});

// Static files of React-Build
app.use(express.static(path.join(rootPath, "dist")));

// Replace placeholder in index.html

app.get("*wc", (req, res) => {
  let html = readFileSync(indexFilePath, "utf8");
  html = applyReplacements(html);
  res.setHeader("Content-Type", "text/html");
  res.send(html);
});

app.listen(port, () => {
  logger.log(`Server running on http://localhost:${port}/${finalBase}`);
});
