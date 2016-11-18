angular.module('MyApp')
  .controller('PostCtrl', function($scope, $window, Contests, $auth, toastr, post, contest) {
    $scope.post = post;
  	$scope.contest = contest;
    $scope.comments = [];

  	var tempUser = $auth.getPayload();

  	$scope.isAuthenticated = function() {
      return $auth.isAuthenticated();
    };
  	$scope.addComment = function() {
      if(!$scope.message || $scope.message === '') {
        return;
      } else if($scope.message.length > 250) {
        toastr.warning('Comment exceeds 250 character limit');
        return;
      }


      Contests.addComment($scope.contest, $scope.post._id, {
        message: $scope.message,
        user: tempUser.sub
      }).success(function(comment) {
        post.comments.push(comment);
        $window.location.reload();
      });
    };

    $scope.incrementCommentUpvotes = function(comment) {
      if(comment.usersWhoUpvoted.indexOf(tempUser.sub) == -1) {
        comment.upvotes++;
        comment.usersWhoUpvoted.push(tempUser.sub);
        Contests.upvoteComment($scope.contest, $scope.post, comment);
      } else {
        toastr.warning('Not allowed to upvote a comment more than once.');
        return;
      }
    };

    $scope.showDeleteComment = function(comment) {
      if(comment.user._id == tempUser.sub) {
        return true;
      }
      return false;
    };

    $scope.deleteComment = function(comment) {
      Contests.deleteComment($scope.contest, $scope.post, comment)
        .success(function() {
          $scope.post.comments.splice($scope.post.comments.indexOf(comment), 1);
          $window.location.reload();
        })
    };
  });