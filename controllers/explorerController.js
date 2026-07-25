const path = require("path");
const folderModel = require("../models/folderModel");
const fileActionModel = require("../models/fileActionModel");


async function buildExplorerViewModel(request) {
    const folder = request.query.path || folderModel.START_PATH;
    const query = request.query.q || "";
    const model = await folderModel.readFolder(folder);

    return {
        ...model,
        query,
        items: folderModel.searchItems(model.items, query)
    }
}
    exports.showExplorer = async (request, response) => {
        const folder = request.query.path || folderModel.START_PATH;
        const query = request.query.q || "";

        try {
            const model = await folderModel.readFolder(folder);
            response.render("user/explorer", {
                ...model,
                query,
                items: folderModel.searchItems(model.items, query)
            });
        } catch (error) {
            response.status(500).render("error", {
                message: "This folder could not be opened.",
                detail: error.message
            });
        }
    };

    exports.getExplorerView = async (request, response) => {
        try {
            response.render("user/explorer", await buildExplorerViewModel(request));
        } catch (error) {
            response.status(400).json({ error: error.message });
        }
    };

    exports.getFolder = async (request, response) => {
        try {
            const model = await folderModel.readFolder(request.query.path);
            response.json({
                ...model,
                items: folderModel.searchItems(model.items, request.query.q || "")
            });
        } catch (error) {
            response.status(400).json({ error: error.message });
        }
    };

    exports.openItem = async (request, response) => {
        try {
            const targetPath = path.resolve(request.body.path);
            if (!options.openPath) throw new Error("Opening files is not available.");
            const result = await options.openPath(targetPath);
            if (result) throw new Error(result);
            response.json({ ok: true });
        } catch (error) {
            response.status(400).json({ error: error.message });
        }
    };

    exports.copyItem = (request, response) => {
        const clipboard = fileActionModel.copyItem(request.body.path);
        response.json({ ok: true, clipboard });
    };

    exports.cutItem = (request, response) => {
        const clipboard = fileActionModel.cutItem(request.body.path);
        response.json({ ok: true, clipboard });
    };

    exports.pasteItem = async (request, response) => {
        try {
            await fileActionModel.pasteItem(request.body.destination);
            response.json({ ok: true });
        } catch (error) {
            response.status(400).json({ error: error.message });
        }
    };

    exports.renameItem = async (request, response) => {
        try {
            await fileActionModel.renameItem(request.body.path, request.body.name);
            response.json({ ok: true });
        } catch (error) {
            response.status(400).json({ error: error.message });
        }
    };

    exports.deleteItem = async (request, response) => {
        try {
            await fileActionModel.deleteItem(request.body.path);
            response.json({ ok: true });
        } catch (error) {
            response.status(400).json({ error: error.message });
        }
    };

