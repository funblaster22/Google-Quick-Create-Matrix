import generateTable from './Table.js';


generateTable();

window.addEventListener('load', () => {
  // TODO: depreciated, use window.performance.getEntries(). Fine for now, just debugging
  // See https://developer.mozilla.org/en-US/docs/Web/API/Navigation_timing_API & https://developer.mozilla.org/en-US/docs/Web/API/Performance
  const perf = window.performance.timing;
  console.log("Load Time:", perf.domComplete - perf.requestStart, 'ms');
});
