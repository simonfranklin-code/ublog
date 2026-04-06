/* eslint-disable no-undef */
// eslint-disable-next-line no-unused-vars
const LiveTextSyncPlugin = (function () {
    let observer = null;
    let isApplying = false;
    let historyStack = [];
    let historyIndex = -1;
    let isUndoing = false;
    let activeButton = null;
    let isEditingLink = false;
    let patchTimer = null;
    let previewSelector = null;
    let componentRef = null;


    function init(selector, component) {
        previewSelector = selector;
        componentRef = component;
        start();
    }
    function applyFormat(command, value = null) {

        const preview = document.getElementById("editableDraftHtmlContent");
        if (!preview) return;

        preview.focus();

        const selection = window.getSelection();
        if (!selection.rangeCount) return;

        const range = selection.getRangeAt(0);

        if (!preview.contains(range.commonAncestorContainer)) return;

        safelyApply(() => {

            document.execCommand(command, false, value);

            normalizeFormatting(preview);

        });

    }


    function updateToolbarState() {

        const selection = window.getSelection();
        if (!selection.rangeCount) return;

        let node = selection.anchorNode;

        if (node.nodeType === Node.TEXT_NODE) {
            node = node.parentElement;
        }

        const bar = document.getElementById("liveTextToolbar");
        if (!bar) return;

        const boldBtn = bar.querySelector('[data-cmd="bold"]');
        const italicBtn = bar.querySelector('[data-cmd="italic"]');
        const linkBtn = bar.querySelector('[data-cmd="link"]');

        boldBtn.classList.toggle("active", !!node.closest("strong"));
        italicBtn.classList.toggle("active", !!node.closest("em"));
        linkBtn.classList.toggle("active", !!node.closest("a"));
    }

    function schedulePatch(ctx, liveEl, selector) {
        clearTimeout(patchTimer);
        patchTimer = setTimeout(() => {
            patchHTML(ctx, liveEl, selector);
        }, 50);
    }

    function handleSelection() {

        const selection = window.getSelection();
        if (isEditingLink) return;

        if (!selection || selection.isCollapsed) {
            hideToolbar();
            hideTypographyPanel();
            return;
        }

        const range = selection.getRangeAt(0);
        const rect = range.getBoundingClientRect();

        if (!rect || rect.width === 0) {
            hideToolbar();
            return;
        }

        createTextToolbar();
        //createTypographyPanel();
        const bar = document.getElementById("liveTextToolbar");


        bar.style.top = (rect.top - 40) + "px";
        bar.style.left = (rect.left + rect.width / 2 - 50) + "px";
        bar.style.display = "block";


        syncTypographyPanel();

        updateToolbarState();

    }

    function updateSelectedThemeStyle(newStyle) {

        const selection = window.getSelection();
        if (!selection.rangeCount) return;

        let node = selection.anchorNode;

        if (node.nodeType === Node.TEXT_NODE) {
            node = node.parentElement;
        }

        const editableEl = resolveEditableEl(node);
        if (!editableEl) return;

        let selector = editableEl.dataset.appSelector;

        if (!selector) {
            if (editableEl.id) selector = "#" + editableEl.id;
            else if (editableEl.classList.length) selector = "." + editableEl.classList[0];
        }

        if (!selector) return;

        updateThemeStyle(selector, newStyle);
    }

    function syncDropdownValue() {

        const selection = window.getSelection();
        if (!selection.rangeCount) return;

        let node = selection.anchorNode;

        if (node.nodeType === Node.TEXT_NODE) {
            node = node.parentElement;
        }

        const editableEl = resolveEditableEl(node);
        if (!editableEl) return;

        const current = editableEl.getAttribute("mbr-theme-style");

        const dropdown = document.getElementById("displayStyleDropdown");
        if (!dropdown) return;

        if (current) {
            dropdown.value = current;
        }
    }

    function hideToolbar() {
        const bar = document.getElementById("liveTextToolbar");
        if (bar) bar.style.display = "none";
    }

    function bindTextSelection() {

        const preview = document.getElementById("editableDraftHtmlContent");
        if (!preview) return;

        preview.addEventListener("mouseup", handleSelection);
        preview.addEventListener("keyup", handleSelection);
    }



    function createTextToolbar() {

        if (document.getElementById("liveTextToolbar")) return;

        const bar = document.createElement("div");
        bar.id = "liveTextToolbar";
        bar.innerHTML = `
    <div>
        <button data-cmd="bold"><b>B</b></button>
        <button data-cmd="italic"><i>I</i></button>
        <button data-cmd="link">🔗</button>

        <label>Display</label>
        <select id="typoDisplay">
            <option value="display-1">Title 1</option>
            <option value="display-2">Title 2</option>
            <option value="display-3">Title 3</option>
            <option value="display-4">Menu</option>
            <option value="display-5">Title 5</option>
            <option value="display-7">Text</option>
        </select>
    </div>
    `;

        document.body.appendChild(bar);

        // ✅ FIX: only block default for buttons
        bar.addEventListener("mousedown", e => {

            const btn = e.target.closest("button");
            if (!btn) return; // allow select to work normally

            e.preventDefault();
            e.stopPropagation();

            const cmd = btn.dataset.cmd;
            if (!cmd) return;

            const selection = window.getSelection();
            if (!selection.rangeCount || selection.isCollapsed) return;

            const range = selection.getRangeAt(0);

            if (!document.getElementById("editableDraftHtmlContent").contains(range.commonAncestorContainer)) {
                return;
            }

            if (cmd === "bold") applyFormat("bold");
            if (cmd === "italic") applyFormat("italic");

            if (cmd === "link") {

                const existingLink =
                    findParentLink(selection.anchorNode) ||
                    findParentLink(selection.focusNode);

                safelyApply(() => {

                    let linkEl;

                    if (existingLink) {
                        linkEl = existingLink;
                    } else {
                        linkEl = wrapRange(range, "a", {
                            href: "#",
                            class: "text-primary"
                        });

                        const newRange = document.createRange();
                        newRange.selectNodeContents(linkEl);

                        selection.removeAllRanges();
                        selection.addRange(newRange);
                    }

                    openLinkEditor(linkEl);
                });
            }
        });

        // ✅ FIX: attach once, not inside mousedown
        const displaySelect = bar.querySelector("#typoDisplay");

        displaySelect.addEventListener("change", function () {
            updateSelectedThemeStyle(this.value);
        });

        function findParentLink(node) {
            while (node && node !== document) {
                if (node.nodeType === 1 && node.tagName === "A") return node;
                node = node.parentNode;
            }
            return null;
        }

        document.addEventListener("mousedown", e => {

            const linkEditor = document.getElementById("liveLinkEditor");

            if (
                !bar.contains(e.target) &&
                !(linkEditor && linkEditor.contains(e.target))
            ) {
                bar.style.display = "none";
            }
        });
    }

    function wrapRange(range, tagName, attrs = {}) {

        const wrapper = document.createElement(tagName);

        Object.entries(attrs).forEach(([k, v]) => {
            wrapper.setAttribute(k, v);
        });

        const content = range.extractContents();

        // Prevent wrapping already formatted content
        if (content.firstChild && content.firstChild.tagName === tagName.toUpperCase()) {
            return content.firstChild;
        }

        wrapper.appendChild(content);
        range.insertNode(wrapper);

        return wrapper;
    }




    function openLinkEditor(button) {

        isEditingLink = true;
        activeButton = button;  // 🔥 YOU NEED THIS

        createLinkEditor();

        const editor = document.getElementById("liveLinkEditor");
        const input = document.getElementById("liveLinkInput");

        const rect = button.getBoundingClientRect();

        editor.style.top = (rect.bottom + window.scrollY + 8) + "px";
        editor.style.left = (rect.left + window.scrollX) + "px";
        editor.style.display = "block";

        input.value = button.getAttribute("href") || "";

        setTimeout(() => input.focus(), 0);
    }

    function createLinkEditor() {

        if (document.getElementById("liveLinkEditor")) return;

        const editor = document.createElement("div");
        editor.id = "liveLinkEditor";
        editor.innerHTML = `
            <div class="live-link-box">
                <input type="text" id="liveLinkInput" placeholder="Enter URL">

                <div class="live-link-actions">
                    <button id="liveLinkSave" type="button">Save</button>
                    <button id="liveLinkRemove" type="button">Remove</button>
                    <button id="liveLinkCancel" type="button">Cancel</button>
                </div>
            </div>
            `;

        document.body.appendChild(editor);

        const saveBtn = editor.querySelector("#liveLinkSave");
        const removeBtn = editor.querySelector("#liveLinkRemove");
        const cancelBtn = editor.querySelector("#liveLinkCancel");
        const input = editor.querySelector("#liveLinkInput");
        saveBtn.onclick = function () {

            if (!activeButton) return;

            const url = input.value.trim() || "#";

            activeButton.setAttribute("href", url);

            isEditingLink = false;
            editor.style.display = "none";

        };

        removeBtn.onclick = function () {

            if (!activeButton) return;

            const parent = activeButton.parentNode;

            while (activeButton.firstChild) {
                parent.insertBefore(activeButton.firstChild, activeButton);
            }

            parent.removeChild(activeButton);

            activeButton = null;
            isEditingLink = false;

            editor.style.display = "none";
        };


        cancelBtn.onclick = function () {

            isEditingLink = false;
            editor.style.display = "none";

        };


        // 🔥 SAVE
        saveBtn.addEventListener("click", function (e) {
            e.stopPropagation();

            if (activeButton) {
                const url = input.value.trim();

                if (url) {
                    activeButton.setAttribute("href", url);
                } else {
                    activeButton.removeAttribute("href");
                }
            }

            editor.style.display = "none";
            isEditingLink = false;
        });

        // 🔥 CANCEL
        cancelBtn.addEventListener("click", function (e) {
            e.stopPropagation();
            editor.style.display = "none";
            isEditingLink = false;
        });

        // 🔥 Close on outside click
        document.addEventListener("mousedown", e => {

            const toolbar = document.getElementById("liveTextToolbar");

            if (
                !editor.contains(e.target) &&
                !(toolbar && toolbar.contains(e.target))
            ) {
                editor.style.display = "none";
                isEditingLink = false;
            }
        });
    }


    function bindButtonEditing() {

        const preview = document.getElementById("editableDraftHtmlContent");

        preview.querySelectorAll(".btn").forEach(btn => {

            if (btn.dataset.hrefBound) return;

            btn.dataset.hrefBound = "true";
            btn.setAttribute("contenteditable", "true");

            btn.addEventListener("dblclick", function (e) {
                e.preventDefault();
                openLinkEditor(this);
            });
        });
    }

    function start() {
        const preview = document.querySelector(previewSelector);
        document.addEventListener("keydown", onKeyDown);
        if (!preview) return;

        observer = new MutationObserver(onMutations);
        historyStack = [preview.innerHTML];
        historyIndex = 0;
        observer.observe(preview, {
            subtree: true,
            characterData: true,
            childList: true,
            attributes: true,
            attributeFilter: ["href"]
        });
        createTextToolbar();
        bindTextSelection();
        bindButtonEditing(); // keep your existing
        bindLinkClicks();
    }

    function bindLinkClicks() {

        const preview = document.getElementById("editableDraftHtmlContent");

        preview.addEventListener("click", function (e) {

            const link = e.target.closest("a");

            if (!link) return;

            e.preventDefault();

            openLinkEditor(link);

        });


    }
    function onKeyDown(e) {

        if (e.ctrlKey && e.key === "z") {
            e.preventDefault();
            undo();
        }

        if (e.ctrlKey && e.key === "y") {
            e.preventDefault();
            redo();
        }
    }
    function stop() {
        document.removeEventListener("keydown", onKeyDown);
        observer?.disconnect();
        observer = null;
    }
    function safelyApply(fn) {
        //isApplying = true;
        try {
            fn();
        } finally {
            // Delay reset to next microtask
            Promise.resolve().then(() => {
                isApplying = false;
            });
        }
    }

    function onMutations(mutations) {
        if (isApplying) return;

        const ctx = {
            component: $("#controls").data("component"),
            componentEl: $("#controls").data("componentEl")
        };

        if (!ctx.component || !ctx.componentEl) return;

        let changed = false;

        mutations.forEach(m => {
            let rawTarget = m.target;

            if (rawTarget.nodeType === Node.TEXT_NODE) {
                rawTarget = rawTarget.parentElement;
            }

            if (m.addedNodes && m.addedNodes.length) {
                rawTarget = m.addedNodes[0];
            }


            if (!rawTarget) return;

            const editableEl = resolveEditableEl(rawTarget);
            if (!editableEl) return;

            let selector = editableEl.dataset.appSelector;

            // If no explicit selector, build one from class
            if (!selector) {

                if (editableEl.id) {
                    selector = "#" + editableEl.id;
                }

                else if (editableEl.classList.length) {
                    selector = "." + editableEl.classList[0];
                }

            }


            if (!selector) return;

            schedulePatch(ctx, editableEl, selector);
            changed = true;
        });

        if (changed) {
            Hooks.emit("html:updated", ctx.component._customHTML, ctx);
        }

        if (changed) {
            bindButtonEditing();
        }
    }

    //document.addEventListener("mousedown", function (e) {

    //    const panel = document.getElementById("typographyPanel");
    //    if (!panel) return;

    //    if (panel.contains(e.target)) {
    //        e.stopPropagation(); // keep selection alive
    //    }

    //});


    function resolveEditableEl(node) {
        if (!node) return null;

        // Text node → element
        if (node.nodeType === Node.TEXT_NODE) {
            node = node.parentElement;
        }

        if (!node) return null;

        // 1️⃣ First priority: explicit selector
        const explicit = node.closest("[data-app-selector]");
        if (explicit) return explicit;

        // 2️⃣ Fallback classes (auto-detect editable elements)
        const fallbackClasses = [
            ".mbr-section-title",
            ".mbr-section-subtitle",
            ".mbr-text",
            ".mbr-item-title",
            ".mbr-item-subtitle",
            ".mbr-section-btn .btn",
            ".btn",
            ".mbr-text, .mbr-section-btn"
        ];

        for (const selector of fallbackClasses) {
            const found = node.closest(selector);
            if (found) return found;
        }

        return null;
    }

    function normalizeFormatting(root) {

        root.querySelectorAll("b b").forEach(node => {
            const parent = node.parentNode;
            while (node.firstChild) parent.insertBefore(node.firstChild, node);
            parent.removeChild(node);
        });

        root.querySelectorAll("i i").forEach(node => {
            const parent = node.parentNode;
            while (node.firstChild) parent.insertBefore(node.firstChild, node);
            parent.removeChild(node);
        });

    }

    function patchHTML(ctx, liveEl, appSelector) {

        safelyApply(() => {
            try {
                const temp = document.createElement("div");
                temp.innerHTML = componentRef._customHTML || document.querySelector(previewSelector).innerHTML;
                normalizeFormatting(liveEl);

                const sourceEl = temp.querySelector(appSelector);
                console.log("Source element found:", sourceEl);
                if (!sourceEl) return;



                sourceEl.innerHTML = liveEl.innerHTML;

                const newHTML = temp.innerHTML;

                if (!isUndoing && historyStack[historyIndex] !== newHTML) {
                    historyStack = historyStack.slice(0, historyIndex + 1);
                    historyStack.push(newHTML);
                    historyIndex++;
                }

                componentRef._customHTML = newHTML;

                if (ifrHTML?.editor?.getValue() !== newHTML) {
                    ifrHTML.editor.setValue(newHTML);
                }
                console.log("Patching selector:", appSelector);
            } catch (e) {
                alert("Error applying changes: " + e.message);
            }

        });

    }

    function hideTypographyPanel() {
        const panel = document.getElementById("typographyPanel");
        if (panel) panel.style.display = "none";
    }
    function syncTypographyPanel() {

        const selection = window.getSelection();
        if (!selection.rangeCount) return;

        let node = selection.anchorNode;

        if (node.nodeType === Node.TEXT_NODE) {
            node = node.parentElement;
        }

        const editableEl = resolveEditableEl(node);
        if (!editableEl) return;

        const current = editableEl.getAttribute("mbr-theme-style");

        const select = document.getElementById("typoDisplay");
        if (!select) return;

        if (current) {
            select.value = current;
        }
    }


    async function updateThemeStyle(selector, newStyle) {

        if (!componentRef?._customHTML) return;

        const temp = document.createElement("div");
        temp.innerHTML = componentRef._customHTML;

        const el = temp.querySelector(selector);
        if (!el) return;

        el.setAttribute("mbr-theme-style", newStyle);

        const newHTML = temp.innerHTML;

        // history
        if (historyStack[historyIndex] !== newHTML) {
            historyStack = historyStack.slice(0, historyIndex + 1);
            historyStack.push(newHTML);
            historyIndex++;
        }

        componentRef._customHTML = newHTML;

        if (ifrHTML?.editor?.getValue() !== newHTML) {
            ifrHTML.editor.setValue(newHTML);
        }

        // reflect in live preview
        const liveEl = document.querySelector(selector);
        if (liveEl) {
            liveEl.setAttribute("mbr-theme-style", newStyle);
        }

    }

    function undo() {
        if (historyIndex <= 0) return;

        isUndoing = true;
        historyIndex--;

        const html = historyStack[historyIndex];
        applyHistory(html);
        isUndoing = false;
    }

    function redo() {
        if (historyIndex >= historyStack.length - 1) return;

        isUndoing = true;
        historyIndex++;

        const html = historyStack[historyIndex];
        applyHistory(html);
        isUndoing = false;
    }

    function applyHistory(html) {
        const ctx = {
            component: $("#controls").data("component")
        };

        ctx.component._customHTML = html;

        document.getElementById("editableDraftHtmlContent").innerHTML = html;
        ifrHTML.editor.setValue(html);
    }

    Hooks.on("editor:ready", start);
    Hooks.on("editor:destroy", stop);

    return { init, start, stop };
})();