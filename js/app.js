/*global angular, queryString, angularDragula*/

// TODO: Work on security
// TODO: UX: When user drops task on drop zone, give some kind of feedback that he was successful
// TODO: "Undo" functionality

(function () {
  'use strict';

  var app = angular.module('prio', [angularDragula(angular), 'prio.service.wunderlist']),
    CONSTANTS = {
      ATTR_DATA_TARGET: "data-drop-zone",
      ATTR_DATA_DATE: "data-list-date",
      ATTR_TASK_ID: "data-task-id",
      CLASS_DRAG_SOURCE: "drag-source",
      CLASS_DRAG_CONTAINER: "drag-container",
      CLASS_NO_DROP: "no-drop",
      CLASS_SORTABLE: "sortable",
      CLASS_OVERDUE: "tasks-overdue"
    };

  // Note: No browser support for IE < 10
  function hasClass(element, className) {
    return element.classList.contains(className);
  }

  // Note: No browser support for IE < 10
  function addClass(element, className) {
    if (!hasClass(element, className)) {
      element.classList.add(className);
    }
  }

  // Note: No browser support for IE < 10
  function removeClass(element, className) {
    if (hasClass(element, className)) {
      element.classList.remove(className);
    }
  }

  function findAncestor(element, className) {
    element = element.parentElement;
    if (element !== undefined && !hasClass(element, className)) {
      element = findAncestor(element, className);
    }
    return element;
  }

  document.getElementById('toggle').addEventListener('click', function (e) {
    document.getElementById('tuckedMenu').classList.toggle('custom-menu-tucked');
    document.getElementById('toggle').classList.toggle('x');
  });


  function enableDebugging() {
    var parsedUrl = queryString.parse(location.search);
    if (parsedUrl.debug) {
      console.info("Prio: Debug mode enabled.");
      addClass(document.body, "debug-mode");
      return true;
    }
  }

  app.controller('AppCtrl', ['$scope', 'dragulaService', 'wunderlistService', function ($scope, dragulaService, wunderlistService) {
    var tempElement,
      tempElementsArray;

    if (enableDebugging()) {
      $scope.debug = true;
    }

    $scope.login = wunderlistService.login;

    if (!wunderlistService.isLoggedIn()) {
      return;
    }

    wunderlistService.init();

    $scope.tasks = wunderlistService.tasks;
    $scope.status = wunderlistService.status;
    $scope.date = wunderlistService.date;

    function isDropAllowed(el, target, source, sibling) { // el, target, source, sibling
      if (
        (!hasClass(source, CONSTANTS.CLASS_SORTABLE) && target === source) || // Don't change order when element is above source zone (exception: the zone is sortable)
        hasClass(target, CONSTANTS.CLASS_NO_DROP) // Disallow drop on certain containers
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

        wunderlistService.updateTask(id, data);
      }
    });

    $scope.$on('draggable-tasks.drag', function (el, source) {
      // Add an indicator to each container which can be used to style relevant drop zones
      tempElement = findAncestor(source[0], CONSTANTS.CLASS_DRAG_CONTAINER);
      addClass(tempElement, CONSTANTS.CLASS_DRAG_SOURCE);

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

      removeClass(tempElement, CONSTANTS.CLASS_DRAG_SOURCE);
      while (i <= l) {
        tempElementsArray[i].setAttribute(CONSTANTS.ATTR_DATA_TARGET, "");
        i += 1;
      }
    });

  }]);
}());