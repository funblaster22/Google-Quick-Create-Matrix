const getAccountScript = "get-account-script";

chrome.permissions.onAdded.addListener(permission => {
  console.log("permission added", permission);
  chrome.scripting
    .registerContentScripts([{
      id: getAccountScript,
      js: ["get-accounts.js"],
      persistAcrossSessions: false,
      matches: ["https://accounts.google.com/o/oauth2/*"],
    }])
});

chrome.permissions.onRemoved.addListener(permission => {
  console.log("permission removed", permission);
  chrome.scripting.unregisterContentScripts({ ids: [getAccountScript] })
});

chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === "install") {
    chrome.tabs.create({ url: "/onboarding/1.html" }); // Replace with your desired page
  }
});
