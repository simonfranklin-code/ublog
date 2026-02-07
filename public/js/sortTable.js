// public/js/sortTable.js
function sortTable(columnIndex) {
    const table = document.getElementById("friends-table");
    let switching = true;
    let shouldSwitch;
    let direction = "asc";
    let switchCount = 0;

    while (switching) {
        switching = false;
        const rows = table.rows;
        for (let i = 1; i < rows.length - 1; i++) {
            shouldSwitch = false;
            const x = rows[i].getElementsByTagName("TD")[columnIndex];
            const y = rows[i + 1].getElementsByTagName("TD")[columnIndex];

            if (
                (direction === "asc" && x.innerHTML.toLowerCase() > y.innerHTML.toLowerCase()) ||
                (direction === "desc" && x.innerHTML.toLowerCase() < y.innerHTML.toLowerCase())
            ) {
                shouldSwitch = true;
                break;
            }
        }
        if (shouldSwitch) {
            rows[i].parentNode.insertBefore(rows[i + 1], rows[i]);
            switching = true;
            switchCount++;
        } else if (switchCount === 0 && direction === "asc") {
            direction = "desc";
            switching = true;
        }
    }
}
