// Firefox extension pages do not have access to service worker or ability to register one :/
// This polyfill at least stops errors
if (!('serviceWorker' in navigator))
  navigator.serviceWorker = {};

// Code to migrate stored data when updating
chrome.storage.sync.get('version', storage => {
  function parseSemver(ver) {
    return parseInt(ver.split('.')[0]);
  }

  const appVersion = parseSemver(chrome.runtime.getManifest().version);
  let dataVersion = storage.version || appVersion;
  const needsUpdate = dataVersion < appVersion;
  if (appVersion < dataVersion) {
    alert("Please update the extension, the data is stored in a format that is not compatible with the current version");
    throw new Error("OOF");
  }

  // don't break to allow for multiple updates
  switch (dataVersion) {
    case 1:
      chrome.storage.sync.remove(['users', 'userOrder'], () => {
        resetSW();
        alert("Update complete! You need to sign in to your accounts again");
      });
    case 2:
      alert("Update complete! Google contacts and new onboarding experience added");
  }
  console.log("Update check finished");
  if (needsUpdate)
    chrome.storage.sync.set({version: appVersion}, location.reload);
})

chrome.runtime.setUninstallURL("https://docs.google.com/forms/d/e/1FAIpQLSfSW9ba4_vDMCL_P2V5XkPDKp5xo648zQHqIAB91eMz1PALew/viewform?usp=sf_link");

export function resetSW() {
  navigator.serviceWorker.controller?.postMessage({
    type: 'DELETE',
    url: chrome.runtime.getURL('popup.html')
  });  // Remove precached table
}

/** @typedef {named & {link: string}} service */
/** @function
 * @arg {boolean} newIcons
 * @return {Record<string, service>} */
export const app_icons = newIcons => ({
    account: {name: 'account', link: "https://myaccount.google.com/u/??/", icon: newIcons ? "/icons/new/goog.svg" : "/icons/old/goog-400.jpg"},
    doc: {name: 'doc', link: "https://docs.google.com/document/u/??/create", icon: newIcons ? "/icons/new/docs.svg" : "/icons/old/docs-32.png"},
    sheet: {name: "sheet", link: "https://docs.google.com/spreadsheets/u/??/create", icon: newIcons ? "/icons/new/spreadsheets.svg" : "/icons/old/spreadsheets-32.png"},
    prez: {name: "prez", link: "https://docs.google.com/presentation/u/??/create", icon: newIcons ? "/icons/new/presentations.svg" : "/icons/old/presentations-32.png"},
    draw: {name: "draw", link: "https://docs.google.com/drawings/u/??/create", icon: newIcons ? "/icons/new/drawings.svg" : "/icons/old/drawings-32.png"},
    form: {name: "form", link: "https://docs.google.com/forms/u/??/create", icon: newIcons ? "/icons/new/forms.svg" : "/icons/old/forms-32.png"},
    script: {name: "script", link: "https://script.google.com/u/??/create", icon: `/icons/${newIcons ? 'new' : 'old'}/apps-script.svg`},
    drive: {name: "drive", link: "https://drive.google.com/drive/u/??/my-drive", icon: newIcons ? "/icons/new/drive-48.png" : "/icons/old/drive_icon.png"},
    gmail: {name: "gmail", link: "https://mail.google.com/mail/u/??/#inbox", icon: `/icons/${newIcons ? 'new' : 'old'}/gmail.svg`},
    class: {name: "class", link: "https://classroom.google.com/u/??/", icon: "/icons/old/classroom.svg"},
    cal: {name: "cal", link: "https://calendar.google.com/calendar/u/??/", icon: `/icons/${newIcons ? 'new' : 'old'}/calendar.svg`},
    photo: {name: "photo", link: "https://photos.google.com/u/??/", icon: `/icons/${newIcons ? 'new' : 'old'}/photos.svg`},
    hangouts: {name: "hangouts", link: "https://hangouts.google.com/??/", icon: "/icons/old/hangouts.svg"},
    youtube: {name: "youtube", link: "https://youtube.com", icon: "/icons/old/youtube.svg"},  // unfortunately, there is no url to switch youtube accounts
    colab: {name: "colab", link: "https://colab.research.google.com/?authuser=??", icon: "/icons/new/colab.png"},
    contacts: {name: "contacts", link: "https://contacts.google.com/u/??/", icon: `/icons/${newIcons ? 'new' : 'old'}/contacts.png`},
  });

export const default_settings = {
  doc: true, sheet: true, prez: true, draw: true, form: true,
  invert: true, newIcons: true, useBottom: true, dark: false,
};

export const default_services = Object.keys(app_icons(false));

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

/**
 * Changes background of current & surrounding cells
 * @param position {Number[]} row, column
 * @param entering {boolean} is mouse pointer entering or leaving cell?
 */
export function onCellEnterExit(position, entering) {
    css(`.col${position[1]}, .row${position[0]}`, 'backgroundColor', entering ? 'lightblue' : '');
    for (const [col, row, direction] of [[-1, -1, "nw"], [1, -1, "ne"], [1, 1, "se"], [-1, 1, "sw"]])
      document.querySelector(`.col${position[1] + col}.row${position[0] + row}`)?.classList?.[entering ? "add" : "remove"]("selected-corner", direction);
}
