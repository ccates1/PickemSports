angular.module('MyApp')
  .factory('Account', function($http) {
    return {
      getProfile: function() {
        return $http.get('/api/me');
      },
      forgot: function(email) {
        return $http.post('/forgot', email);
      },
      updateProfile: function(profileData) {
        return $http.put('/api/me', profileData);
      },
      updatePicture: function(picture) {
        return $http.put('/api/me/editPicture', picture);
      },
      getAll: function() {
        return $http.get('/api/all').then(function(response) {
          var pickPoints = 0;
          var userData = response.data;
          angular.forEach(userData, function(user) {
            angular.forEach(user.picks, function(pick) {
              pickPoints += ((pick.contestTotal - pick.contestRank)/(pick.contestTotal))*10;
            })
            user.totalPoints = (pickPoints + (user.timesFirstPlaceRanking*0.75) + (user.timesSecondPlaceRanking*0.50) + (user.timesThirdPlaceRanking*0.25) || 0).toFixed(2);

            user.mlb.percentage = (((user.mlb.correct/user.mlb.total) || 0).toFixed(2))*100;
            user.nfl.percentage = (((user.nfl.correct/user.nfl.total) || 0).toFixed(2))*100;
            user.nba.percentage = (((user.nba.correct/user.nba.total) || 0).toFixed(2))*100;
            user.ncaaf.percentage = (((user.ncaaf.correct/user.ncaaf.total) || 0).toFixed(2))*100;
            user.ncaam.percentage = (((user.ncaam.correct/user.ncaam.total) || 0).toFixed(2))*100;

            pickPoints = 0;
          });
          userData.sort(function(a, b) {
            return parseFloat(b.totalPoints) - parseFloat(a.totalPoints);
        });
        var integer = 0;
        angular.forEach(userData, function(user) {
          integer++;
          user.rank = integer;
        });
        return userData;
      });
        },

      getTop: function() {
        return $http.get('/api/all').then(function(response) {
          var pickPoints = 0;
          var userData = response.data;
          angular.forEach(userData, function(user) {
            angular.forEach(user.picks, function(pick) {
              pickPoints += ((pick.contestTotal - pick.contestRank)/(pick.contestTotal))*10;
            })
            user.totalPoints = (pickPoints + (user.timesFirstPlaceRanking*0.75) + (user.timesSecondPlaceRanking*0.50) + (user.timesThirdPlaceRanking*0.25) || 0).toFixed(2);
            pickPoints = 0;
          });
          var integer = 0;
          angular.forEach(userData, function(user) {
            integer++;
            user.rank = integer;
          });
          var result = [];
          for(var i=0; i<=4;i++) {
            if(userData[i] != null) {
              result.push(userData[i]);
            }
          }
          return result;
        });
      }
      };
  });
