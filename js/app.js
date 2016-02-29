/*global angular, queryString, angularDragula*/

// TODO: Work on security
// TODO: UX: When user drops task on drop zone, give some kind of feedback that he was successful
// TODO: "Undo" functionality

(function () {
  'use strict';

  var app = angular.module('prioli', [angularDragula(angular), 'prioli.service.wunderlist']),
    constants = {
      attr_data_target: "data-drop-zone",
      class_drag_source: "drag-source",
      class_no_drop: "no-drop",
      class_sortable: "sortable"
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
      console.info("Prioli: Debug mode enabled.");
      addClass(document.body, "debug-mode");
      return true;
    }
  }

  app.controller('AppCtrl', ['$scope', 'dragulaService', 'wunderlistService', function ($scope, dragulaService, wunderlistService) {
    var tempElement,
      tempElementsArray;

    if (enableDebugging()) {
      $scope.debug = true;
    };

    $scope.login = wunderlistService.login;

    if (!wunderlistService.isLoggedIn()) {
      return;
    }

    wunderlistService.init();

    $scope.tasks = wunderlistService.tasks;
    $scope.status = wunderlistService.status;
    $scope.date = wunderlistService.date;

    function isDropAllowed(el, target, source, sibling) { // el, target, source, sibling
      console.log(sibling);
      if (
        (!hasClass(source, constants.class_sortable) && target === source) || // Don't change order when element is above source zone (exception: the zone is sortable)
        hasClass(target, constants.class_no_drop) // Disallow drop on certain containers
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
      var newDueDate = target[0].attributes['data-list-date'],
        id = el[0].attributes['data-task-id'].value,
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
      tempElement = findAncestor(source[0], "drag-container");
      addClass(tempElement, constants.class_drag_source);

      tempElementsArray = tempElement.parentElement.querySelectorAll("[" +
        constants.attr_data_target + "]");
      var i = 0,
        l = tempElementsArray.length - 1,
        indicator = 0;

      while (i <= l) {
        if (!tempElementsArray[i].classList.contains(constants.class_drag_source) && tempElementsArray[i].hasAttribute(constants.attr_data_target)) {
          tempElementsArray[i].setAttribute(constants.attr_data_target, indicator);
          indicator += 1;
        }
        i += 1;
      }
    });

    $scope.$on('draggable-tasks.dragend', function (el) {
      // Removed indicators we added earlier
      var i = 0,
        l = tempElementsArray.length - 1;

      removeClass(tempElement, constants.class_drag_source);
      while (i <= l) {
        tempElementsArray[i].setAttribute(constants.attr_data_target, "");
        i += 1;
      }
    });

  }]);
}());