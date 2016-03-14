/*global angular, queryString, console*/

(function () {
  'use strict';

  angular
    .module('prio.values', [])
    .value('CONSTANTS', {
      // Storage related
      STORAGE_LOCAL_NAME: "prio",
      STORAGE_LOCAL_CHANGES_NAME: "prio-changes",

      // HTML IDs
      ID_TASKS_OVERDUE: "tasks-overdue",

      // HTML CLASS NAMES
      CLASS_DRAG_SOURCE: "drag-source",
      CLASS_DRAG_CONTAINER: "drag-container",
      CLASS_NO_DROP: "no-drop",
      CLASS_SORTABLE: "sortable",
      CLASS_OVERDUE: "tasks-overdue",
      CLASS_TYPE: "prio-type",
      CLASS_TASK_CHECKED: "task-checked",

      // HTML ATTRIBUTES
      ATTR_DATA_TARGET: "data-drop-zone",
      ATTR_DATA_DATE: "data-list-date",
      ATTR_DATA_TYPE: "data-list-type",
      ATTR_DATA_SECTION: "data-list-section",
      ATTR_TASK_ID: "data-task-id"
    });
}());