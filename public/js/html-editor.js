// ---------------------------------------------
// WYSIWYG CONTROLLER
// ---------------------------------------------
const WysiwygController = (function () {

    let isActive = false;
    let $editable = null;
    let originalHTML = "";

    return {

        /**
         * Initialize controller
         * @param {string|jQuery} selector - The editable HTML container
         */
        init(selector) {
            $editable = $(selector);
            if (!$editable.length) {
                console.error("WysiwygController: Editable element not found");
                return;
            }
        },

        /**
         * Toggle editing mode
         */
        toggle() {
            if (!isActive) this.start();
            else this.stop();
        },

        /**
         * Enable contentEditable mode
         */
        start() {
            if (!$editable) return;

            isActive = true;
            originalHTML = $editable.html();

            $editable.attr("contenteditable", "true");
            $editable.addClass("wysiwyg-active");

            console.log("WYSIWYG: Editing started");
        },

        /**
         * Disable editing mode
         */
        stop() {
            if (!$editable) return;

            isActive = false;
            $editable.attr("contenteditable", "false");
            $editable.removeClass("wysiwyg-active");

            console.log("WYSIWYG: Editing stopped");
        },

        /**
         * Return edited HTML (sanitized for Mobirise)
         */
        getEditedHTML() {
            if (!$editable) return "";

            let html = $editable.html();

            // Remove WYSIWYG helper attributes/classes
            html = html.replace(/contenteditable="true"/gi, "");
            html = html.replace(/\s?class="wysiwyg-active"/gi, "");

            return html.trim();
        },

        /**
         * Apply edited HTML into the component + preview
         */
        async applyToComponent(curr, $compEl, reactiveParamsHandle) {
            if (!curr || !$compEl) return;

            const newHTML = this.getEditedHTML();

            // Update Mobirise component object
            curr._customHTML = newHTML;

            // Update the DOM version stored in data()
            const newDom = $(newHTML);
            $compEl.replaceWith(newDom);

            // Rebind the new DOM root
            $("#controls").data("componentEl", newDom);

            // Update reactive engine
            if (reactiveParamsHandle && typeof reactiveParamsHandle.then === "function") {
                reactiveParamsHandle = await reactiveParamsHandle;
            }
            if (reactiveParamsHandle && reactiveParamsHandle._updateFromHTML) {
                // If reactive preview supports HTML sync
                reactiveParamsHandle._updateFromHTML(newHTML);
            }

            return newHTML;
        },

        /**
         * Reset any unsaved changes
         */
        reset() {
            if (!$editable) return;
            $editable.html(originalHTML);
        }
    };
})();

const Hooks = (function () {
    const listeners = {};

    function on(event, fn) {
        if (!listeners[event]) listeners[event] = [];
        listeners[event].push(fn);
    }

    function off(event, fn) {
        if (!listeners[event]) return;
        listeners[event] = listeners[event].filter(f => f !== fn);
    }

    function emit(event, ...args) {
        if (!listeners[event]) return;
        for (const fn of listeners[event]) {
            try {
                fn(...args);
            } catch (e) {
                console.error(`Hook error [${event}]`, e);
            }
        }
    }

    return { on, off, emit };
})();

const LiveTextSyncPlugin = (function () {
    let observer = null;
    let isApplying = false;

    function start() {
        const preview = document.getElementById("editableDraftHtmlContent");
        if (!preview) return;

        observer = new MutationObserver(onMutations);

        observer.observe(preview, {
            subtree: true,
            characterData: true,
            childList: true
        });
    }

    function stop() {
        observer?.disconnect();
        observer = null;
    }
    function safelyApply(fn) {
        isApplying = true;
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
            const rawTarget =
                m.target.nodeType === Node.TEXT_NODE
                    ? m.target.parentElement
                    : m.target;

            if (!rawTarget) return;

            const editableEl = resolveEditableEl(rawTarget);
            if (!editableEl) return;

            const selector = editableEl.dataset.appSelector;
            if (!selector) return;

            patchHTML(ctx, editableEl, selector);
            changed = true;
        });

        if (changed) {
            isApplying = true;
            Hooks.emit("html:updated", ctx.component._customHTML, ctx);
            isApplying = false;
        }
    }

    const CLASS_SELECTOR_MAP = [
        { match: ".mbr-section-title", selector: ".mbr-section-title" },
        { match: ".mbr-section-subtitle", selector: ".mbr-section-subtitle" },
        { match: ".mbr-item-title", selector: ".mbr-item-title" },
        { match: ".mbr-item-subtitle", selector: ".mbr-item-subtitle" },
        { match: ".mbr-text", selector: ".mbr-text" }
    ];

    function resolveEditableEl(node) {
        if (!node) return null;

        if (node.nodeType === Node.TEXT_NODE) {
            node = node.parentElement;
        }
        if (!node) return null;

        // 1️⃣ Explicit selector (preferred)
        const explicit = node.closest("[data-app-selector]");
        if (explicit) return explicit;

        // 2️⃣ Infer from Mobirise semantic classes
        for (const rule of CLASS_SELECTOR_MAP) {
            const el = node.closest(rule.match);
            if (el) {
                // Inject selector so future edits are fast
                el.dataset.appSelector = rule.selector;
                return el;
            }
        }

        return null;
    }


    function patchHTML(ctx, liveEl, appSelector) {
        safelyApply(() => {
            const temp = document.createElement("div");
            temp.innerHTML = ctx.component._customHTML;

            const sourceEl = temp.querySelector(appSelector);
            if (!sourceEl) return;

            sourceEl.innerHTML = liveEl.innerHTML;

            ctx.component._customHTML = temp.innerHTML;

            // 🔥 sync editor WITHOUT retriggering observer
            ifrHTML.editor.setValue(ctx.component._customHTML);
        });
    }


    Hooks.on("editor:ready", start);
    Hooks.on("editor:destroy", stop);

    return { start, stop };
})();

/**
 * Build a default params object from a Mobirise component's <mbr-parameters>
 * @param {string} customHTML - the Mobirise _customHTML string
 * @returns {object} params - key/value map of parameter defaults
 */
function extractDefaultParams(customHTML) {
    const { controls } = parseMbrParameters(customHTML);
    const params = {};

    controls.forEach(ctrl => {
        if (ctrl.kind === 'checkbox') {
            params[ctrl.name] = ctrl.attrs.checked || false;
        }

        else if (ctrl.kind === 'range') {
            const val = ctrl.value || ctrl.attrs.min || 0;
            params[ctrl.name] = Number(val);
        }

        else if (['color', 'image', 'video'].includes(ctrl.kind)) {
            if (ctrl.kind === 'color') {
                params[ctrl.name] = ctrl.value;
            } else {
                params[ctrl.name] = ctrl.value || '';
            }
        }

        else if (ctrl.kind === 'background') {
            const selected =
                ctrl.options.find(o => o.attrs?.selected || o.selected) ||
                ctrl.options[0];

            params[ctrl.name] = {
                type: selected.kind,
                value: selected.value,
                parallax: ctrl.attrs.parallax || false
            };
        }

        else if (ctrl.kind === 'select') {
            const selected =
                ctrl.options.find(o => o.selected) ||
                ctrl.options[0];

            params[ctrl.name] = selected ? selected.value : null;
        }
    });

    return { _params: params, _schema: controls, meta: { found: true, count: controls.length } };
}


function attrBool(val) {
    if (val === '' || val === true || val === 'true' || val === 'checked') return true;
    if (val === 'false' || val === undefined) return false;
    return !!val;
}

function parseMbrParameters(customHTML) {
    const $root = $(customHTML); // detached DOM fragment

    const $params = $root.filter('mbr-parameters').add($root.find('mbr-parameters'));
    const controls = [];
    if ($params.length === 0) return { controls, meta: { found: false } };

    $params.children().each((_, el) => {
        const tag = el.tagName?.toLowerCase();
        const $el = $(el);

        // HEADER
        if (tag === 'header') {
            controls.push({
                kind: 'header',
                title: $el.text().trim(),
                attrs: { condition: $el.attr('condition') || null }
            });
            return;
        }

        // INPUT
        if (tag === 'input') {
            const type = ($el.attr('type') || 'text').toLowerCase();
            controls.push({
                kind: type,
                name: $el.attr('name') || null,
                title: $el.attr('title') || null,
                value: $el.attr('value') ?? null,
                attrs: {
                    condition: $el.attr('condition') || null,
                    min: $el.attr('min') || null,
                    max: $el.attr('max') || null,
                    step: $el.attr('step') || null,
                    inline: attrBool($el.attr('inline')),
                    selected: attrBool($el.attr('selected')),
                    checked: attrBool($el.attr('checked'))
                }
            });
            return;
        }

        // SELECT
        if (tag === 'select') {
            const options = [];
            $el.children('option').each((__, opt) => {
                const $opt = $(opt);
                options.push({
                    label: $opt.text().trim(),
                    value: $opt.attr('value') ?? $opt.text().trim(),
                    selected: attrBool($opt.attr('selected'))
                });
            });

            controls.push({
                kind: 'select',
                name: $el.attr('name') || null,
                title: $el.attr('title') || null,
                value:
                    options.find(o => o.selected)?.value ??
                    options[0]?.value ??
                    null,
                options
            });
            return;
        }

        // FIELDSET
        if (tag === 'fieldset') {
            const fType = ($el.attr('type') || '').toLowerCase();
            const name = $el.attr('name') || null;
            const parallax = attrBool($el.attr('parallax'));

            const children = [];
            $el.children('input').each((__, child) => {
                const $c = $(child);
                children.push({
                    kind: ($c.attr('type') || 'text').toLowerCase(),
                    name: $c.attr('name') || null,
                    title: $c.attr('title') || null,
                    value: $c.attr('value') ?? null,
                    attrs: {
                        selected: attrBool($c.attr('selected')),
                        condition: $c.attr('condition') || null
                    }
                });
            });

            controls.push({
                kind: fType || 'fieldset',
                name,
                title: name,
                attrs: { parallax },
                options: children
            });
        }
    });

    return { controls, meta: { found: true, count: controls.length } };
}

async function setReferences() {
    //// Set references for quick access
    ifrJSON = $("#witsec-code-editor-iframe-JSON")[0].contentWindow;
    ifrHTML = $("#witsec-code-editor-iframe-html")[0].contentWindow;
    ifrCSS_LESS = $("#witsec-code-editor-iframe-css-less")[0].contentWindow;
    ifrCSS = $("#witsec-code-editor-iframe-css")[0].contentWindow;
    ifrRenderedHtml = $("#witsec-code-editor-iframe-render-html")[0].contentWindow;
    ifrParams = $("#witsec-code-editor-iframe-params")[0].contentWindow;


}

$(document).ready(async function () {
    let reactiveParamsHandle = null; // holds Proxy returned by the jQuery reactive plugin
    let currentHtmlSectionId = 0;
    let currentHtmlSectionAnchor = '';
    let selectedText = '';
    let htmlSections = null;
    let selectedBlogPostIndex;
    let currentTab = $('#editorTab .nav-link.active')[0];
    let $compEl = null;

    WysiwygController.init("#editableDraftHtmlContent");
    await setReferences();

    // Set editor columns to max height available
    $(window).resize(function () {
        $(".witsec-code-editor-iframe").height(window.innerHeight - 140);	// 140 is the height of the header
    });
    $(".witsec-code-editor-iframe").height(window.innerHeight - 140);	// 140 is the height of the header

    async function initComponent() {
        var url = `/editor/getComponentFromHtmlSection/` + htmlSectionId;
        $.ajax({
            url: url,
            method: 'GET',
            success: async function (data) {
                if (!data || !data.component) {
                    console.error('Component data is missing or malformed');
                } else {
                    curr = JSON.parse(data.component);
                }


                $('#controls')
                    .data('component', curr)
                    .data('componentEl', $(curr._customHTML));
                const { _schema, _params } = extractDefaultParams(curr._customHTML);
                schema = _schema;
                params = _params;
                

                renderControls(schema, params);
                
            },
            error: function (err) {
                console.error('Error fetching blog posts:', err);
            }
        });

    }

    async function setEditorLanguages() {

        if (ifrJSON && ifrJSON.editorReady) {
            // For ifrJSON editor
            const modelJSON = ifrJSON.editor.getModel();
            ifrJSON.monaco.editor.setModelLanguage(modelJSON, "javascript");

        }

        if (ifrHTML && ifrHTML.editorReady) {
            // For ifrHTML editor
            const modelHTML = ifrHTML.editor.getModel();
            ifrHTML.monaco.editor.setModelLanguage(modelHTML, "php");
        }

        if (ifrCSS_LESS && ifrCSS_LESS.editorReady) {
            // For ifrCSS_LESS editor
            const modelLESSCSS = ifrCSS_LESS.editor.getModel();
            ifrCSS_LESS.monaco.editor.setModelLanguage(modelLESSCSS, "less");
        }

        if (ifrCSS && ifrCSS.editorReady) {
            // For ifrCSS editor
            const modelCSS = ifrCSS.editor.getModel();
            ifrCSS.monaco.editor.setModelLanguage(modelCSS, "less");
        }

        if (ifrRenderedHtml && ifrRenderedHtml.editorReady) {
            // For ifrRenderedHtml editor
            const modelRenderedHtml = ifrRenderedHtml.editor.getModel();
            ifrRenderedHtml.monaco.editor.setModelLanguage(modelRenderedHtml, "php");
        }

        if (ifrParams && ifrParams.editorReady) {
            // For ifrParams editor
            const modelParams = ifrParams.editor.getModel();
            ifrParams.monaco.editor.setModelLanguage(modelParams, "javascript");
        }

        // Empty the editors (this will put the cursor back on line 1)
        //ifrJSON.editor.setValue("");
        //ifrHTML.editor.setValue("");
        //ifrCSS_LESS.editor.setValue("");
        //ifrCSS.editor.setValue("");
        //ifrRenderedHtml.editor.setValue("");
        //ifrParams.editor.setValue("");
        // Set the editor contents


    }


    $('button[data-bs-toggle="tab"]').on('show.bs.tab', async function (event) {
        currentTab = event.target
        if (currentTab.id === 'code-tab') {
            let iframeSrc = `/users/htmlSections/editor/` + htmlSectionId;
            $('#viewHtmlSectionEditorFrame').attr('src', iframeSrc);
        } else if (currentTab.id === 'wysiwyg-tab') {

            const iframeWindow = $('#viewHtmlSectionEditorFrame')[0].contentWindow;
            $('#editableHtmlContent').html(iframeWindow.editor.getValue());
            $('#imageUploadInput').on('change', imageUpload);
        } else if (currentTab.id === 'mobirise-tab') {
            //await initComponent();
            // Set editor columns to max height available
            $(".witsec-code-editor-iframe").css("height", window.innerHeight - 40);	// 40 is the height of the header



        } else if (currentTab.id === 'render-tab') {
            openParamsEditor();
        }

    });

    $('#buttonreplace').on('click', function (e) {
        $('#findAndReplaceForm').submit();
    });

    $('#upload').on('click', function (e) {
        
    });

    
    $('#edit-html').on('click', function () {
        //const contentDiv = $('#editableHtmlContent');
        //const isEditable = contentDiv.attr('contenteditable') === 'true';
        //contentDiv.attr('contenteditable', !isEditable);
        //$('#save-html').attr('disabled', isEditable);
        WysiwygController.toggle();
    });


    $('#save-html').on('click', async function () {
        try {
            
            const $form = $("#controls");
            const $compObj = $form.data("component");
            const $compEl = $form.data("componentEl");
            if (!$compObj) return;

            // Sync HTML from preview
            //$compObj._customHTML = $compEl[0].outerHTML;
            $compObj._customHTML = ifrHTML.editor.getValue();
            const payload = {
                component: $compObj,
                HtmlSectionId: htmlSectionId || null
            };

            $.ajax({
                url: `/editor/edit/${pageName}/${$compObj._anchor || ''}`,
                method: "POST",
                data: payload,
                success: async () => await initComponent(),
                error: (err) => console.error("Save failed", err)
            });
        } catch (e) {
            alert(JSON.stringify(e));
        }




    });

    $('#findAdReplaceBtn').on('click', function (e) {
        e.preventDefault();
        $('#findAndReplaceModal').modal('show');
    });


    $('#findAndReplaceForm').on('submit', function (e) {
        e.preventDefault();
        const find = $('#find-text').val();
        const replace = $('#replace-text').val();
        let blogPostId = null;

        if ($('#replace-all').is(':checked')) {
            blogPostId = null;
        } else {
            blogPostId = $('#blogPostIdFilter').val();
        }


        $.ajax({
            url: '/admin/htmlSections/findAndReplace',
            method: 'POST',
            data: {
                find: find,
                replace: replace,
                blogPostId: blogPostId
            },
            success: function (response) {
                if (response.success) {
                    $('#findAndReplaceModal').modal('hide');
                    alert(response.message)
                } else {
                    alert('Find And Replace Failed.');
                }
            },
            error: function (err) {
                alert(JSON.stringify(err));
            }
        });
    });


    $('#importHtmlSectionBtn').on('click', function () {

        const htmlSectionsFromDb = htmlSections;

        $.ajax({
            url: '/admin/htmlSections/importSingleHtmlSectionById/solid-foundation-knowledge-is-power-in-digital-marketing/2',
            method: 'GET',

            success: function (htmlSectionsFromFile) {

                if (htmlSectionsFromDb !== 'undefined' && htmlSectionsFromDb.length > 0) {
                    for (let i = 0; i < htmlSectionsFromFile.length; i++) {
                        const htmlSectionId = htmlSectionsFromDb[i].HtmlSectionID;
                        const dbAnchor = htmlSectionsFromDb[i].Anchor;
                        const [htmlContent, anchor] = htmlSectionsFromFile[i];
                        const blogPostId = $('#blogPostIdFilter').val();
                        if (dbAnchor === anchor) {

                            $.ajax({
                                url: '/admin/htmlSections/updateBySectionId',
                                method: 'POST',
                                data: {
                                    blogPostId,
                                    htmlSectionId,
                                    htmlContent
                                },
                                success: function (data) {
                                    console.log(JSON.stringify(data));
                                },
                                error: function (err) {
                                    console.log(JSON.stringify(err));
                                }
                            });
                        }
                    }

                }
                ///alert(JSON.stringify(data));
            },
            error: function (err) {
                alert(JSON.stringify(err));
            }
        });
    });

    $('#image-html').on('click', triggerImageUpload);

    $('.image-wrapper > img').on('click', triggerImageUpload);
    function triggerImageUpload() {
        const $input = $('#imageUploadInput');
        $('#imageUploadInput').on('change', imageUpload);
        $input.click();
    }

    $('#download').on('click', async function () {
        await initComponent();
        await renderUI();
        await setEditorLanguages(curr, params);
    });

    $('#refresh').on('click', async function() { 

        await renderUI();
        await setEditorLanguages(curr, params);
    });


    function imageUpload() {
        try {


            var url = window.location.pathname;
            var anchor = url.split("/")['5'];

            const file = this.files[0];
            if (file) {
                const formData = new FormData();
                formData.append('image', file);

                $.ajax({
                    url: '/admin/htmlSections/uploadImage',
                    type: 'POST',
                    data: formData,
                    processData: false,
                    contentType: false,
                    success: function (response) {
                        if (response.success) {
                            const imageUrl = response.imageUrl;
                            const section = $('#' + anchor);
                            if (section.hasClass('header1')) {
                                section.attr('style', 'background-image: url("' + imageUrl + '")');
                            } else {
                                $('.image-wrapper > img').attr('src', imageUrl);
                            }

                        } else {
                            alert('Image upload failed.');
                        }
                    },
                    error: function (err) {
                        alert('An error occurred while uploading the image. ' + JSON.stringify(err));
                    }
                });
                this.files[0] = null;
            }
        } catch (err) {
            alert(JSON.stringify(err));
        }
    }
    $('#imageUploadInput').on('change', imageUpload);


    $(document).on('click', '.delete-btn', function () {
        const htmlSectionId = $(this).data('id');
        $('#confirmDeleteBtn').data('id', htmlSectionId);
        $('#confirmDeleteModal').modal('show');
    });

    $('#confirmDeleteBtn').on('click', function () {
        const htmlSectionId = $(this).data('id');
        $.post(`/admin/htmlSections/delete/${htmlSectionId}`, function (response) {
            if (response.success) {
                $('#confirmDeleteModal').modal('hide');
                fetchHtmlSections();
            }
        });
    });




    // Function to get the selected text
    function getSelectionText() {
        let text = '';
        if (window.getSelection) {
            text = window.getSelection().toString();
        } else if (document.selection && document.selection.type != 'Control') {
            text = document.selection.createRange().text;
        }
        return text;
    }

    // Event handler for the Insert Link button
    $('#insert-link').on('click', function () {
        selectedText = getSelectionText();
        if (selectedText.length > 0) {
            $('#linkText').val(selectedText);
            $('#insertLinkModal').modal('show');
        } else {
            alert('Please select the text you want to hyperlink.');
        }
    });

    // Event handler for the Insert Link button in the modal
    $('#insertLinkBtn').on('click', function () {
        const linkUrl = $('#linkUrl').val();
        const linkText = $('#linkText').val();

        if (linkUrl && linkText) {
            const anchorTag = `<a href="${linkUrl}" target="_blank">${linkText}</a>`;
            const contentDiv = $('#editableDraftHtmlContent');
            const currentHtml = contentDiv.html();
            const newHtml = currentHtml.replace(linkText, anchorTag);
            contentDiv.html(newHtml);
            $('#insertLinkModal').modal('hide');
        } else {
            alert('Please enter the URL.');
        }
    });

    // Event handler for the Remove Link button
    $('#remove-link').on('click', function () {
        // Get the selected link
        const selectedElement = window.getSelection().anchorNode.parentNode;

        if (selectedElement.tagName === 'A') {
            // Remove the link while preserving the text
            const linkText = selectedElement.innerText;
            $(selectedElement).replaceWith(linkText);
        } else {
            alert('Please select a link to remove.');
        }
    });

    // Function to get the selected text node
    function getSelectedTextNode() {
        const selection = window.getSelection();
        if (selection.rangeCount > 0) {
            const range = selection.getRangeAt(0);
            return range.commonAncestorContainer.nodeType === 3 ? range.commonAncestorContainer : range.commonAncestorContainer.firstChild;
        }
        return null;
    }

    // Event handler for the Font Size button
    $('#font-size').on('click', function () {
        selectedText = getSelectedTextNode();
        if (selectedText) {
            $('#fontSizeModal').modal('show');
        } else {
            alert('Please select the text you want to change.');
        }
    });

    // Event handler for the Apply button in the Font Size modal
    $('#applyFontSize').on('click', function () {
        const fontSize = $('#fontSizeSelect').val();
        if (selectedText) {
            $(selectedText).css('font-size', fontSize);
            $('#fontSizeModal').modal('hide');
        }
    });

    // Event handler for the Font Family button
    $('#font-family').on('click', function () {
        selectedText = getSelectedTextNode();
        if (selectedText) {
            $('#fontFamilyModal').modal('show');
        } else {
            alert('Please select the text you want to change.');
        }
    });

    // Event handler for the Apply button in the Font Family modal
    $('#applyFontFamily').on('click', function () {
        const fontFamily = $('#fontFamilySelect').val();
        if (selectedText) {
            $(selectedText).css('font-family', fontFamily);
            $('#fontFamilyModal').modal('hide');
        }
    });

    // Event handler for the Font Color button
    $('#font-color').on('click', function () {
        selectedText = getSelectedTextNode();
        if (selectedText) {
            $('#fontColorModal').modal('show');
        } else {
            alert('Please select the text you want to change.');
        }
    });

    // Event handler for the Apply button in the Font Color modal
    $('#applyFontColor').on('click', function () {
        const fontColor = $('#fontColorInput').val();
        if (selectedText) {
            $(selectedText).css('color', fontColor);
            $('#fontColorModal').modal('hide');
        }
    });

    $('#open-params-editor').on('click', function () {
        openParamsEditor();
    });
    // Function to translate JSON to CSS
    function json2css(json) {
        var css = "";
        var prevdepth = 0;

        function eachRecursive(obj, depth = 0) {
            for (var k in obj) {
                // Indentation
                var spaces = " ".repeat(depth * 2);

                // If we're getting another hash, dive deeper
                if (typeof obj[k] == "object" && obj[k] !== null) {
                    // Let's not have a white line as first line
                    css += (css ? "\n" : "");

                    // Open brackets
                    css += spaces + k + " {\n";

                    // Dive deeper
                    eachRecursive(obj[k], depth + 1);
                } else {
                    // Write the css
                    css += spaces + k + ": " + obj[k] + ";\n";
                }

                // If current depth is less than previous depth, we've exited a hash, so let's place a closing bracket
                if (depth < prevdepth || JSON.stringify(obj[k]) == "{}") {
                    css += spaces + "}\n";
                }
                prevdepth = depth;
            }
        }

        // Go!
        eachRecursive(json);

        // Return beautiful css :)
        return css.trim();
    }

    function openParamsEditor() {


        const canvas = new bootstrap.Offcanvas(document.getElementById('paramsCanvas'));
        canvas.show();
    }

    // --- Initialize the reactive preview plugin ---
    async function renderUI() {
        try {
            const $container = $('#editableDraftHtmlContent');
            $compEl = $('#controls').data('componentEl');
            // ⚙️ Await the reactive plugin — it returns a Proxy
            reactiveParamsHandle = await $container.renderCustomHTML(
                curr._customHTML,
                params || {}, // initial params
                {
                    PROJECT_PATH: "",
                    styles: curr._styles,
                    cid: curr._cid,
                    reactive: true, // 🔥 enables live re-rendering
                    ifrEditors: {
                        json: ifrJSON.editor,
                        html: ifrHTML.editor,
                        css: ifrCSS.editor,
                        less: ifrCSS_LESS.editor,
                        rendered: ifrRenderedHtml.editor,
                        params: ifrParams.editor
                    },
                    curr: curr,
                    compEl: $compEl
                }
            );
            // 🔥 INIT LIVE TEXT SYNC HERE
            Hooks.emit("editor:ready", {
                component: curr,
                componentEl: $compEl
            });

            console.log('✅ Reactive preview initialized');
        } catch (err) {
            console.error('❌ Failed to initialize reactive preview plugin:', err);
        }
    }


    // ----------------------------------------------------
    // BACKGROUND CONTROLLER MODULE
    // ----------------------------------------------------
    const BackgroundController = {
        /**
         * Applies a bg.* parameter change.
         *
         * @param {string} name - "bg.type", "bg.color", "bg.image", "bg.video", "bg.parallax"
         * @param {*} value - new value
         * @param {object} params - component params
         * @param {jQuery} $compEl - component DOM element
         * @param {*} reactiveParamsHandle - reactive engine proxy
         */
        async apply(name, value, params, $compEl, reactiveParamsHandle) {

            // Ensure params.bg exists
            //if (!params.bg) {
            //    params.bg = {
            //        type: "image",
            //        value: "",
            //        image: "",
            //        color: "",
            //        video: "",
            //        parallax: false
            //    };
            //}

            const field = name.split(".")[1];
            const $fieldset = $compEl.find('mbr-parameters fieldset[type="background"]');

            if (!$fieldset.length) return false; // Not a Mobirise bg component

            // Remove old "selected" markers
            $fieldset.find("input").removeAttr("selected");

            switch (field) {

                case "type":
                    params.bg.type = value;
                    params.bg.value = params.bg[value] || "";

                    // Mark new selected type
                    $fieldset.find(`input[type="${value}"]`).attr("selected", "");

                    break;

                case "image":
                    params.bg.image = value;
                    if (params.bg.type === "image") params.bg.value = value;

                    $fieldset.find(`input[type="image"]`).attr("value", value);
                    $fieldset.find(`input[type="image"]`).attr("selected", '');
                    break;

                case "color":
                    params.bg.color = value;
                    if (params.bg.type === "color") params.bg.value = value;

                    $fieldset.find(`input[type="color"]`)
                        .attr("value", value)
                        .attr("color", value)
                        .attr("selected", "");
                    break;

                case "video":
                    params.bg.video = value;
                    if (params.bg.type === "video") params.bg.value = value;

                    $fieldset.find(`input[type="video"]`)
                    .attr("value", value)
                    .attr("selected", '');
                    break;

                case "parallax":
                    params.bg.parallax = value;
                    value ? $fieldset.attr("parallax", "true")
                        : $fieldset.removeAttr("parallax");
                    break;
            }

            // Update visibility of UI subs
            BackgroundController.updateVisibility(params);

            // Sync the reactive live-preview
            if (reactiveParamsHandle && typeof reactiveParamsHandle.then === "function")
                reactiveParamsHandle = await reactiveParamsHandle;

            if (reactiveParamsHandle)
                setNested(reactiveParamsHandle, name, value);

            return true; // means "background handled"
        },


        /**
         * Shows only the active background UI block.
         */
        updateVisibility(params) {
            const type = params.bg?.type || "image";

            $(".bg-sub").hide();
            $(`.bg-${type}`).show();
        }
    };

    // Save handler
    $(document).on("click", "#saveParams", async function (e) {
        e.preventDefault();
        const $form = $("#controls");
        const $compObj = $form.data("component");
        const $compEl = $form.data("componentEl");
        if (!$compObj) return;

        // Sync HTML from preview
        //$compObj._customHTML = $compEl[0].outerHTML;
        $compObj._customHTML = ifrHTML.editor.getValue();
        const payload = {
            component: $compObj,
            HtmlSectionId: htmlSectionId || null
        };

        $.ajax({
            url: `/editor/edit/${pageName}/${$compObj._anchor || ''}`,
            method: "POST",
            data: payload,
            success: async () => await initComponent(),
            error: (err) => console.error("Save failed", err)
        });

        bootstrap.Offcanvas.getInstance(document.getElementById('paramsCanvas')).hide();
    });

    function updateBackgroundVisibility(params) {
        const type = params.bg?.type || "image";

        $(".bg-sub").hide();          // hide all
        $(".bg-" + type).show();      // show selected type
    }

    /**
     * Update the <mbr-parameters> DOM element for a given parameter.
     * Handles checkboxes, color inputs, text, number, and background groups.
     *
     * @param {jQuery} $compEl - root of the Mobirise component
     * @param {string} name - parameter name (e.g., "bg.type", "paddingTop")
     * @param {any} value - new value from UI
     * @param {string} inputType - HTML input type: "color", "checkbox", "text", etc.
     */
    function updateMbrParamDom($compEl, name, value, inputType) {
        if (!$compEl || !$compEl.length) return;

        // ---------------------------------------------------------------
        // 1️⃣ BACKGROUND SPECIAL STRUCTURE
        // ---------------------------------------------------------------
        if (name === "bg.type") {
            // Mobirise stores background type inside <input name="bg">
            $compEl.find(`mbr-parameters [name="bg"]`).attr("value", value);
            return;
        }

        if (name.startsWith("bg.") && name !== "bg.type") {
            const key = name.split(".")[1]; // image, color, video, parallax

            let $input = $compEl.find(`mbr-parameters [name="bg.${key}"]`);

            if (!$input.length) {
                // Mobirise sometimes writes <input type="color" value="" color="">
                $input = $compEl.find(`mbr-parameters [type="${key}"]`);
            }

            if ($input.length) {
                if (inputType === "checkbox") {
                    value ? $input.attr("checked", "checked") : $input.removeAttr("checked");
                } else if (inputType === "color") {
                    $input.attr("value", value);
                    $input.attr("color", value); // Mobirise color quirk
                } else {
                    $input.attr("value", value);
                }
            }

            return;
        }

        // ---------------------------------------------------------------
        // 2️⃣ NORMAL PARAMETERS
        // ---------------------------------------------------------------
        let $target = $compEl.find(`mbr-parameters [name="${name}"]`);
        if (!$target.length) return;

        if (inputType === "checkbox") {
            value ? $target.attr("checked", "checked") : $target.removeAttr("checked");
        }
        else if (inputType === "color") {
            // Mobirise expects both value="" and color=""
            $target.attr("value", value);
            $target.attr("color", value);
        }
        else {
            // Standard param: update the value attribute
            $target.attr("value", value);
        }
    }


    //function handleBackgroundParam(name, value, params) {
    //    // Ensure params.bg exists
    //    if (!params.bg) params.bg = { type: "image", value: "" };

    //    // bg.type (image, color, video)
    //    if (name === "bg.type") {
    //        params.bg.type = value;
    //        return;
    //    }

    //    // bg.parallax (true/false)
    //    if (name === "bg.parallax") {
    //        params.bg.parallax = value;
    //        return;
    //    }

    //    // bg.image / bg.color / bg.video
    //    const field = name.split(".")[1];
    //    params.bg[field] = value;

    //    // The "active" bg value must match the selected type
    //    if (params.bg.type === field) {
    //        params.bg.value = value;
    //    }
    //}

    $(document).on("input change", ".param-input", async function () {
        const $form = $("#controls");
        const $compObj = $form.data("component");
        const $compEl = $form.data("componentEl");

        if (!$compObj || !$compEl) return;

        const $input = $(this);
        const inputType = $input.attr("type");
        const name = $input.attr("name");

        let value =
            inputType === "checkbox"
                ? $input.is(":checked")
                : $input.val();

        // Normalize checkboxes in DOM
        if (inputType === "checkbox") {
            if (value) $input.attr("checked", "checked");
            else $input.removeAttr("checked");
        }

        // Background handler (delegated to module)
        if (name && name.startsWith("bg.")) {

            const handled = await BackgroundController.apply(
                name,
                value,
                params,
                $compEl,
                reactiveParamsHandle
            );

            if (handled) {
                // Save DOM reference
                $form.data("componentEl", $compEl);
                return; // stop normal param flow
            }
        }

        // 2️⃣ Update reactive preview
        if (reactiveParamsHandle && typeof reactiveParamsHandle.then === "function") {
            reactiveParamsHandle = await reactiveParamsHandle;
        }
        if (reactiveParamsHandle) {
            setNested(reactiveParamsHandle, name, value);
        }

        // 3️⃣ Update local params object
        setNested(params, name, value);

        // 4️⃣ Update <mbr-parameters> DOM for standard fields
        updateMbrParamDom($compEl, name, value, inputType);

        // Store updated componentEl
        $form.data("componentEl", $compEl);
    });

    // Helper: safely assign nested property like "bg.image"
    function setNested(obj, path, value) {
        if (!obj || !path) return;
        const parts = path.split(".");
        let cur = obj;
        for (let i = 0; i < parts.length - 1; i++) {
            const key = parts[i];
            if (typeof cur[key] !== "object" || cur[key] === null) cur[key] = {};
            cur = cur[key];
        }
        cur[parts.at(-1)] = value;
    }

    function getNested(obj, path) {
        if (!obj || !path) return null;
        const parts = path.split(".");
        let cur = obj;
        for (const p of parts) {
            if (cur[p] == null) return null;
            cur = cur[p];
        }
        return cur;
    }

    function renderControls(schema, params) {
        const $controls = $("#controls");
        $controls.empty();

        if (!schema || !schema.length) {
            return $controls.append(`<p class="text-muted">No controls defined.</p>`);
        }

        schema.forEach((ctrl, i) => {
            let html = "";

            // ------------------------------------
            // HEADER
            // ------------------------------------
            if (ctrl.kind === "header") {
                html = `
                <h6 class="mt-3 text-secondary" data-condition="${ctrl.attrs?.condition || ""}">
                    ${ctrl.title}
                </h6>`;
            }

            // ------------------------------------
            // CHECKBOX
            // ------------------------------------
            else if (ctrl.kind === "checkbox") {
                const checked = params[ctrl.name] ? "checked" : "";
                html = `
                <div class="form-check mb-2" data-condition="${ctrl.attrs?.condition || ""}">
                    <input class="form-check-input param-input"
                        type="checkbox"
                        name="${ctrl.name}"
                        id="ctrl-${i}"
                        ${checked}
                    >
                    <label class="form-check-label" for="ctrl-${i}">
                        ${ctrl.title}
                    </label>
                </div>`;
            }

            // ------------------------------------
            // RANGE
            // ------------------------------------
            else if (ctrl.kind === "range") {
                html = `
                <div class="mb-3" data-condition="${ctrl.attrs?.condition || ""}">
                    <label class="form-label" for="ctrl-${i}">${ctrl.title}</label>
                    <input class="form-range param-input"
                        type="range"
                        name="${ctrl.name}"
                        id="ctrl-${i}"
                        min="${ctrl.attrs.min}"
                        max="${ctrl.attrs.max}"
                        step="${ctrl.attrs.step}"
                        value="${params[ctrl.name] ?? ctrl.value}"
                    >
                    <small class="text-muted">
                        Min ${ctrl.attrs.min}, Max ${ctrl.attrs.max}, Step ${ctrl.attrs.step}
                    </small>
                </div>`;
            }

            // ------------------------------------
            // COLOR
            // ------------------------------------
            else if (ctrl.kind === "color") {
                html = `
                <div class="mb-3" data-condition="${ctrl.attrs?.condition || ""}">
                    <label class="form-label" for="ctrl-${i}">${ctrl.title}</label>
                    <input class="form-control form-control-color param-input"
                        type="color"
                        name="${ctrl.name}"
                        id="ctrl-${i}"
                        value="${params[ctrl.name] || ctrl.value || "#000000"}"
                        color="${params[ctrl.name] || ctrl.value || "#000000"}"
                    >
                </div>`;
            }

            // ------------------------------------
            // SELECT
            // ------------------------------------
            else if (ctrl.kind === "select") {
                html = `
                <div class="mb-3" data-condition="${ctrl.attrs?.condition || ""}">
                    <label class="form-label" for="ctrl-${i}">${ctrl.title}</label>
                    <select class="form-select param-input" name="${ctrl.name}" id="ctrl-${i}">
                        ${ctrl.options
                        .map(
                            opt => `
                                <option value="${opt.value}" 
                                    ${params[ctrl.name] == opt.value ? "selected" : ""}
                                >
                                    ${opt.label}
                                </option>`
                        )
                        .join("")}
                    </select>
                </div>`;
            }

            // ------------------------------------
            // IMAGE / VIDEO TEXTBOX
            // ------------------------------------
            else if (ctrl.kind === "image" || ctrl.kind === "video") {
                html = `
                <div class="mb-3" data-condition="${ctrl.attrs?.condition || ""}">
                    <label class="form-label" for="ctrl-${i}">${ctrl.title}</label>
                    <input class="form-control param-input"
                        type="text"
                        name="${ctrl.name}"
                        id="ctrl-${i}"
                        placeholder="${ctrl.kind === "image" ? "Image URL" : "Video URL"}"
                        value="${params[ctrl.name] || ctrl.value || ""}"
                    >
                </div>`;
            }

            // ------------------------------------
            // BACKGROUND FIELDSET
            // ------------------------------------
            else if (ctrl.kind === "background") {
                const currentType = params[ctrl.name]?.type || "image";
                const currentValue = params[ctrl.name]?.value || "";

                // radio group
                html = `
                <div class="mb-3" data-condition="${ctrl.attrs?.condition || ""}">
                    <label class="form-label">Background</label>

                    <div class="btn-group mb-2" role="group">
                        ${["image", "color", "video"]
                        .map(
                            t => `
                                <input class="btn-check param-input"
                                    type="radio"
                                    name="${ctrl.name}.type"
                                    id="bg-${t}"
                                    value="${t}"
                                    ${currentType === t ? "checked" : ""}
                                >
                                <label class="btn btn-outline-secondary" for="bg-${t}">${t}</label>`
                        )
                        .join("")}
                    </div>

                    <div class="bg-fields">`;

                // Sub fields
                ctrl.options.forEach((opt, j) => {
                    const optVal =
                        currentType === opt.kind
                            ? currentValue
                            : opt.value;

                    if (opt.kind === "image") {
                        html += `
                        <div class="mb-2 bg-sub bg-image">
                            <label class="form-label" for="bg-image-${j}">${opt.title || "Image"}</label>
                            <input class="form-control param-input"
                                type="text"
                                id="bg-image-${j}"
                                name="${ctrl.name}.image"
                                value="${optVal}"
                            >
                        </div>`;
                    }

                    if (opt.kind === "color") {
                        html += `
                        <div class="mb-2 bg-sub bg-color">
                            <label class="form-label" for="bg-color-${j}">${opt.title || "Color"}</label>
                            <input class="form-control form-control-color param-input"
                                type="color"
                                id="bg-color-${j}"
                                name="${ctrl.name}.color"
                                value="${optVal}"
                            >
                        </div>`;
                    }

                    if (opt.kind === "video") {
                        html += `
                        <div class="mb-2 bg-sub bg-video">
                            <label class="form-label" for="bg-video-${j}">${opt.title || "Video"}</label>
                            <input class="form-control param-input"
                                type="text"
                                id="bg-video-${j}"
                                name="${ctrl.name}.video"
                                value="${optVal}"
                            >
                        </div>`;
                    }
                });

                // parallax checkbox
                html += `
                    <div class="form-check mt-2">
                        <input class="form-check-input param-input"
                            type="checkbox"
                            name="${ctrl.name}.parallax"
                            id="bg-parallax"
                            ${params.bg?.parallax ? "checked" : ""}
                        >
                        <label class="form-check-label" for="bg-parallax">Parallax</label>
                    </div>

                </div> <!-- end bg-fields -->
            </div>`;
            }

            // ---- append to form ----
            $controls.append(html);
        });

        // After rendering, hide the wrong background sub-controls
        updateBackgroundVisibility(params);
    }



});