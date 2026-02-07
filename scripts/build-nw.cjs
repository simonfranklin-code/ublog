const path = require("path");
const os = require("os");
const fs = require("fs");

let nwbuild;
try {
    nwbuild = require("nw-builder").default;
} catch {
    nwbuild = require("nw-builder");
}

async function main() {
    const projectDir = process.cwd();
    console.log("[DEBUG] Project dir:", projectDir);

    const platformMap = {
        win32: "win-x64",
        darwin: "osx-x64",
        linux: "linux-x64",
    };
    const currentPlatform = os.platform();
    const platform = platformMap[currentPlatform] || "win-x64";
    console.log(`[DEBUG] Detected platform: ${currentPlatform} → ${platform}`);

    const nwCacheDir = path.join(projectDir, ".nw-cache");
    const nwBinaryPath = path.join(nwCacheDir, "0.104.0", platform, "nw.exe");
    if (!fs.existsSync(nwBinaryPath)) {
        console.error(
            `[ERROR] NW.js binary not found at ${nwBinaryPath}\nPlease download and extract it manually from https://dl.nwjs.io/v0.104.0/nwjs-v0.104.0-${platform}.zip`
        );
        process.exit(1);
    }

    const srcPattern = [
        path.join(projectDir, "**/*"),
        path.join(projectDir, "package.json"),
    ];

    try {
        console.log(`[DEBUG] Building offline with local NW.js binary...`);
        await nwbuild({
            srcDir: srcPattern,
            version: "0.104.0",
            platform,
            cacheDir: nwCacheDir,
            outputDir: path.join(projectDir, "dist"),
            mode: "build",
            logLevel: "debug",
            offline: true, // ✅ skip manifest validation
        });

        console.log(`✅ Build completed successfully for ${platform}!`);
    } catch (err) {
        console.error("[FATAL ERROR]", err);
        process.exit(1);
    }
}

main();
