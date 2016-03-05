/*global angular, queryString, console*/

(function () {
  'use strict';

  angular
    .module('prio.values', [])
    .value('CONSTANTS', {
      ATTR_DATA_TARGET: "data-drop-zone",
      ATTR_DATA_DATE: "data-list-date",
      ATTR_TASK_ID: "data-task-id",
      CLASS_DRAG_SOURCE: "drag-source",
      CLASS_DRAG_CONTAINER: "drag-container",
      CLASS_NO_DROP: "no-drop",
      CLASS_SORTABLE: "sortable",
      CLASS_OVERDUE: "tasks-overdue"
    });
}());