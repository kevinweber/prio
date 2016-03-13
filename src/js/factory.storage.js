/*global angular, queryString*/

/**
 * $localstorage: Service for local storage based on
 * http://learn.ionicframework.com/formulas/localstorage/
 */

// TODO: Improve performance by storing data in JS variable
// so that we don't have to call "$localstorage.getObject" within "$localstorage.mergeObject"

(function () {
  'use strict';

  angular
    .module('prio.factory.storage', ['prio.values'])
    .factory('$localstorageWunderlist', ['$rootScope', '$localstorage', 'CONSTANTS', function ($rootScope, $localstorage, CONSTANTS) {
      var $localstorageWunderlist = this;

      $localstorageWunderlist.deleteLocalTasks = function (wunderlistTasks) {
        var storageName = CONSTANTS.STORAGE_LOCAL_NAME,
          localTasks = $localstorage.getObject(storageName).types,
          typeId,
          taskId;

        for (typeId in localTasks) {
          if (localTasks.hasOwnProperty(typeId)) {
            for (taskId in localTasks[typeId]) {
              if (localTasks[typeId].hasOwnProperty(taskId)) {
                // Test if wunderlistTasks with certain taskId (still) exists
                if (!wunderlistTasks[taskId]) {
                  // If not, delete it from local storage
                  $localstorage.removeFromObject(storageName, typeId, taskId);
                }
              }
            }
          }
        }

        // Update local data to update displayed tasks
        $rootScope.localData = $localstorage.getObject(CONSTANTS.STORAGE_LOCAL_NAME);
      };

      return $localstorageWunderlist;
    }])
    .factory('$localstorage', ['$rootScope', '$window', '$timeout', 'CONSTANTS', function ($rootScope, $window, $timeout, CONSTANTS) {
      var $localstorage = this,
        tempMergeObject,
        tempMergeTimout;

      (function handleUrlParameters() {
        var parsedUrl = queryString.parse(location.search);
        if (parsedUrl.clearStorage) {
          $window.localStorage.clear();
          console.info("Cleared local storage.");
        }
      }());

      //      $localstorage.set = function (storageName, value) {
      //        $window.localStorage[storageName] = value;
      //      };
      //
      //      $localstorage.get = function (storageName, defaultValue) {
      //        return $window.localStorage[storageName] || defaultValue;
      //      };

      $localstorage.setObject = function (storageName, value) {
        $window.localStorage[storageName] = JSON.stringify(value);
      };

      $localstorage.getObject = function (storageName) {
        return JSON.parse($window.localStorage[storageName] || '{}');
      };

      /*
       * Collect object and merge them into local storage: 
       * We combine multiple mergeObject() calls into one and just send one
       * "request" to store the changes.
       *
       * NOTE: This is not working in every case. We have to think of a call of
       * "getObject" and other functions that might change the local storage while
       * our timeout. But as long as the timeout is very short, we shouldn't run
       * into problems.
       */
      $localstorage.mergeObject = function (storageName, src, dest) {
        dest = dest || tempMergeObject || $localstorage.getObject(storageName);

        tempMergeObject = angular.merge({}, dest, src);

        // Cancel running timeout before we start a new one
        if (tempMergeTimout) {
          $timeout.cancel(tempMergeTimout);
        }

        tempMergeTimout = $timeout(function () {
          $localstorage.setObject(storageName, tempMergeObject);
          
          // Update local data to update displayed tasks
          $rootScope.localData = $localstorage.getObject(CONSTANTS.STORAGE_LOCAL_NAME);

          tempMergeObject = undefined;
        }, 20);
      };

      // Easiest way to do the merge (just for reference):
      //      $localstorage.mergeObject = function (storageName, src, dest) {
      //        dest = dest || $localstorage.getObject(storageName);
      //
      //        var merged = angular.merge({}, dest, src);
      //        $localstorage.setObject(storageName, merged);
      //      };

      $localstorage.removeFromObject = function (storageName, taskId, typeId) {
        function replacer(property, value) {
          if (parseInt(property, 10) === parseInt(typeId, 10) && value[taskId]) {
            delete value[taskId];
            return value;
          } else {
            return value;
          }
        }

        $window.localStorage[storageName] = JSON.stringify($localstorage.getObject(storageName), replacer);
      };

      $localstorage.clear = function () {
        $window.localStorage.clear();
      };

      return $localstorage;
    }]);
}());