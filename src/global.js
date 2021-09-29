// TODO: might be inefficient, but probably imperceptible
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('sw.js')
      .then(registration => {
        console.log('ServiceWorker registered')
      }, err => {
        console.error('ServiceWorker registration failed:', err)
      });
  });
}

// Code to migrate stored data when updating
chrome.storage.sync.get('version', storage => {
  function parseSemver(ver) {
    return parseInt(ver.split('.')[0]);
  }

  let dataVersion = storage.version || 0;
  const appVersion = parseSemver(chrome.runtime.getManifest().version);
  const needsUpdate = dataVersion < appVersion;
  if (appVersion < dataVersion) {
    alert("Please update the extension, the data is stored in a format that is not compatible with the current version");
    throw new Error("OOF");
  }

  while (dataVersion < appVersion) {
    switch (dataVersion) {
      case 1:
        chrome.storage.sync.remove(['users', 'userOrder'], () => {
          resetSW();
          alert("Update complete! You need to sign in to your accounts again");
        });
        break;
      default:
        console.log("Nothing to do for version", dataVersion);
    }
    dataVersion++;
  }
  console.log("Update check finished");
  if (needsUpdate)
    chrome.storage.sync.set({version: dataVersion}, location.reload);
})

chrome.runtime.setUninstallURL("https://docs.google.com/forms/d/e/1FAIpQLSfSW9ba4_vDMCL_P2V5XkPDKp5xo648zQHqIAB91eMz1PALew/viewform?usp=sf_link");

export function resetSW() {
  navigator.serviceWorker.controller?.postMessage({
    type: 'DELETE',
    url: chrome.runtime.getURL('popup.html')
  });  // Remove precached table
}

export const default_settings = {
  doc: true, sheet: true, prez: true, draw: true, form: true
};

export const default_services = [
  'account', 'doc', 'sheet', 'prez', 'draw', 'form', 'script', 'drive', 'gmail', 'cal', 'class', 'photo', 'hangouts', 'youtube'
];

export const HEAD = '<head>' +
  '<meta http-equiv="Content-Type" content="text/html; charset=utf-8" />' +
  '<meta name="viewport" content="width=device-width,initial-scale=1">' +
  `<title>${chrome.i18n.getMessage('title')}</title>` +
  '<link href="global.css" rel="stylesheet" type="text/css" />' +
  '<script src="popup.js" type="module"></script>' +
  '</head>';

// Adapted from https://stackoverflow.com/a/25612056
export function localizeHtmlPage() {
  //Localize by replacing __MSG_***__ meta tags
  var objects = document.getElementsByTagName('html');
  for (var j = 0; j < objects.length; j++)
  {
    var obj = objects[j];

    var valStrH = obj.innerHTML.toString();
    var valNewH = valStrH.replace(/__MSG_(\w+)__/g, function(match, v1)
    {
      return v1 ? chrome.i18n.getMessage(v1) : "";
    });

    if(valNewH != valStrH)
    {
      obj.innerHTML = valNewH;
    }
  }
}

/**
 * Updates all 'selector' css 'prop' to 'val', similar to jQuery .css()
 * @param {string} selector
 * @param {string} prop
 * @param {string} val
 */
export function css(selector, prop, val) {
  for (const item of document.querySelectorAll(selector)) {
    item.style[prop] = val;
  }
}
