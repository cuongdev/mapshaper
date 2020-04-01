
import utils from 'utils/mbloch-utils';
import internal from 'mapshaper-internal';

// export for GUI
internal.formatStringsAsGrid = formatStringsAsGrid;
internal.formatLogArgs = formatLogArgs;

// Handle an unexpected condition (internal error)
export function error() {
 internal.error.apply(null, utils.toArray(arguments));
}

// Handle an error caused by invalid input or misuse of API
export function stop () {
  internal.stop.apply(null, utils.toArray(arguments));
}

// Print a status message
export function message() {
  internal.message.apply(null, messageArgs(arguments));
}

// Expose the real error() stop() and message() functions so the GUI can
// override them
internal.error = function() {
  var msg = utils.toArray(arguments).join(' ');
  throw new Error(msg);
};

internal.stop = function() {
  throw new UserError(internal.formatLogArgs(arguments));
};

internal.message = function() {
  logArgs(arguments);
};

// print a message to stdout
export function print() {
  internal.STDOUT = true; // tell logArgs() to print to stdout, not stderr
  message.apply(null, arguments);
  internal.STDOUT = false;
}

export function verbose() {
  if (internal.getStateVar('VERBOSE')) {
    // TODO: see if GUI is affected by this change
    // internal.message.apply(null, messageArgs(arguments));
    message.apply(null, messageArgs(arguments));
  }
}

export function debug() {
  if (internal.getStateVar('DEBUG')) {
    logArgs(arguments);
  }
}

export function printError(err) {
  var msg;
  if (utils.isString(err)) {
    err = new UserError(err);
  }
  if (internal.LOGGING && err.name == 'UserError') {
    msg = err.message;
    if (!/Error/.test(msg)) {
      msg = "Error: " + msg;
    }
    console.error(messageArgs([msg]).join(' '));
    // internal.message("Run mapshaper -h to view help");
    message("Run mapshaper -h to view help");
  } else {
    // not a user error or logging is disabled -- throw it
    throw err;
  }
}

export function UserError(msg) {
  var err = new Error(msg);
  err.name = 'UserError';
  return err;
}

// Format an array of (preferably short) strings in columns for console logging.
export function formatStringsAsGrid(arr) {
  // TODO: variable column width
  var longest = arr.reduce(function(len, str) {
        return Math.max(len, str.length);
      }, 0),
      colWidth = longest + 2,
      perLine = Math.floor(80 / colWidth) || 1;
  return arr.reduce(function(memo, name, i) {
    var col = i % perLine;
    if (i > 0 && col === 0) memo += '\n';
    if (col < perLine - 1) { // right-pad all but rightmost column
      name = utils.rpad(name, colWidth - 2, ' ');
    }
    return memo +  '  ' + name;
  }, '');
}

// expose so GUI can use it
function formatLogArgs(args) {
  return utils.toArray(args).join(' ');
}

function messageArgs(args) {
  var arr = utils.toArray(args);
  var cmd = internal.getStateVar('current_command');
  if (cmd && cmd != 'help') {
    arr.unshift('[' + cmd + ']');
  }
  return arr;
}

function logArgs(args) {
  if (internal.LOGGING && !internal.getStateVar('QUIET') && utils.isArrayLike(args)) {
    (!internal.STDOUT && console.error || console.log).call(console, internal.formatLogArgs(args));
  }
}
