import utils from 'utils/mbloch-utils';
import { printError } from 'utils/mapshaper-logging';
var api = {};

api.printError = printError;

api.enableLogging = function() {
  api.internal.LOGGING = true;
  return api;
};

export default api;
