angular.module('MyApp')
  .controller('ContestListCtrl', function($scope, $auth, toastr, Contests, $stateParams, $window) {
                $scope.activeTag = "all";
            $scope.selectedTag = "all";
    $scope.getAll = function() {
      $scope.contests = [];
      $scope.selectedContest = [];
      Contests.getAll()
        .then(function(response) {
          $scope.allContests = response.data;
          angular.forEach($scope.allContests, function(contest) {
            if(contest.isChecked == false) {
              $scope.contests.push(contest);
            };
          });
        })
        .catch(function(response) {
          toastr.error(response.data.message, response.status);
        });
    };
    $scope.isAuthenticated = function() {
      return $auth.isAuthenticated();
    };
    $scope.selectedTags = [];

            $scope.setTag = function(tag) {
                $scope.selectedTag = tag;
            };
            $scope.getTag = function(tag) {
                $scope.activeTag = tag;
            };
    if($auth.isAuthenticated()) {
      $scope.getAll();
    };

  })
    .filter('FilterContests', function() {
        return function(contests, selectedTag) {
            if (!contests) {
                return;
            }
            if (selectedTag === "all") {
                return contests;
            }
            var filteredContests = [];
            var empty = "No contests within the specified range.";

            for (var i = 0; i < contests.length; i++) {
                var contest = contests[i];

                if (!selectedTag || contest.tags.indexOf(selectedTag) != -1) {
                    filteredContests.push(contest);
                }
            }
            return filteredContests;
        };
    });