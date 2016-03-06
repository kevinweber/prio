/*global angular*/

/**
 * $localstorage: Service for local storage based on
 * http://learn.ionicframework.com/formulas/localstorage/
 */

// TODO: Improve performance by storing data in JS variable
// so that we don't have to call "$localstorage.getObject" within "$localstorage.mergeObject"

(function () {
  'use strict';

  angular
    .module('prio.factory.storage', ['prio.factory.helpers'])
    .factory('$localstorage', ['$window', 'helperFactory', function ($window, helperFactory) {
      var $localstorage = this,
        help = helperFactory;

      $localstorage.set = function (key, value) {
        $window.localStorage[key] = value;
      };

      $localstorage.get = function (key, defaultValue) {
        return $window.localStorage[key] || defaultValue;
      };

      $localstorage.setObject = function (key, value) {
        $window.localStorage[key] = JSON.stringify(value);
      };

      $localstorage.getObject = function (key, defaultObject) {
        return JSON.parse($window.localStorage[key] || '{}');
      };

      // https://docs.angularjs.org/api/ng/function/angular.merge
      $localstorage.mergeObject = function (key, src, dest) {
        dest = dest || $localstorage.getObject(key);

        var merged = angular.merge({}, dest, src);
        $localstorage.setObject(key, merged);
        //        console.log(merged);
      };

      $localstorage.clear = function () {
        $window.localStorage.clear();
      };

      return $localstorage;
    }]);
}());