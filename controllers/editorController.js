/* eslint-disable no-undef */
const MobiriseProject = require('../models/MobiriseProject');
const HtmlSection = require('../models/HtmlSection');
const fs = require("fs");
const fsp = require("fs/promises");
const path = require("path");
const axios = require("axios");
const crypto = require("crypto");
const GALLERY_FOLDER = path.join(__dirname, "../public/digital-marketing-dreams/assets/images");
const GALLERY_PUBLIC_PATH = "assets/images";
const ALLOWED_EXTENSIONS = new Set([".jpg", ".jpeg", ".png", ".gif", ".webp", ".svg"]);

exports.index = async (req, res) => {
    const pages = await MobiriseProject.getPageList();
    res.render('index', { pages });
};

exports.listAll = async (req, res) => {
    const components = await MobiriseProject.listComponents();
    res.json(components);
};

exports.editByPageName = async (req, res) => {
    const { pageName, anchor } = req.params;
    const component = await MobiriseProject.findComponentByPage(pageName, anchor);
    if (!component) return res.status(404).send('Component not found');
    res.json({ component: component });
};

exports.getComponentByPageNameAndAnchor = async (req, res) => {
    const { pageName, anchor } = req.params;
    const component = await MobiriseProject.findComponentByPage(pageName, anchor);
    if (!component) return res.status(404).send('Component not found');
    res.json({ component: component });
};


exports.getComponentFromHtmlSection = async (req, res) => {
    const { htmlSectionId } = req.params;
    const component = await HtmlSection.getComponentFromHtmlSection(htmlSectionId);
    if (!component) return res.status(404).send('Component not found');
    res.json({ component: component });
};

exports.editForm = async (req, res) => {
    const anchor = req.params.anchor;
    const component = await MobiriseProject.getComponent(anchor);
    if (!component) return res.status(404).send('Component not found');
    res.render('edit', { component });
};

exports.editSave = async (req, res) => {
    const page = req.params.pageName;
    const anchor = req.params.anchor;
    const { component, HtmlSectionId } = req.body;

    try {
        const result = await MobiriseProject.updateComponent(page, anchor, component);
        if (HtmlSectionId) {
            await HtmlSection.editComponentSet(HtmlSectionId, anchor, component);
        }
        res.json({ success: true });
    } catch (err) {
        res.status(400).send('Failed to update component: ' + err.message);
    }
};

exports.deleteComponent = async (req, res) => {
    const anchor = req.params.anchor;
    try {
        await MobiriseProject.deleteComponent(anchor);
        res.redirect('/');
    } catch (err) {
        res.status(400).send('Failed to delete component: ' + err.message);
    }
};

exports.findComponentByPage = async (req, res) => {
    const { pageName, anchor } = req.params;
    try {
        const component = await MobiriseProject.findComponentByPage(pageName, anchor);
        if (!component) return res.status(404).send('Component not found');
        res.json(component);
    } catch (err) {
        res.status(400).send('Error finding component: ' + err.message);
    }
};

exports.loadSiteGallery = async (req, res) => {
    try {
        const files = await fsp.readdir(GALLERY_FOLDER, { withFileTypes: true });

        const imageUrls = files
            .filter(file => file.isFile())
            .map(file => file.name)
            .filter(fileName => ALLOWED_EXTENSIONS.has(path.extname(fileName).toLowerCase()))
            .map(fileName => `${GALLERY_PUBLIC_PATH}/${encodeURIComponent(fileName)}`);

        res.json(imageUrls);
    } catch (error) {
        console.error("Failed to load site gallery:", error);
        res.status(500).json({ error: "Failed to load site gallery" });
    }
};

exports.importExternalImage = async (req, res) => {
    try {
        const { url } = req.body;
        if (!url) return res.status(400).json({ error: "Missing URL" });

        const ext = path.extname(new URL(url).pathname) || ".jpg";
        const fileName = crypto.randomUUID() + ext;

        const dirPath = path.join(
            __dirname,
            "../public/digital-marketing-dreams/assets/images"
        );

        const filePath = path.join(dirPath, fileName); // ✅ FIX

        // Ensure directory exists
        fs.mkdirSync(dirPath, { recursive: true });

        const response = await axios({
            method: "GET",
            url,
            responseType: "stream"
        });

        await new Promise((resolve, reject) => {
            const stream = fs.createWriteStream(filePath); // ✅ FIX
            response.data.pipe(stream);
            stream.on("finish", resolve);
            stream.on("error", reject);
        });

        res.json({
            localUrl: `assets/images/${fileName}`
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({
            error: "Image download failed",
            details: err.message
        });
    }
};