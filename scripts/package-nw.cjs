/**
 * Simple NW.js packager without nw-builder validation.
 * It just zips your app and copies it next to nw.exe.
 */
const path = require("path");
const fs = require("fs");
const { execSync } = require("child_process");
const archiver = require("archiver");

const projectDir = process.cwd();
const nwCacheDir = path.join(projectDir, ".nw-cache", "0.104.0", "win-x64");
const nwBinary = path.join(nwCacheDir, "nw.exe");

if (!fs.existsSync(nwBinary)) {
    console.error(`[ERROR] NW.js binary not found at: ${nwBinary}`);
    console.error(`Download it from https://dl.nwjs.io/v0.104.0/nwjs-v0.104.0-win-x64.zip`);
    process.exit(1);
}

const distDir = path.join(projectDir, "dist");
if (!fs.existsSync(distDir)) fs.mkdirSync(distDir);

const outputDir = path.join(distDir, "youblog-win64");
if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir);

const zipPath = path.join(outputDir, "app.nw");
console.log("[INFO] Creating app.nw archive...");

const output = fs.createWriteStream(zipPath);
const archive = archiver("zip", { zlib: { level: 9 } });

output.on("close", () => {
    console.log(`[INFO] app.nw size: ${(archive.pointer() / 1024 / 1024).toFixed(2)} MB`);

    // Copy NW.js files
    console.log("[INFO] Copying NW.js runtime...");
    execSync(`xcopy "${nwCacheDir}" "${outputDir}" /E /I /Y`);

    // Move app.nw next to nw.exe
    fs.renameSync(zipPath, path.join(outputDir, "app.nw"));

    console.log(`[✅ SUCCESS] You can now run your app with:`);
    console.log(`   ${path.join(outputDir, "nw.exe")}`);
});

archive.on("error", (err) => {
    throw err;
});

archive.pipe(output);

// include all files except node_modules and dist
archive.glob("**/*", {
    cwd: projectDir,
    ignore: ["node_modules/**", "dist/**", ".nw-cache/**", "scripts/**"],
});
archive.finalize();
