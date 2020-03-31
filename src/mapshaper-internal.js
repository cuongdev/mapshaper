import utils from 'utils/mbloch-utils';

var internal = {
  LOGGING: false,
  STDOUT: false,
  context: createContext()
};

internal.getStateVar = function(key) {
  return internal.context[key];
};

internal.setStateVar = function(key, val) {
  internal.context[key] = val;
};

export default internal;

// Install a new set of context variables, clear them when an async callback is called.
// @cb callback function to wrap
// returns wrapped callback function
export function createAsyncContext(cb) {
  internal.context = createContext();
  return function() {
    cb.apply(null, utils.toArray(arguments));
    // clear context after cb(), so output/errors can be handled in current context
    internal.context = createContext();
  };
}

// Save the current context, restore it when an async callback is called
// @cb callback function to wrap
// returns wrapped callback function
export function preserveContext(cb) {
  var ctx = internal.context;
  return function() {
    internal.context = ctx;
    cb.apply(null, utils.toArray(arguments));
  };
}

function createContext() {
  return {
    DEBUG: false,
    QUIET: false,
    VERBOSE: false,
    defs: {},
    input_files: []
  };
}
