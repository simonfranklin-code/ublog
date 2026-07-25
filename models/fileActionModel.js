const fs = require("fs/promises");
const path = require("path");

const clipboard = {
  action: null,
  sourcePath: null
};

function copyItem(sourcePath) {
  clipboard.action = "copy";
  clipboard.sourcePath = path.resolve(sourcePath);
  return clipboard;
}

function cutItem(sourcePath) {
  clipboard.action = "cut";
  clipboard.sourcePath = path.resolve(sourcePath);
  return clipboard;
}

async function pasteItem(destinationFolder) {
  if (!clipboard.sourcePath) throw new Error("Nothing has been copied or cut.");

  const resolvedDestinationFolder = path.resolve(destinationFolder);
  const destinationPath = await uniqueDestination(clipboard.sourcePath, resolvedDestinationFolder);

  if (clipboard.action === "cut") {
    await fs.rename(clipboard.sourcePath, destinationPath);
    clipboard.action = null;
    clipboard.sourcePath = null;
  } else {
    await fs.cp(clipboard.sourcePath, destinationPath, { recursive: true });
  }
}

async function renameItem(sourcePath, name) {
  const resolvedSourcePath = path.resolve(sourcePath);
  validateName(name);
  await fs.rename(resolvedSourcePath, path.join(path.dirname(resolvedSourcePath), name));
}

async function deleteItem(sourcePath) {
  await fs.rm(path.resolve(sourcePath), { recursive: true, force: true });
}

function validateName(name) {
  if (!name || name.includes("/") || name.includes("\\") || name.includes("\0")) {
    throw new Error("Use a plain file or folder name.");
  }
}

async function uniqueDestination(sourcePath, destinationFolder) {
  const parsed = path.parse(sourcePath);
  let destination = path.join(destinationFolder, parsed.base);
  let counter = 2;

  while (true) {
    try {
      await fs.access(destination);
      destination = path.join(destinationFolder, `${parsed.name} (${counter})${parsed.ext}`);
      counter += 1;
    } catch {
      return destination;
    }
  }
}

module.exports = {
  copyItem,
  cutItem,
  deleteItem,
  pasteItem,
  renameItem
};
