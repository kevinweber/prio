/*global angular, queryString, console*/

(function () {
  'use strict';

  var app = angular.module('prio.factory.helpers', []);

  app.factory('$help', function () {
    var helpers = this;

    // Note: No browser support for IE < 10
    helpers.hasClass = function (element, className) {
      if (element) {
        return element.classList.contains(className);
      }
    };

    // Note: No browser support for IE < 10
    // NOTE: Use angular's built in jqLite instead!
    // E.g. angular.element(tempElement).addClass(CONSTANTS.CLASS_DRAG_SOURCE);
    helpers.addClass = function (element, className) {
      if (element && !helpers.hasClass(element, className)) {
        element.classList.add(className);
      }
    };

    // Note: No browser support for IE < 10
    // NOTE: Use angular's built in jqLite instead!
    // E.g. angular.element(tempElement).addClass(CONSTANTS.CLASS_DRAG_SOURCE);
    helpers.removeClass = function (element, className) {
      if (element && helpers.hasClass(element, className)) {
        element.classList.remove(className);
      }
    };

    helpers.findAncestorByClass = function (element, className) {
      element = element.parentElement;
      if (element && !helpers.hasClass(element, className)) {
        element = helpers.findAncestorByClass(element, className);
      }
      return element;
    };

    helpers.isEmpty = function (obj) {
      var prop;

      for (prop in obj) {
        if (obj.hasOwnProperty(prop)) {
          return false;
        }
      }
      return true;
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