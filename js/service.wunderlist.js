/*global angular, queryString, console*/

(function () {
  'use strict';

  var app = angular.module('prio.service.wunderlist', []),
    WunderlistSDK = window.wunderlist.sdk,
    wunderlistApiUrl = 'https://a.wunderlist.com/api/v1/',
    timeSpan = {
      overdue: "overdue", // before today (overdue)
      today: "today",
      tomorrow: "tomorrow",
      week: "week", // within a week
      future: "future", // more than a week
      unkown: "unkown"
    };

  app.service('wunderlistService', function ($rootScope, $http) {
    // 'Safe' $apply via https://coderwall.com/p/ngisma/safe-apply-in-angular-js
    $rootScope.safeApply = function (fn) {
      var phase = this.$root.$$phase;
      if (phase === '$apply' || phase === '$digest') {
        if (fn && (typeof (fn) === 'function')) {
          fn();
        }
      } else {
        this.$apply(fn);
      }
    };

    var WunderlistAPI,
      wunderlist = this,
      init,
      oauthConfig,
      allLists,
      allListIds = [],
      tasksById = {},
      taskIdsByDate = [],
      status = {
        message: "",
        code: ""
      },
      currentDayDates = [],
      currentTime,

      // We have to $apply changes when we went through everything in order to update the scope
      updateStatus = function (message, code) {
        status.message = message || "";
        status.code = code || "";
        $rootScope.safeApply();
      },

      handleError = function (resp, code) {
        var errorMessage;
        if (resp.error && resp.error.message) {
          errorMessage = resp.error.message;
        } else {
          errorMessage = resp;
        }
        updateStatus(errorMessage, code);
      },

      storeAllListIds = function () {
        angular.forEach(allLists, function (list, key) {
          allListIds[key] = list.id;
        });
      },

      setCurrentDayDates = function (currentDay) {
        currentDay = currentDay.getTime();
        var daySpan = 86400000,
          weekSpan = 604800000;

        currentDayDates[timeSpan.today] = currentDay;
        currentDayDates[timeSpan.tomorrow] = currentDay + daySpan;
        currentDayDates[timeSpan.week] = currentDay + weekSpan;
      },

      initNewTime = function () {
        var currentDay = new Date();

        currentDay.setHours(0, 0, 0, 0); // Reset day to last midnight because we can ignore today's hours etc.
        setCurrentDayDates(currentDay);
      },

      setCurrentTime = function (override) {
        initNewTime();

        currentTime = override || currentDayDates[timeSpan.today];
      },

      getCurrentness = function (due_date) {
        var taskTime = new Date(due_date),
          weekSpan = 604800000,
          daySpan = 86400000,
          timeDiff;

        taskTime.setHours(24, 0, 0, 0); // Set day to next midnight
        taskTime.getTime();
        timeDiff = taskTime - currentTime;

        if (timeDiff < 0) {
          return timeSpan.overdue; // before today (overdue)
        } else if (timeDiff < daySpan) {
          return timeSpan.today;
        } else if (timeDiff === daySpan) {
          return timeSpan.tomorrow;
        } else if (timeDiff < weekSpan) {
          return timeSpan.week; // within a week
        } else if (timeDiff >= weekSpan) {
          return timeSpan.future; // more than a week
        } else {
          return timeSpan.unkown;
        }
      },

      storeTasksById = function (task) {
        var id = task.id;

        if (id) {
          if (!tasksById[id]) {
            tasksById[id] = task;
          }
        }
      },

      storeTasksIdsByDate = function (task) {
        var id = task.id,
          due_date = task.due_date,
          currentness;

        if (due_date) {
          currentness = getCurrentness(due_date);

          if (!taskIdsByDate[currentness]) {
            // Create new array for every type of "currentness"
            taskIdsByDate[currentness] = [];
          }
          taskIdsByDate[currentness].push(id);
        }
      },

      storeTasks = function (tasks) {
        angular.forEach(tasks, function (task) {
          storeTasksIdsByDate(task);
          storeTasksById(task);
        });
      },

      loadAllTasks = function () {
        updateStatus("Loading tasks ...");

        // Initiate current time only once
        setCurrentTime();

        angular.forEach(allListIds, function (id, key) {
          WunderlistAPI.http.tasks.forList(id)
            .done(function (tasksData, statusCode) {
              storeTasks(tasksData);

              // We have to safeApply changes when we went through everything in order to update the scope
              if (key + 1 === allListIds.length) { // key + 1 might be faster than allListIds.length
                updateStatus("Loaded tasks successfully", statusCode);
              }
            })
            .fail(handleError);
        });

        // Reset current time
        setCurrentTime(0);
      },

      filterLists = function () {
        storeAllListIds();
        loadAllTasks();
      },

      loadAllLists = function () {
        updateStatus("Loading lists ...");

        WunderlistAPI.http.lists.all()
          .done(function (lists, statusCode) {
            updateStatus("Loaded lists successfully", statusCode);
            allLists = lists;
            filterLists();
          })
          .fail(handleError);
      },

      pullCurrentTaskData = function (id) {
        updateStatus("Syncing data ...");

        $http({
          method: 'GET',
          url: wunderlistApiUrl + 'tasks/' + id,
          headers: {
            'X-Access-Token': oauthConfig.accessToken,
            'X-Client-ID': oauthConfig.clientID,
            'Content-Type': 'application/json'
          }
        }).then(function successCallback(response) {
          tasksById[id] = response.data;
          updateStatus(response.statusText, response.status);
        }, function errorCallback(response) {
          handleError(response.statusText, response.status);
        });
      },

      solveConflicts = function (id) {
        pullCurrentTaskData(id);
      },

      sendPatch = function sendPatchR(id, data, tryouts) {
        $http({
          method: 'PATCH',
          url: wunderlistApiUrl + 'tasks/' + id,
          headers: {
            'X-Access-Token': oauthConfig.accessToken,
            'X-Client-ID': oauthConfig.clientID,
            'Content-Type': 'application/json'
          },
          data: data
        }).then(function successCallback(response) {
          pullCurrentTaskData(id);
          updateStatus(response.statusText, response.status);
        }, function errorCallback(response) {
          if (tryouts !== 0 && response.status === 409) { // 'Conflict'
            if (!tryouts) {
              tryouts = 2;
            }

            solveConflicts(id);
            setTimeout(function () {
              tryouts -= 1;
              sendPatchR(id, data, tryouts);
            }, 2000);
          } else {
            handleError(response.statusText, response.status);
          }
        });
      },

      updateTask = function (id, data) {
        if (!data) {
          return;
        }

        // A revision number is required for every patch
        data.revision = data.revision || tasksById[id].revision;

        sendPatch(id, data);
      };

    wunderlist.status = status;
    wunderlist.tasks = {
      tasksById: tasksById,
      taskIdsByDate: taskIdsByDate
    };
    wunderlist.date = currentDayDates;
    wunderlist.updateTask = updateTask;

    wunderlist.isLoggedIn = function () {
      // TODO: Security: Check if the randomly generated string equals parsed STATE
      // https://developer.wunderlist.com/documentation/concepts/authorization
      var parsedUrl = queryString.parse(location.search);
      oauthConfig.accessToken = parsedUrl.access_token;

      // TODO: Security: Instead of passing access_token via URL, use SESSIONS
      // http://stackoverflow.com/a/2447269/3266345

      return oauthConfig.accessToken ? true : false;
    };

    wunderlist.login = function () {
      window.location.href = "https://www.wunderlist.com/oauth/authorize?client_id=" +
        oauthConfig.clientID + "&redirect_uri=" +
        oauthConfig.redirectUrl + "&state=" +
        oauthConfig.random;
    };

    wunderlist.loadData = function () {
      if (!wunderlist.isLoggedIn) {
        return;
      }

      WunderlistAPI = new WunderlistSDK(oauthConfig);

      WunderlistAPI.initialized.done(function () {
        loadAllLists();
      });
    };

    init = function (config) {
      oauthConfig = config;

      return wunderlist;
    };

    return {
      init: init
    };
  });
}());