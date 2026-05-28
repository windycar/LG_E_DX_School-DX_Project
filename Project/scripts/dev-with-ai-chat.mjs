import { existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { spawn } from "node:child_process";

const projectRoot = dirname(dirname(fileURLToPath(import.meta.url)));
const aiChatDir = join(projectRoot, "AI_Chat");
const isWindows = process.platform === "win32";
const npmCommand = isWindows ? "npm.cmd" : "npm";
const nodeCommand = process.execPath;
const viteBin = join(projectRoot, "node_modules", "vite", "bin", "vite.js");

const children = new Set();
let shuttingDown = false;

function spawnChecked(command, args, options) {
  const child = spawn(command, args, {
    stdio: "inherit",
    shell: false,
    windowsHide: true,
    ...options,
  });

  children.add(child);

  child.on("exit", (code, signal) => {
    children.delete(child);
    if (shuttingDown) {
      return;
    }

    shuttingDown = true;
    stopChildren(child);
    if (signal) {
      process.kill(process.pid, signal);
    } else {
      process.exit(code ?? 0);
    }
  });

  child.on("error", (error) => {
    console.error(`[dev] Failed to start ${command}:`, error.message);
    shuttingDown = true;
    stopChildren(child);
    process.exit(1);
  });

  return child;
}

function stopChildren(except) {
  for (const child of children) {
    if (child === except || child.killed) {
      continue;
    }
    child.kill("SIGTERM");
  }
}

function runInstallIfNeeded() {
  if (existsSync(join(aiChatDir, "node_modules"))) {
    return Promise.resolve();
  }

  console.log("[dev] AI_Chat/node_modules not found. Running npm install in AI_Chat...");

  return new Promise((resolve, reject) => {
    const command = isWindows ? "cmd.exe" : npmCommand;
    const args = isWindows ? ["/d", "/s", "/c", npmCommand, "install"] : ["install"];
    const installer = spawn(command, args, {
      cwd: aiChatDir,
      stdio: "inherit",
      shell: false,
      windowsHide: true,
    });

    installer.on("exit", (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`AI_Chat npm install failed with exit code ${code}`));
      }
    });
    installer.on("error", reject);
  });
}

for (const signal of ["SIGINT", "SIGTERM"]) {
  process.on(signal, () => {
    shuttingDown = true;
    stopChildren();
    setTimeout(() => process.exit(0), 300);
  });
}

try {
  await runInstallIfNeeded();
} catch (error) {
  console.error("[dev]", error.message);
  process.exit(1);
}

spawnChecked(nodeCommand, ["--watch", "index.js"], { cwd: aiChatDir });
spawnChecked(nodeCommand, [viteBin], { cwd: projectRoot });
