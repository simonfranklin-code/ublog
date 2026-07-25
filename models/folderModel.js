const fs = require("fs/promises");
const os = require("os");
const path = require("path");

const START_PATH = process.platform === "win32" ? process.env.USERPROFILE : os.homedir();

const ICONS = {
  ".doc": "DOC",
  ".docx": "DOC",
  ".gif": "IMG",
  ".jpeg": "IMG",
  ".jpg": "IMG",
  ".js": "JS",
  ".json": "JSON",
  ".md": "MD",
  ".pdf": "PDF",
  ".png": "IMG",
  ".svg": "SVG",
  ".txt": "TXT",
  ".xls": "XLS",
  ".xlsx": "XLS",
  ".zip": "ZIP"
};

function isRoot(folderPath) {
  return path.parse(folderPath).root === folderPath;
}

async function readFolder(folderPath) {
  const resolvedPath = path.resolve(folderPath || START_PATH);
  const entries = await fs.readdir(resolvedPath, { withFileTypes: true });

  const items = await Promise.all(
    entries.map(async (entry) => {
      const fullPath = path.join(resolvedPath, entry.name);
      let stats = null;

      try {
        stats = await fs.stat(fullPath);
      } catch {
        // Some system folders cannot be read; keep them visible but sparse.
      }

      return {
        name: entry.name,
        path: fullPath,
        type: entry.isDirectory() ? "Folder" : path.extname(entry.name).replace(".", "").toUpperCase() || "File",
        icon: getIcon(entry),
        isDirectory: entry.isDirectory(),
        size: entry.isDirectory() || !stats ? "" : `${Math.ceil(stats.size / 1024).toLocaleString()} KB`,
        modified: stats ? stats.mtime.toLocaleString() : ""
      };
    })
  );

  items.sort((a, b) => {
    if (a.isDirectory !== b.isDirectory) return a.isDirectory ? -1 : 1;
    return a.name.localeCompare(b.name);
  });

  return {
    currentPath: resolvedPath,
    parentPath: isRoot(resolvedPath) ? null : path.dirname(resolvedPath),
    breadcrumbs: buildBreadcrumbs(resolvedPath),
    tree: await buildTree(resolvedPath),
    items
  };
}

function getIcon(entry) {
  if (entry.isDirectory()) return "DIR";
  const extension = path.extname(entry.name).toLowerCase();
  return ICONS[extension] || "FILE";
}

function buildBreadcrumbs(folderPath) {
  const parsed = path.parse(folderPath);
  const parts = folderPath.slice(parsed.root.length).split(path.sep).filter(Boolean);
  const crumbs = [{ name: parsed.root, path: parsed.root }];

  let current = parsed.root;
  for (const part of parts) {
    current = path.join(current, part);
    crumbs.push({ name: part, path: current });
  }

  return crumbs;
}

async function buildTree(currentPath) {
  const home = START_PATH;
  const roots = process.platform === "win32"
    ? [{ name: "Local Disk C:", path: "C:\\" }, { name: "Home", path: home }]
    : [{ name: "Root", path: "/" }, { name: "Home", path: home }];

  const uniqueRoots = roots.filter((root, index, list) => (
    list.findIndex((candidate) => candidate.path.toLowerCase() === root.path.toLowerCase()) === index
  ));

  return Promise.all(uniqueRoots.map((root) => buildTreeNode(root.path, root.name, currentPath, 0)));
}

async function buildTreeNode(folderPath, name, currentPath, depth) {
  const normalizedFolder = path.resolve(folderPath);
  const normalizedCurrent = path.resolve(currentPath);
  const node = {
    name,
    path: normalizedFolder,
    active: normalizedFolder.toLowerCase() === normalizedCurrent.toLowerCase(),
    expanded: normalizedCurrent.toLowerCase().startsWith(normalizedFolder.toLowerCase()),
    children: []
  };

  if (!node.expanded || depth > 2) return node;

  try {
    const entries = await fs.readdir(normalizedFolder, { withFileTypes: true });
    const folders = entries
      .filter((entry) => entry.isDirectory() && !entry.name.startsWith("."))
      .slice(0, 24);

    node.children = await Promise.all(
      folders.map((entry) => buildTreeNode(path.join(normalizedFolder, entry.name), entry.name, currentPath, depth + 1))
    );
  } catch {
    node.children = [];
  }

  return node;
}

function searchItems(items, query) {
  if (!query) return items;
  const lowerQuery = query.toLowerCase();
  return items.filter((item) => item.name.toLowerCase().includes(lowerQuery));
}

module.exports = {
  START_PATH,
  readFolder,
  searchItems
};
