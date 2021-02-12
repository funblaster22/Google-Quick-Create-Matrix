import {default_services, default_settings} from "./defaults.js";

const apps_imgs = {
  "icons/docs-32.png": {id: 'doc', link: "https://docs.google.com/document/u/??/create"},
  "icons/spreadsheets-32.png": {id: "sheet", link: "https://docs.google.com/spreadsheets/u/??/create"},
  "icons/presentations-32.png": {id: "prez", link: "https://docs.google.com/presentation/u/??/create"},
  "icons/drawings-32.png": {id: "draw", link: "https://docs.google.com/drawings/u/??/create"},
  "icons/forms-32.png#0": {id: "form", link: "https://docs.google.com/forms/u/??/create"},
  "icons/forms-32.png#1": {id: "script", link: ""},
  "icons/drive_icon.png": {id: "drive", link: ""},
  "icons/forms-32.png#2": {id: "gmail", link: ""},
  "icons/forms-32.png#3": {id: "class", link: ""},
  "icons/forms-32.png#4": {id: "cal", link: ""},
  "icons/forms-32.png#5": {id: "photo", link: ""}
};

export default function makeTablePrefab() {
  return new Promise(res => {
    chrome.storage.sync.get(['users', 'settings', 'services'], storage => {
      const users = storage.users;
      const settings = {...default_settings, ...storage.settings};
      let services = {};
      for (const service of storage.services || default_services) {
        if (settings[service]) {
          services = {...services, ...apps_imgs[service]};
        }
      }
      console.log(users, settings, services);
      /** @typedef {{name: string, email: string, ID: number}} user */
      const newTable = flexTable(apps_imgs, {...users, 'icons/signin-32.png': {name: "signin"}}, {invert: settings.invert});
      const existingTable = document.querySelector('.table');
      if (existingTable)
        existingTable.replaceWith(newTable);
      else
        document.body.appendChild(newTable);
      res(newTable);
    });
  });
}


function makeCell(td) {
  td.innerText = "hello";
}


export function flexTable(topHeader, sideHeader, {cellGenerator=makeCell, invert=false}={}) {
  const table = document.createElement('div');
  table.classList.add('table');
  for (let row = -1; row < Object.keys(sideHeader).length; row++) {
    const tr = document.createElement('div');
    tr.style.display = 'flex';
    for (let col=-1; col < Object.keys(topHeader).length; col++) {
      const td = document.createElement('div');
      tr.classList.add('row' + row);
      td.classList.add('col' + col);
      if (row === -1 ^ col === -1) { // XOR to skip corner (only executes if one is true, but not both)
        //const img = document.createElement('img');
        const checkbox = document.createElement('input');
        checkbox.type = "checkbox";
        if (row === -1 && col > -1) {
          checkbox.style.backgroundImage = 'url("' + Object.keys(topHeader)[col] + '")';
          checkbox.name = Object.values(topHeader)[col].id;
          checkbox.title = chrome.i18n.getMessage(Object.values(topHeader)[col].id);
        }
        else if (row > -1 && col === -1) {
          checkbox.style.backgroundImage = 'url("' + Object.keys(sideHeader)[row] + '")';
          checkbox.name = Object.values(sideHeader)[row].id;
          checkbox.title = Object.values(sideHeader)[row].name;
        }
        td.appendChild(checkbox);
      }
      else if (row > -1 && col > -1) {
        td.classList.add("cell");
        cellGenerator(td, Object.values(sideHeader)[invert ? col : row], Object.values(topHeader)[invert ? row : col], [row, col]);
      }

      tr.appendChild(td);
    }
    table.appendChild(tr);
  }
  return table;
}
