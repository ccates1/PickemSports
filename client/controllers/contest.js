angular.module('MyApp')
  .controller('ContestCtrl', function($scope, $http, $auth, toastr, Contests, contest, $window, moment, Account, $state) {
  $scope.contest = contest;
  $scope.selectedTeams = [];
  $scope.currentPicks = [];
  $scope.tempWinners = [];
  $scope.winners = [];
  $scope.makeAvailable = false;
  $scope.ended = false;
  $scope.madePicks = false;
  $scope.contestStarted = false;
  $scope.showContestLeaderboard = false;
  $scope.editUserPicks = false;
  $scope.shouldShowAddNewPostForm = false;
  $scope.showSubmitPost = false;
  $scope.thereArePicks = false;
  $scope.showPost=false;
  $scope.tempUserPicks = [];

  var sendMessage = false;
  var tempUser = $auth.getPayload();
  var tempCount = 0;
  var currentTime = moment();
  var endTime = moment($scope.contest.end);
  var startTime = moment($scope.contest.start);

  $scope.showPopup = function() {
    toastr.warning('Leaderboard not viewable until contest begins!');
    return;
  }


  $scope.showDeletePost = function(post) {
    if (post.user._id == tempUser.sub) {
      return true;
    }
    return false;
  };

  $scope.addPost = function() {
    if (!$scope.title || $scope.title === '') {
      return;
    } else if($scope.title.length > 250) {
      toastr.warning('Comment exceeds 250 character limit');
      return;
    }

    Contests.createPost($scope.contest, {
      contest: $scope.contest,
      title: $scope.title,
      user: tempUser.sub
    }).then(function(response) {
      post = response.data;
      $scope.contest.posts.push(post);
      $window.location.reload();
    });

    $scope.title = '';
    $scope.shouldShowAddNewPostForm = false;
  };

  $scope.deletePost = function(post) {
    Contests.deletePost($scope.contest, post)
      .success(function() {
      $scope.contest.posts.splice($scope.contest.posts.indexOf(post), 1);
      toastr.success('Successfully deleted your post!');
    })
  };

  $scope.incrementPostUpvotes = function(post) {
    Contests.upvotePost($scope.contest, post);
    if (post.usersWhoUpvoted.indexOf(tempUser.sub) == -1) {
      post.upvotes++;
      post.usersWhoUpvoted.push(tempUser.sub);
      Contests.upvotePost($scope.contest, post);
    } else {
      toastr.warning('Not allowed to upvote a comment more than once.');
    }
  };

  $scope.incrementPostDownvotes = function(post) {
    if (post.usersWhoDownvoted.indexOf(tempUser.sub) == -1) {
      post.downvotes++;
      post.usersWhoDownvoted.push(tempUser.sub);
      Contests.downvotePost($scope.contest, post);
    } else {
      toastr.warning('Not allowed to downvote a comment more than once.');

    }
  };

  $scope.getPostUpvoteColor = function(post) {
    if (post.upvoteHover || isUpvotedByCurrentUser(post)) {
      return 'text-danger';
    } else {
      return 'text-muted';
    }
  };

  $scope.getPostDownvoteColor = function(post) {
    if (post.downvoteHover || isDownvotedByCurrentUser(post)) {
      return 'text-danger';
    } else {
      return 'text-muted';
    }
  };

  $scope.isPostUpvotedByCurrentUser = function(post) {
    return post.usersWhoUpvoted.indexOf(tempUser.sub) != -1;
  };

  $scope.isPostDownvotedByCurrentUser = function(post) {
    return post.usersWhoDownvoted.indexOf(tempUser.sub) != -1;
  };

  $scope.showAddNewPostForm = function() {
    $scope.shouldShowAddNewPostForm = true;
  };

  $scope.getProfile = function() {
    Account.getProfile()
      .then(function(response) {
      $scope.user = response.data;
    })
      .
    catch (function(response) {
      toastr.error(response.data.message, response.status);
    });
  };

  $scope.isAuthenticated = function() {
    return $auth.isAuthenticated();
  };

  $scope.submitPicks = function(isValid) {
    if (isValid) {
      $scope.buttonDisabled = true;
      angular.forEach($scope.contest.matchups, function(matchup) {
        $scope.selectedTeams.push(matchup.selectedTeam);
      });
      Contests.createEntry(contest._id, {
        contest: $scope.contest,
        user: tempUser.sub,
        selectedTeams: $scope.selectedTeams,
      }).then(function(pick) {

        $scope.contest.picks.push(pick.data);
        $window.location.reload();
      });
      toastr.success('You have successfully submitted your picks!');
    } else {
      toastr.error('Must make a selection for each matchup to submit your entry!')
    }
  };

  $scope.deletePicks = function() {
    angular.forEach($scope.contest.picks, function(pick) {
      if (pick.user._id == tempUser.sub) {
        Contests.deletePicks(contest._id, pick);
        $scope.madePicks = false;
        $window.location.reload();
        toastr.warning('You have successfully deleted your picks');
      };
    });
  };

  $scope.checkPickSet = function(teamName) {

    for (var i = 0; i < $scope.currentPicks.length; i++) {
      if ($scope.currentPicks[i] == teamName) {
        return true;
      }
    };
    return false;
  };

  $scope.checkWinnerSet = function(teamName) {
    for (var i = 0; i < $scope.winners.length; i++) {
      if ($scope.winners[i] == teamName) {
        return true;
      }
    };
    return false;
  };

  $scope.editPicks = function() {
    $scope.editUserPicks = true;
    $scope.buttonDisabled = false;
  };
  $scope.cancelEditPicks = function() {
    $scope.editUserPicks = false;
  };

  $scope.submitEditPicks = function() {
    angular.forEach($scope.contest.picks, function(pick) {
      if (pick.user._id == tempUser.sub) {
        angular.forEach($scope.contest.matchups, function(matchup) {
          $scope.selectedTeams.push(matchup.selectedTeam);
        });
        Contests.changePicks(contest, pick, {
          pickSet: $scope.selectedTeams
        });
      };
    });
    $window.location.reload();
    toastr.warning('You have successfully edited your picks');
  };

  $scope.tempFormatEnded = function() {
    angular.forEach($scope.contest.picks, function(pick) {
      pick.selectedTeams = JSON.stringify(pick.selectedTeams).replace("[", "").replace(/["']/g, "").replace("]", "").replace(/[,]/g, ", ");
    });
  };

  // Check if current time is after end time
  if (currentTime.isAfter(endTime)) {
    $scope.ended = true;
    $scope.isNotEnded = false;
    toastr.info('Contest has ended!');
    if($scope.contest.isChecked == false) {
      $state.go('contestList');
    } else if ($scope.contest.isChecked == true) {
      // Trim the selectedTeams for each user within the contest leaderboard
      angular.forEach($scope.contest.picks, function(pick) {
        pick.selectedTeams = JSON.stringify(pick.selectedTeams).replace("[", "").replace(/["']/g, "").replace("]", "").replace(/[,]/g, ", ");
      });
      // Get the winners list even though the calculations have already been made (viewing purposes)
      Contests.getWinners().success(function(data) {
        $scope.tempWinners = data.contests;
        angular.forEach($scope.tempWinners, function(tempWinner) {
          if (tempWinner.id == $scope.contest.id) {
            angular.forEach(tempWinner.winners, function(winner) {
              $scope.winners.push(winner);
            });
          };
        });
      });
    };
  };

  if ($scope.ended != true) {
    angular.forEach($scope.contest.picks, function(pick) {
      if (pick.user._id == tempUser.sub) {
        $scope.madePicks = true;
        angular.forEach(pick.selectedTeams, function(selectedTeam) {
          $scope.currentPicks.push(selectedTeam);
        });
      };
    });
  };

  if (currentTime.isAfter(startTime)) {
    $scope.madePicks = true;
    $scope.buttonDisabled = true;
    $scope.showContestLeaderboard = true;
    $scope.makeAvailable = true;
    $scope.contestStarted = true;
  };

  if (currentTime.isAfter(startTime) && currentTime.isBefore(endTime)) {
    $scope.isNotEnded = true;
    angular.forEach($scope.contest.picks, function(pick) {
      pick.selectedTeams = JSON.stringify(pick.selectedTeams).replace("[", "").replace(/["']/g, "").replace("]", "").replace(/[,]/g, ", ");
    });
  };

  if ($scope.contest.picks.length > 0) {
    $scope.thereArePicks = true;
    angular.forEach($scope.contest.picks, function(pick) {

      angular.forEach($scope.contest.matchups, function(matchup) {
        if (pick.selectedTeams.indexOf(matchup.homeTeam) != -1) {
          matchup.percentPickedHome++;
        }
        if (pick.selectedTeams.indexOf(matchup.awayTeam) != -1) {
          matchup.percentPickedAway++;
        }
      })
    });

    angular.forEach($scope.contest.matchups, function(matchup) {
      matchup.percentPickedHome = ((matchup.percentPickedHome / $scope.contest.picks.length) * 100).toFixed(2);
      matchup.percentPickedAway = ((matchup.percentPickedAway / $scope.contest.picks.length) * 100).toFixed(2);
    });
  }

  if($auth.isAuthenticated()) {
      $scope.getProfile();
  };

  var incrementValue = 0;
  var checkValue = [];

  $scope.incrementProgress = function(id) {
    if(checkValue.length != 0) {
      for(var i=0; i < checkValue.length; i++) {
        if(id == checkValue[i]) {
          return;
        }
      }
    }
    checkValue.push(id);

    incrementValue++;
    var percent = ((incrementValue/$scope.contest.numberOfMatchups) * 100);
    $('.progress-bar').css({width: percent + '%'});
    $('.progress-bar').text("Pick " + incrementValue + " of " + $scope.contest.numberOfMatchups + " Made!");
  };
});
