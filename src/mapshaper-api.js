import utils from 'utils/mbloch-utils';
import internal from 'mapshaper-internal';
import { printError } from 'utils/mapshaper-logging';
var api = {};

api.printError = printError;

api.enableLogging = function() {
  internal.LOGGING = true;
  return api;
};

export default api;
