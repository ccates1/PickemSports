angular.module('MyApp')
  .controller('HomeCtrl', function($scope, $http, Account, $auth, toastr, $state) {

    $scope.noEmailorUsername = false;
    $scope.noUsername = false;

    $scope.getProfile = function() {
      Account.getProfile()
        .then(function(response) {
          $scope.user = response.data;
          if($scope.user.displayName == "") {
            $scope.noEmailorUsername = true;
          } else if($scope.user.email == "" || $scope.user.email == null) {
            $scope.noEmail = true;
          }

        })
        .catch(function(response) {
          toastr.error(response.data.message, response.status);
        });
    };

    $scope.isAuthenticated = function() {
      return $auth.isAuthenticated();
    };

    $scope.link = function(provider) {
      $auth.link(provider)
        .then(function() {
          toastr.success('You have successfully linked a ' + provider + ' account');
        })
        .catch(function(response) {
          toastr.error(response.data.message, response.status);
        });
    };

    $scope.unlink = function(provider) {
      $auth.unlink(provider)
        .then(function() {
          toastr.info('You have unlinked a ' + provider + ' account');
          $scope.getProfile();
        })
        .catch(function(response) {
          toastr.error(response.data ? response.data.message : 'Could not unlink ' + provider + ' account', response.status);
        });
    };

    $scope.goLeaderboard = function() {
      $state.go('contestList');
    }

    $scope.getInfo = function() {
      Account.getTop().then(function(response) {
        $scope.topUsers = response;
      });
    }; 

    $scope.click = function() {
      $state.go('leaderboard');
      $('#tabLeaderboard').trigger('click');
    };

    if($scope.isAuthenticated() === true) {
      $scope.getProfile();
      $scope.getInfo();
    };



  });
