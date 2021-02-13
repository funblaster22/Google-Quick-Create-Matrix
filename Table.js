import signin from './Signin.js';
import {default_settings, default_services} from "./global.js";


export default function makeTablePrefab(includeAll=false) {
  return new Promise(res => {
    chrome.storage.sync.get(['users', 'settings', 'services'], storage => {
      const users = storage.users;
      const settings = {...default_settings, ...storage.settings};

      /** @typedef {named & {name: string, link: string}} service */
      /** @type {Object<string, Object<string, service>>} */
      const apps_imgs = {
        doc: {[settings.newIcons ? "icons/new/docs.svg" : "icons/old/docs-32.png"]: {name: 'doc', link: "https://docs.google.com/document/u/??/create"}},
        sheet: {[settings.newIcons ? "icons/new/spreadsheets.svg" : "icons/old/spreadsheets-32.png"]: {name: "sheet", link: "https://docs.google.com/spreadsheets/u/??/create"}},
        prez: {[settings.newIcons ? "icons/new/presentations.svg" : "icons/old/presentations-32.png"]: {name: "prez", link: "https://docs.google.com/presentation/u/??/create"}},
        draw: {[settings.newIcons ? "icons/new/drawings.svg" : "icons/old/drawings-32.png"]: {name: "draw", link: "https://docs.google.com/drawings/u/??/create"}},
        form: {[settings.newIcons ? "icons/new/forms.svg" : "icons/old/forms-32.png"]: {name: "form", link: "https://docs.google.com/forms/u/??/create"}},
        script: {[`icons/${settings.newIcons ? 'new' : 'old'}/apps-script.svg`]: {name: "script", link: "https://script.google.com/u/??/create"}},
        drive: {[settings.newIcons ? "icons/new/drive-48.png" : "icons/old/drive_icon.png"]: {name: "drive", link: "https://drive.google.com/drive/u/??/my-drive"}},
        gmail: {[`icons/${settings.newIcons ? 'new' : 'old'}/gmail.svg`]: {name: "gmail", link: "https://mail.google.com/mail/u/??/#inbox"}},
        class: {"icons/old/classroom.svg": {name: "class", link: "https://classroom.google.com/u/??/"}},
        cal: {[`icons/${settings.newIcons ? 'new' : 'old'}/calendar.svg`]: {name: "cal", link: "https://calendar.google.com/calendar/u/??/"}},
        photo: {[`icons/${settings.newIcons ? 'new' : 'old'}/photos.svg`]: {name: "photo", link: "https://photos.google.com/u/??/"}}
      };

      let services = {};
      for (const service of storage.services || default_services) {
        if (settings[service] || includeAll) {
          services = {...services, ...apps_imgs[service]};
        }
      }
      console.log(users, settings, services);
      /** @typedef {named & {email: string, ID: number}} user */
      const newTable = generateTable(services,{...users, 'icons/signin-32.png': {name: "signin"}}, {invert: settings.invert});
      const existingTable = document.querySelector('table');
      if (existingTable)
        existingTable.replaceWith(newTable);
      else
        document.body.appendChild(newTable);
      res(newTable);
    });
  });
}


/**
 *
 * @param td {HTMLTableCellElement}
 * @param rowData {user}
 * @param colData {service}
 * @param position {Number[]} row, column
 */
export function makeCell(td, rowData, colData, position) {
  function css(selector, prop, val) {
    for (const item of document.querySelectorAll(selector)) {
      item.style[prop] = val;
    }
  }

  console.log(rowData, colData);
  const link = document.createElement('a');
  if (rowData.name === "signin") {
    link.setAttribute('onclick', "")
    link.onclick = signin;
  } else {
    link.classList.add("launch");
    link.target = "_blank";
    link.href = colData.link.replace('??', rowData.ID.toString());
  }
  td.onmouseenter = () => css(`.col${position[1]}, .row${position[0]}`, 'backgroundColor', 'lightblue');
  td.onmouseleave = () => css(`.col${position[1]}, .row${position[0]}`, 'backgroundColor', '');
  td.appendChild(link);
}


/**
 * Callback for creating a cell based on the row & column it's in
 * @callback createCellCallback
 * @param {HTMLTableCellElement}
 * @param {Object} rowData
 * @param {Object} colData
 * @param {Number[]} position: row, col
 */
/**
 * Object with a name
 * @typedef {{name: string}} named
 */
/**
 * Makes a table
 * @param topHeader {Object<string, named>} Synonymous with column header. Key is the name, and value is img URL to show
 * @param sideHeader {Object<string, named>} Synonymous with row header. Key is the name, and value is img URL to show
 * @param cellGenerator {createCellCallback}
 * @param invert {boolean}
 * @return {HTMLTableElement}
 */
export function generateTable(topHeader, sideHeader, {cellGenerator=makeCell, invert=false}={}) {
  /**
   * TODO
   * @param row {number?}
   * @return {[string, string][]|[string, string]}
   */
  function getSideHeader(row) {
    const entries = Object.entries(invert ? topHeader : sideHeader);
    if (row !== undefined) return entries[row];
    return entries;
  }

  /**
   * TODO
   * @param col {number?}
   * @return {[string, string][]|[string, string]}
   */
  function getTopHeader(col) {
    const entries = Object.entries(invert ? sideHeader : topHeader);
    if (col !== undefined) return entries[col];
    return entries;
  }

  // Clear headers
  document.getElementById('topHeader').innerHTML = "";
  document.getElementById('sideHeader').innerHTML = "";

  // Populate table
  const table = document.createElement('table');
  for (let row = -1; row < getSideHeader().length; row++) {
    const tr = document.createElement('tr');
    for (let col=-1; col < getTopHeader().length; col++) {
      const td = document.createElement('td');
      tr.classList.add('row' + row);
      td.classList.add('col' + col);
      if (row === -1 ^ col === -1) { // XOR to skip corner (only executes if one is true, but not both)
        // Create container so that the image can be grayscaled, without affecting background when hovering
        const container = document.createElement('span');
        const checkbox = document.createElement('input');
        checkbox.type = "checkbox";
        container.style.display = 'inline-block';
        if (row === -1 && col > -1) {
          checkbox.style.backgroundImage = 'url("' + getTopHeader(col)[0] + '")';
          checkbox.name = getTopHeader(col)[1].name;
          checkbox.title = chrome.i18n.getMessage(getTopHeader(col)[1].name) || getTopHeader(col)[1].name;
          container.appendChild(checkbox);
          document.getElementById('topHeader').appendChild(container);
        }
        else if (row > -1 && col === -1) {
          checkbox.style.backgroundImage = 'url("' + getSideHeader(row)[0] + '")';
          checkbox.name = getSideHeader(row)[1].name;
          checkbox.title = chrome.i18n.getMessage(getSideHeader(row)[1].name) || getSideHeader(row)[1].name;
          container.appendChild(checkbox);
          document.getElementById('sideHeader').appendChild(container);
        }
        container.classList.add(...td.classList, tr.classList);
        continue;
      }
      else if (row > -1 && col > -1) {
        td.classList.add("cell");
        cellGenerator(td, Object.values(sideHeader)[invert ? col : row], Object.values(topHeader)[invert ? row : col], [row, col]);
      } else continue;

      tr.appendChild(td);
    }
    table.appendChild(tr);
  }
  return table;
}
