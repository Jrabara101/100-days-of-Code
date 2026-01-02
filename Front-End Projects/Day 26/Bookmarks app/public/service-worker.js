// This service worker currently does nothing but satisfy the manifest.
// In the future, it will handle background scraping tasks.
chrome.runtime.onInstalled.addListener(() => {
    console.log("Synapse installed.");
});

chrome.action.onClicked.addListener((tab) => {
    // If the user clicks the action (and no popup is set), we could open the dashboard.
    // But we have a popup set.
});
