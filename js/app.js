/*global angular, queryString, angularDragula*/

// TODO: Work on security
// TODO: UX: When user drops task on drop zone, give some kind of feedback that he was successful
// TODO: "Undo" functionality

(function () {
  'use strict';

  var app = angular.module('prio', ['prio.values', 'prio.factory.helpers', 'prio.factory.storage', 'prio.service.wunderlist', angularDragula(angular)]),
    oauthConfig = {
      accessToken: '',
      accessCode: '',
      clientID: '16551d4c73904985c4f0',
      // TODO: Security: Display client secret? Only server-side? Not Github! http://stackoverflow.com/questions/6144826/secure-oauth-in-javascript
      redirectUrl: 'http://localhost/git/prio/callback.php',
      // TODO: Security: Generate this random string randomly actually
      // and check that string server-side
      random: 'kljdfklshfliaudjfhalsdkjfh43j4dj22223sdf'
    };

  document.getElementById('toggle').addEventListener('click', function (e) {
    document.getElementById('tuckedMenu').classList.toggle('custom-menu-tucked');
    document.getElementById('toggle').classList.toggle('x');
  });

  app.controller('AppCtrl', ['$scope', 'dragulaService', 'wunderlistService', 'CONSTANTS', 'helperFactory', '$localstorage', function ($scope, dragulaService, wunderlistService, CONSTANTS, helperFactory, $localstorage) {
    var help = helperFactory,
      tempElement,
      tempElementsArray,
      listService;

    if (help.enableDebugging()) {
      $scope.debug = true;
    }

    listService = wunderlistService.init(oauthConfig);

    $scope.login = listService.login;
    if (!listService.isLoggedIn()) {
      return;
    }

    listService.loadData();

    $scope.tasks = listService.tasks;
    $scope.status = listService.status;
    $scope.date = listService.date;

    /**
     * Dragula specific code
     */

    function isDropAllowed(el, target, source, sibling) { // el, target, source, sibling
      if (
        (!help.hasClass(source, CONSTANTS.CLASS_SORTABLE) && target === source) || // Don't change order when element is above source zone (exception: the zone is sortable)
        help.hasClass(target, CONSTANTS.CLASS_NO_DROP) // Disallow drop on certain containers
      ) {
        return false;
      }
      return true;
    }

    dragulaService.options($scope, 'draggable-tasks', {
      revertOnSpill: true,
      accepts: isDropAllowed
    });

    $scope.$on('draggable-tasks.drop', function (e, el, target, source) {
      var newDueDate = target[0].attributes[CONSTANTS.ATTR_DATA_DATE],
        id = el[0].attributes[CONSTANTS.ATTR_TASK_ID].value,
        data;

      if (newDueDate !== undefined && newDueDate.value !== '' && // Require date in target container
        id !== undefined && id.value !== '') {

        data = {
          due_date: newDueDate.value
        };

        listService.updateTask(id, data);
      }
    });

    $scope.$on('draggable-tasks.drag', function (el, source) {
      // Add an indicator to each container which can be used to style relevant drop zones
      tempElement = help.findAncestor(source[0], CONSTANTS.CLASS_DRAG_CONTAINER);
      help.addClass(tempElement, CONSTANTS.CLASS_DRAG_SOURCE);

      tempElementsArray = tempElement.parentElement.querySelectorAll("[" +
        CONSTANTS.ATTR_DATA_TARGET + "]");
      var i = 0,
        l = tempElementsArray.length - 1,
        indicator = 0;

      while (i <= l) {
        if (!tempElementsArray[i].classList.contains(CONSTANTS.CLASS_DRAG_SOURCE) && tempElementsArray[i].hasAttribute(CONSTANTS.ATTR_DATA_TARGET)) {
          tempElementsArray[i].setAttribute(CONSTANTS.ATTR_DATA_TARGET, indicator);
          indicator += 1;
        }
        i += 1;
      }
    });

    $scope.$on('draggable-tasks.dragend', function (el) {
      // Removed indicators we added earlier
      var i = 0,
        l = tempElementsArray.length - 1;

      help.removeClass(tempElement, CONSTANTS.CLASS_DRAG_SOURCE);
      while (i <= l) {
        tempElementsArray[i].setAttribute(CONSTANTS.ATTR_DATA_TARGET, "");
        i += 1;
      }
    });

  }]);
}());