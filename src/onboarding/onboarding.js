import "../options.js";

function autoConnect() {
  chrome.permissions.request({origins: ["https://accounts.google.com/o/oauth2/*"]});
}
