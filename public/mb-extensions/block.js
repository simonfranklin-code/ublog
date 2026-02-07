const resetButton = document.getElementById("resetModal");
resetButton.addEventListener("click", () => {
    localStorage.removeItem("modalTitle");
    localStorage.removeItem("modalBody");
    modalTitle.textContent = "Edit Title Here";
    modalBody.innerHTML = "Edit your modal content here. You can add paragraphs, images, or links.";
});
