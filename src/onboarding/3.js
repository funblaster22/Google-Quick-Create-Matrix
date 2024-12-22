import generateTable from "../Table.js";
import {localizeHtmlPage} from "../global.js";

localizeHtmlPage();

generateTable(false, false).then(table => {
  document.querySelector("main").appendChild(table);
});
