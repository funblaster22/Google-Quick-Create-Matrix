import signin from './Signin.js';
import {default_settings, default_services, onCellEnterExit} from "./global.js";

/** @return {Promise<HTMLTableElement>}*/
export default function makeTablePrefab(includeAll=false, includeSignin=true) {
  return new Promise(res => {
    chrome.storage.sync.get(['users', 'settings', 'services', 'userOrder'], storage => {
      const users = {...storage.users};
      const settings = {...default_settings, ...storage.settings};

      /** @typedef {named & {link: string}} service */
      /** @type {Object<string, Object<string, service>>} */
      // TODO: currently, new service must be added here & global.js, unify
      const apps_imgs = {
        account: {name: 'account', link: "https://myaccount.google.com/u/??/", icon: settings.newIcons ? "icons/new/goog.svg" : "icons/old/goog-400.jpg"},
        doc: {name: 'doc', link: "https://docs.google.com/document/u/??/create", icon: settings.newIcons ? "icons/new/docs.svg" : "icons/old/docs-32.png"},
        sheet: {name: "sheet", link: "https://docs.google.com/spreadsheets/u/??/create", icon: settings.newIcons ? "icons/new/spreadsheets.svg" : "icons/old/spreadsheets-32.png"},
        prez: {name: "prez", link: "https://docs.google.com/presentation/u/??/create", icon: settings.newIcons ? "icons/new/presentations.svg" : "icons/old/presentations-32.png"},
        draw: {name: "draw", link: "https://docs.google.com/drawings/u/??/create", icon: settings.newIcons ? "icons/new/drawings.svg" : "icons/old/drawings-32.png"},
        form: {name: "form", link: "https://docs.google.com/forms/u/??/create", icon: settings.newIcons ? "icons/new/forms.svg" : "icons/old/forms-32.png"},
        script: {name: "script", link: "https://script.google.com/u/??/create", icon: `icons/${settings.newIcons ? 'new' : 'old'}/apps-script.svg`},
        drive: {name: "drive", link: "https://drive.google.com/drive/u/??/my-drive", icon: settings.newIcons ? "icons/new/drive-48.png" : "icons/old/drive_icon.png"},
        gmail: {name: "gmail", link: "https://mail.google.com/mail/u/??/#inbox", icon: `icons/${settings.newIcons ? 'new' : 'old'}/gmail.svg`},
        class: {name: "class", link: "https://classroom.google.com/u/??/", icon: "icons/old/classroom.svg"},
        cal: {name: "cal", link: "https://calendar.google.com/calendar/u/??/", icon: `icons/${settings.newIcons ? 'new' : 'old'}/calendar.svg`},
        photo: {name: "photo", link: "https://photos.google.com/u/??/", icon: `icons/${settings.newIcons ? 'new' : 'old'}/photos.svg`},
        hangouts: {name: "hangouts", link: "https://hangouts.google.com/??/", icon: "icons/old/hangouts.svg"},
        youtube: {name: "youtube", link: "https://youtube.com", icon: "icons/old/youtube.svg"}  // unfortunately, there is no url to switch youtube accounts
      };

      let services = {};
      for (const service of storage.services ? new Set([...storage.services, ...default_services]) : default_services) {
        if (settings[service] || includeAll) {
          services[service] = apps_imgs[service];
        }
      }

      const usersSorted = {};
      const userOrder = new Set(storage.userOrder);
      userOrder.delete('signin');
      for (const user of userOrder) {
        if (settings[user] || includeAll) {
          usersSorted[user] = users[user];
        }
      }

      console.log(usersSorted, settings, services);
      /** @typedef {named & {email: string, ID: number}} user */
      if (includeSignin)
        usersSorted.signin = {name: "signin", icon: 'icons/signin-32.png'};
      const newTable = generateTable(services, usersSorted, {invert: settings.invert});
      if (settings.useBottom) {
        newTable.style.gridTemplateAreas = '"sideHeader body" ". topHeader"';
      }

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
  const directions = [[-1, -1, "nw"], [1, -1, "ne"], [1, 1, "se"], [-1, 1, "sw"]];
  td.onmouseenter = onCellEnterExit.bind(td, position, true);
  td.onmouseleave = onCellEnterExit.bind(td, position, false);
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
 * @typedef {{name: string, icon: string}} named
 */
/**
 * Makes a table
 * @param topHeader {Object<string, named>} Synonymous with column header. Key is the name, and value is img URL to show
 * @param sideHeader {Object<string, named>} Synonymous with row header. Key is the name, and value is img URL to show
 * @param cellGenerator {createCellCallback}
 * @param invert {boolean}
 * @return {HTMLDivElement}
 */
export function generateTable(topHeader, sideHeader, {cellGenerator=makeCell, invert=false}={}) {
  console.time("Table generated in");
  /**
   * Returns data for the side header, taking into account `invert`
   * @param row {number?}
   * @return {named[]|named} object representing header if `row` provided, otherwise an array of all headers
   */
  function getSideHeader(row) {
    const values = Object.values(invert ? topHeader : sideHeader);
    if (row !== undefined) return values[row];
    return values;
  }

  /**
   * Returns data for the top header, taking into account `invert`
   * @param col {number?}
   * @return {named[]|named} object representing header if `row` provided, otherwise an array of all headers
   */
  function getTopHeader(col) {
    const values = Object.values(invert ? sideHeader : topHeader);
    if (col !== undefined) return values[col];
    return values;
  }

  // Create headers, body, & container
  const containerDiv = document.createElement('div');
  containerDiv.className = "grid-container";
  const topHeaderDiv = document.createElement('div');
  topHeaderDiv.className = "topHeader";
  const sideHeaderDiv = document.createElement('div');
  sideHeaderDiv.className = "sideHeader";
  containerDiv.appendChild(topHeaderDiv);
  containerDiv.appendChild(sideHeaderDiv);

  // Populate table
  const table = document.createElement('table');
  table.className = "table";
  containerDiv.appendChild(table);
  for (let row = -1; row < getSideHeader().length; row++) {
    const tr = document.createElement('tr');
    for (let col=-1; col < getTopHeader().length; col++) {
      const td = document.createElement('td');
      tr.classList.add('row' + row);
      td.classList.add('col' + col);
      td.classList.add('row' + row);
      if (row === -1 ^ col === -1) { // XOR to skip corner (only executes if one is true, but not both)
        // Create container so that the image can be grayscaled, without affecting background when hovering
        const container = document.createElement('span');
        const checkbox = document.createElement('input');
        checkbox.type = "checkbox";
        container.style.display = 'inline-block';
        if (row === -1 && col > -1) {
          checkbox.style.backgroundImage = 'url("' + getTopHeader(col).icon + '")';
          checkbox.name = getTopHeader(col).name;
          checkbox.title = chrome.i18n.getMessage(getTopHeader(col).name) || getTopHeader(col).name;
          container.appendChild(checkbox);
          topHeaderDiv.appendChild(container);
        }
        else if (row > -1 && col === -1) {
          checkbox.style.backgroundImage = 'url("' + getSideHeader(row).icon + '")';
          checkbox.name = getSideHeader(row).name;
          checkbox.title = chrome.i18n.getMessage(getSideHeader(row).name) || getSideHeader(row).name;
          container.appendChild(checkbox);
          sideHeaderDiv.appendChild(container);
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
  console.timeEnd("Table generated in");
  return containerDiv;
}
