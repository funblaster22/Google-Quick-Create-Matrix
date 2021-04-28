const minify = require('@node-minify/core');
const terser = require('@node-minify/terser');
const cleanCSS = require('@node-minify/clean-css');
const htmlMini = require('@node-minify/html-minifier');
const glob = require("glob");
const fs = require('fs-extra');
const archiver = require('archiver');
const path = require('path');


function negativeArrayIndex(array, negativeIndex=1) {
  return array[array.length-Math.abs(negativeIndex)];
}

// Adapted from https://www.npmjs.com/package/archiver
function packageZip() {
  console.log('Zipping...');
  // create a file to stream archive data to.
  const output = fs.createWriteStream(__dirname + '/extension.zip');
  const archive = archiver('zip', {
    zlib: { level: 9 } // Sets the compression level.
  });
  // pipe archive data to the file
  archive.pipe(output);
  // append files from a sub-directory, putting its contents at the root of archive
  archive.directory(__dirname + '/build/', false);

  output.on('finish', function() {
    console.log('Done!');
  });
  archive.finalize();
}

function minifyJSON(file) {
  return new Promise((res, rej) => {
    fs.readFile(file, (err, data) =>
      void fs.writeFile(file.replace('src', 'build'), JSON.stringify(JSON.parse(data)), () => { res() })
    );
  });
}

// Make folders
fs.removeSync(__dirname + "/build");
fs.copySync(__dirname + "/src", __dirname + "/build", {
  filter: (src, dest) => !['.ai', '.xcf'].includes(path.extname(src))
});
fs.copyFile(__dirname + '/LICENSE', __dirname + '/build/LICENSE');

glob("src/**/*.{html,js,css,json,svg}", function (er, files) {
  const promises = [];
  for (const file of files) {
    console.log(file);
    const dst = file.replace('src', 'build');
    switch (negativeArrayIndex(file.split('.'))) {
      case 'js':
        promises.push(minify({
          compressor: terser,
          input: file,
          output: dst,
          options: {
            compress: {drop_console: true}
          }
        })); break;
      case 'css':
        promises.push(minify({
          compressor: cleanCSS,
          input: file,
          output: dst
        })); break;
      case 'json':
        promises.push(minifyJSON(file)); break;
      case 'html':
        promises.push(minify({
          compressor: htmlMini,
          input: file,
          output: dst
        })); break;
      case 'svg':
        promises.push(minify({
          compressor: htmlMini,
          input: file,
          output: dst,
          options: {
            removeAttributeQuotes: false
          }
        })); break;
    }
  }

  Promise.all(promises).then(packageZip).catch(err => console.error(err));
});
