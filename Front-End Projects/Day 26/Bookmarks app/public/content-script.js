// Content script to handle keyboard shortcuts and injection
console.log("Synapse content script loaded.");

document.addEventListener("keydown", (e) => {
    if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        // Notify the extension or toggle UI
        // For now, we'll just log
        console.log("Synapse: Cmd+K detected");
        // TODO: Inject Shadow DOM overlay
    }
});
