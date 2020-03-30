var version = require('./package.json').version;
var follow = process.argv.indexOf('-f') > -1;
var requiredModules = [
    'mproj',
    'buffer',
    'iconv-lite',
    'fs',
    'flatbush',
    'rw',
    'path'
  ];

require("catty")({follow: follow, global: true})
  .addLibrary("src")
  .cat("src/gui/gui.js", './www/mapshaper-gui.js')
  .prepend("VERSION = '" + version + "';")
  .cat("src/mapshaper.js", onCat);

require('browserify')()
  .require(requiredModules)
  .bundle(function(err, buf) {
    if (err) throw err;
    write('./www/modules.js', buf);
  });


function onCat(err, js) {
  if (!err) {
    write('./build/mapshaper_partial.js', js);

    /*
    // switch to this if any modules are bundled w/ mapshaper.js
    require('browserify')('./mapshaper.js')
      .external(requiredModules)
      .bundle(function(err, buf) {
        if (err) throw err;
        write('./www/mapshaper.js', buf);
      });
    */
  }
}

function write(ofile, contents) {
  require('fs').writeFileSync(ofile, contents, 'utf-8');
  console.log('Wrote', ofile);
}
