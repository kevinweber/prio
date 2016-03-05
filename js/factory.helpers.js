/*global angular, queryString, console*/

(function () {
  'use strict';

  var app = angular.module('prio.factory.helpers', []);

  app.factory('helperFactory', function () {
    var helpers = this;

    // Note: No browser support for IE < 10
    helpers.hasClass = function (element, className) {
      return element.classList.contains(className);
    };

    // Note: No browser support for IE < 10
    helpers.addClass = function (element, className) {
      if (!helpers.hasClass(element, className)) {
        element.classList.add(className);
      }
    };

    // Note: No browser support for IE < 10
    helpers.removeClass = function (element, className) {
      if (helpers.hasClass(element, className)) {
        element.classList.remove(className);
      }
    };

    helpers.findAncestor = function (element, className) {
      element = element.parentElement;
      if (element !== undefined && !helpers.hasClass(element, className)) {
        element = helpers.findAncestor(element, className);
      }
      return element;
    };

    helpers.enableDebugging = function () {
      var parsedUrl = queryString.parse(location.search);
      if (parsedUrl.debug) {
        console.info("Prio: Debug mode enabled.");
        helpers.addClass(document.body, "debug-mode");
        return true;
      }
    };

    return helpers;
  });
}());