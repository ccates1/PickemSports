angular.module('MyApp')
    .factory('Contests', function($http) {
        return {
            getAll: function() {
                return $http.get("/contests");
            },
            get: function(id) {
                return $http.get("/contests/" + id).then(function(res) {
                    return res.data;
                });
            },
            createEntry: function(id, pick) {
                return $http.post("/contests/" + id + "/picks", pick);
            },
            deletePicks: function(id, pick) {
                return $http.delete("/contests/" + id + "/picks/" + pick._id);
            },
            getPick: function(id) {
                return $http.get("/picks/" + id);
            },
            changePicks: function(contest, pick, pickSet) {
                return $http.put("/contests/" + contest._id + "/picks/" + pick._id + "/edit", pickSet);
            },
            createPost: function(contest, post) {
                return $http.post("/contests/" + contest._id + "/posts", post);
            },
            deletePost: function(contest, post) {
                return $http.delete("/contests/" + contest._id + "/posts/" + post._id);
            },
            upvotePost: function(contest, post) {
                return $http.put("/contests/" + contest._id + "/posts/" + post._id + "/upvotePost");
            },
            downvotePost: function(contest, post) {
                return $http.put("/contests/" + contest._id + "/posts/" + post._id + "/downvotePost");
            },
            addComment: function(contest, id, comment) {
                return $http.post("/contests/" + contest._id + "/posts/" + id + "/comments", comment);
            },
            upvoteComment: function(contest, post, comment) {
                return $http.put("/contests/" + contest._id + "/posts/" + post._id + "/comments/" + comment._id + "/upvoteComment");
            },
            downvoteComment: function(contest, post, comment) {
                return $http.put("/contests/" + contest._id + "/posts/" + post._id + "/comments/" + comment._id + "/downvoteComment");
            },
            deleteComment: function(contest, post, comment) {
                return $http.delete("/contests/" + contest._id + "/posts/" + post._id + "/comments/" + comment._id);
            },
            getPost: function(contestId, postId) {
                return $http.get("/contests/" + contestId + "/posts/" + postId).then(function(res) {
                    return res.data;
                });
            },
            getWinners: function() {
                return $http.get("/contests/contestWinners.json");
            }

        };
    });
