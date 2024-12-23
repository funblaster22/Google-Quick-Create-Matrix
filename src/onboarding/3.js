import generateTable from "../Table.js";
import {localizeHtmlPage} from "../global.js";
import {makeTablePreview} from "../options.js";

makeTablePreview();
localizeHtmlPage();

generateTable(false, false).then(table => {
  document.querySelector("main").appendChild(table);
});
