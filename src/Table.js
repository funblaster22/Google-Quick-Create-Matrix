import signin from './Signin.js';
import {default_settings, default_services, css} from "./global.js";

/** @return {Promise<HTMLTableElement>}*/
export default function makeTablePrefab(includeAll=false, includeSignin=true) {
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
        photo: {[`icons/${settings.newIcons ? 'new' : 'old'}/photos.svg`]: {name: "photo", link: "https://photos.google.com/u/??/"}},
        hangouts: {"icons/old/hangouts.svg": {name: "hangouts", link: "https://hangouts.google.com/??/"}},
        youtube: {"icons/old/youtube.png": {name: "youtube", link: "https://youtube.com"}}  // unfortunately, there is no url to switch youtube accounts
      };

      let services = {};
      for (const service of storage.services || default_services) {
        if (settings[service] || includeAll) {
          services = {...services, ...apps_imgs[service]};
        }
      }
      console.log(users, settings, services);
      /** @typedef {named & {email: string, ID: number}} user */
      const newTable = generateTable(services,{
        ...users,
        ...(includeSignin ? {'icons/signin-32.png': {name: "signin"}} : {})
      }, {invert: settings.invert});
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
 * @return {HTMLDivElement}
 */
export function generateTable(topHeader, sideHeader, {cellGenerator=makeCell, invert=false}={}) {
  console.time("Table generated in");
  /**
   * Returns data for the side header, taking into account `invert`
   * @param row {number?}
   * @return {[string, string][]|[string, string]} [key, val] if `row` provided, otherwise an array of key value pairs
   */
  function getSideHeader(row) {
    const entries = Object.entries(invert ? topHeader : sideHeader);
    if (row !== undefined) return entries[row];
    return entries;
  }

  /**
   * Returns data for the top header, taking into account `invert`
   * @param col {number?}
   * @return {[string, string][]|[string, string]}  [key, val] if `col` provided, otherwise an array of key value pairs
   */
  function getTopHeader(col) {
    const entries = Object.entries(invert ? sideHeader : topHeader);
    if (col !== undefined) return entries[col];
    return entries;
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
          checkbox.style.backgroundImage = 'url("' + getTopHeader(col)[0] + '")';
          checkbox.name = getTopHeader(col)[1].name;
          checkbox.title = chrome.i18n.getMessage(getTopHeader(col)[1].name) || getTopHeader(col)[1].name;
          container.appendChild(checkbox);
          topHeaderDiv.appendChild(container);
        }
        else if (row > -1 && col === -1) {
          checkbox.style.backgroundImage = 'url("' + getSideHeader(row)[0] + '")';
          checkbox.name = getSideHeader(row)[1].name;
          checkbox.title = chrome.i18n.getMessage(getSideHeader(row)[1].name) || getSideHeader(row)[1].name;
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
