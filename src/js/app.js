/*global angular, queryString, angularDragula*/

// TODO: Work on security
// TODO: Cancel drag'n'drop when ESC is pressed (https://github.com/bevacqua/dragula#drakecancelrevert)
// TODO: Cross-browser functionality -- replace $help functions with Angular's built in jqLite if possible

(function () {
  'use strict';

  var app = angular.module('prio', ['prio.values', 'prio.factory.helpers', 'prio.factory.storage', 'prio.service.wunderlist', angularDragula(angular), 'ngOrderObjectBy']),
    oauthConfig = {
      accessToken: '',
      accessCode: '',
      clientID: '23010814209ec4d01a38',
      // TODO: Security: Display client secret? Only server-side? Not Github! http://stackoverflow.com/questions/6144826/secure-oauth-in-javascript
      redirectUrl: 'http://kevinw.de/prio/callback.php',
      // TODO: Security: Generate this random string randomly actually
      // and check that string server-side
      random: 'kljdfklshfliaudjfhalsdkjfh43j4dj22223sdf'
    };

  document.getElementById('toggle').addEventListener('click', function (e) {
    document.getElementById('tuckedMenu').classList.toggle('custom-menu-tucked');
    document.getElementById('toggle').classList.toggle('x');
  });
  
  document.body.style.opacity = '1';

  //http://stackoverflow.com/questions/20325480/angularjs-whats-the-best-practice-to-add-ngif-to-a-directive-programmatically
  //  app.directive('taskIf', function (ngIfDirective, $rootScope) {
  //    var ngIf = ngIfDirective[0];
  //
  //    return {
  //      transclude: ngIf.transclude,
  //      priority: ngIf.priority,
  //      terminal: ngIf.terminal,
  //      restrict: ngIf.restrict,
  //      link: function ($scope, $element, $attr) {
  //        var value = $attr['taskIf'];
  //        var yourCustomValue = $scope.$eval(value);
  //
  //        $attr.ngIf = function () {
  //          return yourCustomValue;
  //        };
  //        ngIf.link.apply(ngIf, arguments);
  //      }
  //    };
  //  });

  app.controller('AppCtrl', ['$window', '$document', '$rootScope', '$scope', '$interval', 'dragulaService', 'wunderlistService', 'CONSTANTS', '$help', '$localstorage', '$localstorageStack', function ($window, $document, $rootScope, $scope, $interval, dragulaService, wunderlistService, CONSTANTS, $help, $localstorage, $localstorageStack) {
    var tempElement,
      tempElementsArray,
      listService,
      defaultObject,
      scrollInterval,
      scrollDirection,
      scrollSpeed = 20;

    if ($help.enableDebugging()) {
      $scope.debug = true;
    }

    listService = wunderlistService.init(oauthConfig);

    $scope.login = listService.login;
    if (!listService.isLoggedIn()) {
      return;
    }

    $scope.isLoggedIn = true;
    $rootScope.isLoaded = false;
    $rootScope.changesCount = 0;
    $scope.isUndoAllowed = false;
    listService.loadData();

    (function setupScope() {
      $scope.tasks = listService.tasks;
      $scope.status = listService.status;
      $scope.date = listService.date;
      $scope.showOverdue = true;

      (function setupLocalStorage() {
        $rootScope.localData = $localstorage.getObject(CONSTANTS.STORAGE_LOCAL_NAME);

        if ($help.isEmpty($scope.localData)) {
          defaultObject = {
            activeType: 1,
            types: {}
          };
          $localstorage.setObject(CONSTANTS.STORAGE_LOCAL_NAME, defaultObject);
        }

        // We don't want the stack from last visit to be available, so:
        $localstorageStack.clear();
      }());
    }());

    /**
     * Dragula specific code
     */

    function isDropAllowed(el, target, source, sibling) { // el, target, source, sibling
      if (
        (!$help.hasClass(source, CONSTANTS.CLASS_SORTABLE) && target === source) || // Don't change order when element is above source zone (exception: the zone is sortable)
        $help.hasClass(target, CONSTANTS.CLASS_NO_DROP) // Disallow drop on certain containers
      ) {
        return false;
      }
      return true;
    }

    // Manually check if overdue tasks are available
    function hasOverdueTasks() {
      var overdueList = document.getElementById(CONSTANTS.ID_TASKS_OVERDUE);
      return overdueList.firstElementChild;
    }




    function updateSectionRanking(target, typeId) {
      var targetChildren = target.children,
        typeData,
        taskId,
        i,
        l;

      typeData = {};
      typeData.types = {};
      typeData.types[typeId] = {};

      // Set rank for each child element
      for (i = 0, l = targetChildren.length; i < l; i += 1) {
        taskId = targetChildren[i].attributes[CONSTANTS.ATTR_TASK_ID].value;

        typeData.types[typeId][taskId] = {
          rank: i + 1
        };
      }

      // Merge updated data into storage
      $localstorage.mergeObject(CONSTANTS.STORAGE_LOCAL_NAME, typeData);
    }

    function updateTaskSection(target, taskId, typeId) {
      var task = {},
        typeData,
        taskSection;

      typeData = {};
      typeData.types = {};

      taskSection = parseInt(target.attributes[CONSTANTS.ATTR_DATA_SECTION].value, 10);

      task[taskId] = {
        section: taskSection
      };
      typeData.types[typeId] = task;

      $localstorage.mergeObject(CONSTANTS.STORAGE_LOCAL_NAME, typeData);
    }

    /* Local data is stored in the following format:
     * activeType + types > typeId > taskId > taskRank + taskSection
     * For example:
     
        var data = {
          activeType: 1,
          types: {
            1: {
              1670000000: {
                rank: 1,
                section: 1
              },
              1690000000: {
                rank: 3,
                section: 2
              },
              1540000000: {
                rank: 2,
                section: 1
              },
              ...
            },
            2: {
              ...
            }
          }
        };
        
     */

    function storeTaskIdLocally(taskId, target) {
      var typeId;

      typeId = $help.findAncestorByClass(target, CONSTANTS.CLASS_TYPE);
      typeId = typeId && parseInt(typeId.attributes[CONSTANTS.ATTR_DATA_TYPE].value, 10);

      updateSectionRanking(target, typeId);
      updateTaskSection(target, taskId, typeId);
    }

    function removeTaskIdLocally(taskId, source) {
      var typeId;

      if (source !== undefined) {
        typeId = $help.findAncestorByClass(source[0], CONSTANTS.CLASS_TYPE);
        typeId = typeId && parseInt(typeId.attributes[CONSTANTS.ATTR_DATA_TYPE].value, 10);
      }

      $localstorage.removeFromObject(CONSTANTS.STORAGE_LOCAL_NAME, taskId, typeId);
    }

    $scope.switchTypeTo = function switchTypeTo(newTypeNumber) {
      var typeData = {};

      // Use this for production instead (if feature is ready):
      typeData.activeType = newTypeNumber;

      $localstorage.mergeObject(CONSTANTS.STORAGE_LOCAL_NAME, typeData);

      $scope.localData.activeType = newTypeNumber;
    };



    function isDragging() {
      return dragulaService.find($scope, 'draggable-tasks').drake.dragging;
    }

    function scrollWindow(event) {
      if (isDragging()) {
        var bottom = $window.innerHeight - 50,
          top = 50;

        if (event.clientY > bottom && ($window.scrollY + $window.innerHeight < $document[0].body.scrollHeight)) {
          scrollDirection = 'down';
        } else if (event.clientY < top && $window.scrollY > 0) {
          scrollDirection = 'up';
        } else {
          scrollDirection = '';
        }
      }
    }

    (function initDragScrolling() {
      $window.onmousemove = scrollWindow;
      scrollInterval = $interval(function () {
        if (scrollDirection === 'up') {
          $window.scrollBy(0, -4);
        } else if (scrollDirection === 'down') {
          $window.scrollBy(0, 4);
        }
      }, scrollSpeed / 4);
    }());


    // Hopefully not needed ...    
    //    /*
    //     * ATTENTION/fixme: This part is pretty hacky because ng-if doesn't fulfill this app's need fully.
    //     * It relies on the current circumstance that we only want to see the task that comes first in DOM.
    //     
    //     // TODO: Be more specific while querying
    //     */
    //    function updateVisibleTasks(taskId) {
    //      var elementsById = angular.element(document.querySelectorAll("[" + CONSTANTS.ATTR_TASK_ID + "='" + taskId + "']"));
    //      console.log(elementsById, elementsById.length);
    //
    //      // Add "hidden" class to every element except for the first one
    //      $help.removeClass(elementsById[0], "hidden");
    //      for (var i = 1, l = elementsById.length; i < l; i += 1) {
    //        $help.addClass(elementsById[i], "hidden");
    //      }
    //    }

    $document[0].body.onkeydown = function (e) {
      if (e.metaKey && e.keyCode === 90) { // CMD/Metakey + "Z"
        $scope.undo();
      }
    };

    $scope.undo = function () {
      var taskId,
        lastState;

      if (!$scope.isUndoAllowed) {
        return;
      }

      lastState = $localstorageStack.getLastState();

      if (lastState.type === "completed") {
        $scope.completeTask(lastState.taskId, !lastState.state);
        $scope.isUndoAllowed = false;
      }
    };

    /*
     * $scope.completeTask
     *
     * @param taskId {int}
     * @param state {bool} [optional] Pass false to undo completion
     */
    $scope.completeTask = function (taskId, state) {
      var data,
        tasks,
        checkbox,
        l;

      if (state === undefined) {
        state = true;
      }

      tasks = angular.element(document.querySelectorAll("[" + CONSTANTS.ATTR_TASK_ID + "='" + taskId + "']"));

      for (l = tasks.length - 1; l >= 0; l -= 1) {
        if (state) {
          // Add a class that hides the element
          angular.element(tasks[l]).addClass(CONSTANTS.CLASS_TASK_CHECKED);
          $scope.isUndoAllowed = true;
        } else {
          angular.element(tasks[l]).removeClass(CONSTANTS.CLASS_TASK_CHECKED);
        }
      }

      // Send completed status via listService to Wunderlist
      data = {
        completed: state
      };
      listService.updateTask(taskId, data);
      $localstorageStack.addState("completed", state, taskId);
    };

    dragulaService.options($scope, 'draggable-tasks', {
      revertOnSpill: true,
      accepts: isDropAllowed,
      ignoreInputTextSelection: false
    });

    $scope.$on('draggable-tasks.drag', function (el, source) {
      // Add an indicator to each container which can be used to style relevant drop zones
      tempElement = $help.findAncestorByClass(source[0], CONSTANTS.CLASS_DRAG_CONTAINER);
      angular.element(tempElement).addClass(CONSTANTS.CLASS_DRAG_SOURCE);

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

    $scope.$on('draggable-tasks.drop', function (e, element, target, source) {
      var newDueDate,
        taskId,
        data;

      target = target[0];

      // Get new date by attr of current el
      newDueDate = target.attributes[CONSTANTS.ATTR_DATA_DATE] ||
        // ... otherwise try parent (depends on target container layout)
        $help.findAncestorByClass(target, CONSTANTS.CLASS_DRAG_CONTAINER)
        .attributes[CONSTANTS.ATTR_DATA_DATE];

      taskId = element[0].attributes[CONSTANTS.ATTR_TASK_ID].value;

      if (newDueDate !== undefined && newDueDate.value !== '' && // Require date in target container
        taskId !== undefined && taskId.value !== '') {

        // Update task via listService
        data = {
          due_date: newDueDate.value
        };
        listService.updateTask(taskId, data);

        // Hide overdue section if no overdue tasks left
        if (!hasOverdueTasks()) {
          $scope.showOverdue = false;
          $scope.$apply();
        }

        // Store data locally
        if (target.attributes[CONSTANTS.ATTR_DATA_SECTION]) {
          storeTaskIdLocally(taskId, target);
          // Hide source element to avoid duplicates when localStorage is updated
          angular.element(element[0]).addClass("hidden");
        } else {
          removeTaskIdLocally(taskId, source);
        }
      }
    });

    $scope.$on('draggable-tasks.dragend', function (el) {
      // Removed indicators we added earlier
      var i = 0,
        l = tempElementsArray.length - 1;

      angular.element(tempElement).removeClass(CONSTANTS.CLASS_DRAG_SOURCE);
      while (i <= l) {
        tempElementsArray[i].setAttribute(CONSTANTS.ATTR_DATA_TARGET, "");
        i += 1;
      }
    });

  }]);
}());