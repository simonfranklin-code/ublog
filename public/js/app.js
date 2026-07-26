let selectedRow = null;

function setStatus(message) {
    $("[data-status]").text(message);
}

function currentPath() {
    return $(".content").data("current-path");
}

function setItemButtonsEnabled(enabled) {
    $("[data-action='open'], [data-action='copy'], [data-action='cut'], [data-action='rename'], [data-action='delete']")
        .prop("disabled", !enabled);
}

function selectRow(row) {
    if (selectedRow) selectedRow.removeClass("selected");
    selectedRow = row;

    if (selectedRow) {
        selectedRow.addClass("selected");
        setItemButtonsEnabled(true);
        setStatus(selectedRow.data("name"));
    }
}

function selectedPath() {
    if (!selectedRow) throw new Error("Select an item first.");
    return selectedRow.data("path");
}

function loadExplorer(folderPath, query, shouldPushState = true) {
    setStatus("Loading...");

    return $.ajax({
        url: "/api/explorer-view",
        method: "GET",
        data: {
            path: folderPath,
            q: query || ""
        },
        dataType: "html"
    }).done((html) => {
        $("#explorer-root").html(html);
        selectedRow = null;
        setItemButtonsEnabled(false);

        if (shouldPushState) {
            const url = `/?path=${encodeURIComponent(folderPath)}${query ? `&q=${encodeURIComponent(query)}` : ""}`;
            window.history.pushState({ path: folderPath, q: query || "" }, "", url);
        }
    }).fail((xhr) => {
        const message = xhr.responseJSON && xhr.responseJSON.error ? xhr.responseJSON.error : "The folder could not be loaded.";
        setStatus(message);
    });
}

function postJson(url, body) {
    return $.ajax({
        url,
        method: "POST",
        contentType: "application/json",
        data: JSON.stringify(body),
        dataType: "json"
    });
}

function refreshExplorer() {
    const query = $(".search input[name='q']").val();
    return loadExplorer(currentPath(), query, false);
}

$(document).on("click", "a[href^='/?path=']", (event) => {
    event.preventDefault();
    const url = new URL(event.currentTarget.href);
    loadExplorer(url.searchParams.get("path"), url.searchParams.get("q") || "");
});

$(document).on("submit", ".search", (event) => {
    event.preventDefault();
    const form = $(event.currentTarget);
    loadExplorer(form.find("input[name='path']").val(), form.find("input[name='q']").val());
});

$(document).on("click", "tr[data-path]", (event) => {
    selectRow($(event.currentTarget));
});

$(document).on("dblclick", "tr[data-path]", (event) => {
    const row = $(event.currentTarget);

    if (row.data("directory") === true || row.data("directory") === "true") {
        loadExplorer(row.data("path"), "");
        return;
    }

    postJson("/api/open", { path: row.data("path") })
        .fail((xhr) => setStatus(xhr.responseJSON ? xhr.responseJSON.error : "The file could not be opened."));
});

$(document).on("click", "[data-action]", (event) => {
    const action = $(event.currentTarget).data("action");

    try {
        if (action === "open") {
            if (selectedRow.data("directory") === true || selectedRow.data("directory") === "true") {
                loadExplorer(selectedRow.data("path"), "");
            } else {
                postJson("/api/open", { path: selectedPath() })
                    .fail((xhr) => setStatus(xhr.responseJSON ? xhr.responseJSON.error : "The file could not be opened."));
            }
        }

        if (action === "copy" || action === "cut") {
            postJson(`/api/${action}`, { path: selectedPath() })
                .done(() => setStatus(`${action === "copy" ? "Copied" : "Cut"} item`))
                .fail((xhr) => setStatus(xhr.responseJSON ? xhr.responseJSON.error : "The action failed."));
        }

        if (action === "paste") {
            postJson("/api/paste", { destination: currentPath() })
                .done(() => refreshExplorer())
                .fail((xhr) => setStatus(xhr.responseJSON ? xhr.responseJSON.error : "Paste failed."));
        }

        if (action === "rename") {
            const name = window.prompt("New name", selectedRow.data("name"));
            if (!name) return;

            postJson("/api/rename", { path: selectedPath(), name })
                .done(() => refreshExplorer())
                .fail((xhr) => setStatus(xhr.responseJSON ? xhr.responseJSON.error : "Rename failed."));
        }

        if (action === "delete") {
            if (!window.confirm(`Delete ${selectedRow.data("name")}?`)) return;

            postJson("/api/delete", { path: selectedPath() })
                .done(() => refreshExplorer())
                .fail((xhr) => setStatus(xhr.responseJSON ? xhr.responseJSON.error : "Delete failed."));
        }
    } catch (error) {
        setStatus(error.message);
    }
});

window.addEventListener("popstate", () => {
    const url = new URL(window.location.href);
    loadExplorer(url.searchParams.get("path") || currentPath(), url.searchParams.get("q") || "", false);
});
