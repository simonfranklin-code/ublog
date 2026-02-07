#!/usr/bin/env node
/**
 * Auto-fetches NW.js SDK binary for your platform and caches it.
 * Usage: node scripts/fetch-nw.js [version]
 */
const fs = require("fs");
const https = require("https");
const path = require("path");
const os = require("os");

const version = process.argv[2] || "0.104.0";
const platformMap = { win32: "win", darwin: "osx", linux: "linux" };
const archMap = { x64: "x64", arm64: "arm64" };

const platform = platformMap[os.platform()];
const arch = archMap[os.arch()] || "x64";

if (!platform) {
    console.error("❌ Unsupported platform:", os.platform());
    process.exit(1);
}

const ext = platform === "linux" ? "tar.gz" : "zip";
const filename = `nwjs-sdk-v${version}-${platform}-${arch}.${ext}`;
const cacheDir = path.join(process.cwd(), ".nw-cache");
const destPath = path.join(cacheDir, filename);
const url = `https://dl.nwjs.io/v0.104.0/nwjs-sdk-v0.104.0-win-x64.zip`;

if (!fs.existsSync(cacheDir)) fs.mkdirSync(cacheDir, { recursive: true });

if (fs.existsSync(destPath)) {
    console.log(`✅ NW.js SDK already cached: ${destPath}`);
    process.exit(0);
}

console.log(`⬇️  Downloading ${url} ...`);
https.get(url, (res) => {
    if (res.statusCode !== 200) {
        console.error(`❌ Failed to download: ${res.statusCode}`);
        res.resume();
        process.exit(1);
    }

    const total = parseInt(res.headers["content-length"] || "0", 10);
    let downloaded = 0;
    const file = fs.createWriteStream(destPath);

    res.on("data", (chunk) => {
        downloaded += chunk.length;
        const percent = total ? ((downloaded / total) * 100).toFixed(1) : "";
        process.stdout.write(`\r📦 ${percent}%`);
    });

    res.pipe(file);

    file.on("finish", () => {
        file.close(() => {
            console.log(`\n✅ Saved to ${destPath}`);
        });
    });
}).on("error", (err) => {
    console.error("❌ Download error:", err.message);
    process.exit(1);
});
