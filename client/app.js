angular.module('MyApp', ['angularUtils.directives.dirPagination', 'ngResource', 'ngMessages', 'ngAnimate', 'toastr', 'ui.router', 'satellizer', 'angularMoment'])
  .config(function($stateProvider, $urlRouterProvider, $authProvider) {
    $stateProvider
      .state('home', {
        url: '/',
        controller: 'HomeCtrl',
        templateUrl: 'partials/home.html'
      })
      .state('login', {
        url: '/login',
        templateUrl: 'partials/login.html',
        controller: 'LoginCtrl',
        resolve: {
          skipIfLoggedIn: skipIfLoggedIn
        }
      })
      .state('signup', {
        url: '/signup',
        templateUrl: 'partials/signup.html',
        controller: 'SignupCtrl',
        resolve: {
          skipIfLoggedIn: skipIfLoggedIn
        }
      })
      .state('logout', {
        url: '/logout',
        template: null,
        controller: 'LogoutCtrl'
      })
      .state('forgot', {
        url: '/forgot',
        templateUrl: 'partials/forgot.html',
        controller: 'ForgotCtrl'
      })
      .state('profile', {
        url: '/profile',
        templateUrl: 'partials/profile.html',
        controller: 'ProfileCtrl',
        resolve: {
          loginRequired: loginRequired
        }
      })
      .state('contestList', {
        url: '/contestList',
        templateUrl: 'partials/contestList.html',
        controller: 'ContestListCtrl'
      })
      .state('contest', {
        url: '/contests/{id}',
        templateUrl: 'partials/contests.html',
        controller: 'ContestCtrl',
        resolve: {
          contest: [
          '$stateParams', 'Contests',
            function($stateParams, Contests) {
              return Contests.get($stateParams.id);
            }]
        }
      })
      .state('contest.post', {
        url: '/posts/:postId',
        templateUrl: 'partials/contestPost.html',
        controller: 'PostCtrl',
        resolve: {
          post: [
          '$stateParams', 'Contests', 'contest',
            function($stateParams, Contests, contest) {
              return Contests.getPost(contest._id, $stateParams.postId);
            }]
        }
      })
      .state('leaderboard', {
        url: '/leaderboard',
        templateUrl: 'partials/leaderboard.html',
        controller: 'LeaderboardCtrl'
      })
      .state('termsAndConditions', {
        url: '/terms',
        templateUrl: 'partials/termsAndConditions.html'
      })
      .state('privacyPolicy', {
        url: '/policy',
        templateUrl: 'partials/privacyPolicy.html'
      });

    $urlRouterProvider.otherwise('/');

    $authProvider.facebook({
      clientId: '289121131435901'
    });

    $authProvider.twitter({
      url: '/auth/twitter'
    });

    $authProvider.oauth2({
      name: 'foursquare',
      url: '/auth/foursquare',
      clientId: 'MTCEJ3NGW2PNNB31WOSBFDSAD4MTHYVAZ1UKIULXZ2CVFC2K',
      redirectUri: window.location.origin || window.location.protocol + '//' + window.location.host,
      authorizationEndpoint: 'https://foursquare.com/oauth2/authenticate'
    });

    function skipIfLoggedIn($q, $auth) {
      var deferred = $q.defer();
      if ($auth.isAuthenticated()) {
        deferred.reject();
      } else {
        deferred.resolve();
      }
      return deferred.promise;
    }

    function loginRequired($q, $location, $auth) {
      var deferred = $q.defer();
      if ($auth.isAuthenticated()) {
        deferred.resolve();
      } else {
        $location.path('/login');
      }
      return deferred.promise;
    }
  });