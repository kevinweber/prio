/*global angular*/

/**
 * $localstorage: Use AngularJS Service for local storage
 * http://learn.ionicframework.com/formulas/localstorage/
 */

(function () {
  'use strict';

  angular
    .module('prio.factory.storage', [])
    .factory('$localstorage', ['$window', function ($window) {
      return {
        set: function (key, value) {
          $window.localStorage[key] = value;
        },
        get: function (key, defaultValue) {
          return $window.localStorage[key] || defaultValue;
        },
        setObject: function (key, value) {
          $window.localStorage[key] = JSON.stringify(value);
        },
        getObject: function (key) {
          return JSON.parse($window.localStorage[key] || '{}');
        },
        clear: function () {
          $window.localStorage.clear();
        }
      };
    }]);
}());