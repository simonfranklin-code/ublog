const express = require("express");
const explorerController = require("../controllers/explorerController");
const router = express.Router();

router.get("/explorer", explorerController.showExplorer);
router.get("/explorer/api/explorer-view", explorerController.getExplorerView);
router.get("/explorer/api/folder", explorerController.getFolder);
router.post("/explorer/api/open", explorerController.openItem);
router.post("/explorer/api/copy", explorerController.copyItem);
router.post("/explorer/api/cut", explorerController.cutItem);
router.post("/explorer/api/paste", explorerController.pasteItem);
router.post("/explorer/api/rename", explorerController.renameItem);
router.post("/explorer/api/delete", explorerController.deleteItem);


module.exports = router;
