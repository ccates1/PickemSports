angular.module('MyApp')
  .controller('ProfileCtrl', function($scope, $auth, toastr, Account, Contests) {
    $scope.showUpdateProfile = false;
    $scope.userPicks = [];

    $scope.getProfile = function() {
      Account.getProfile()
        .then(function(response) {
          $scope.user = response.data;

          $scope.user.mlb.percentage = ((($scope.user.mlb.correct/$scope.user.mlb.total) || 0).toFixed(2))*100; 
          $scope.user.nfl.percentage = ((($scope.user.nfl.correct/$scope.user.nfl.total) || 0).toFixed(2))*100;
          $scope.user.nba.percentage = ((($scope.user.nba.correct/$scope.user.nba.total) || 0).toFixed(2))*100;
          $scope.user.ncaaf.percentage = ((($scope.user.ncaaf.correct/$scope.user.ncaaf.total) || 0).toFixed(2))*100;
          $scope.user.ncaam.percentage = ((($scope.user.ncaam.correct/$scope.user.ncaam.total) || 0).toFixed(2))*100;

          angular.forEach($scope.user.picks, function(pick) {
            Contests.getPick(pick).then(function(response) {
              var temp = response.data;
              temp.selectedTeams = JSON.stringify(temp.selectedTeams).replace("[", "").replace(/["']/g, "").replace("]", "").replace(/[,]/g, ", ");
              $scope.userPicks.push(response.data);
            });
          });
        })
        .catch(function(response) {
          toastr.error(response.data.message, response.status);
        });
    };
    $scope.updateProfile = function() {
      console.log(user.password);
      console.log($scope.user.password);
      console.log(password);
      if(user.password === null) {
        console.log('test');
        toastr.error("Please enter your password to confirm your profile changes");
      } else {
        Account.updateProfile($scope.user)
          .then(function() {
            toastr.success('Profile has been updated');
          })
          .catch(function(response) {
            toastr.error(response.data.message, response.status);
          });
      }
    };
    $scope.link = function(provider) {
      $auth.link(provider)
        .then(function() {
          toastr.success('You have successfully linked a ' + provider + ' account');
          $scope.getProfile();
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
    $scope.upload = function() {
      $scope.uploader = {};
      $scope.uploader.flow.upload();
          Account.updatePicture($scope.user, {picture: file})
            .then(function() {
              toastr.success('Profile has been updated');
            })
            .catch(function(response) {
              toastr.error(response.data.message, response.status);
            });
    };

    $scope.getProfile();
  });