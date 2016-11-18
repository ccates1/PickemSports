angular.module('MyApp')
  .controller('LeaderboardCtrl', function($scope, $auth, toastr, Contests, $window, moment, Account) {
    $scope.sortType = 'rank';
    $scope.sortReverse = false;
    $scope.isAuthenticated = function() {
      return $auth.isAuthenticated();
    };
    $scope.getInfo = function() {
      Account.getAll().then(function(response) {
        $scope.users = response;
      })
    };

    $scope.getInfo();
    
  });
