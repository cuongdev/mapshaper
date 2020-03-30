
import includePaths from 'rollup-plugin-includepaths';

let includePathOptions = {
    include: {},
    paths: ['src'],
    external: [],
    extensions: ['.js']
};

export default {
  input: './build/mapshaper_partial.js',
  output: [{
    strict: false,
    format: 'iife',
    file: 'mapshaper.js'
  }],
  plugins: [ includePaths(includePathOptions) ],
};
