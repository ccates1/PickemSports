var Agenda = require('agenda');
var mongoose = require('mongoose');
var http = require('http');
var moment = require('moment');
var mongoConnectionString = "mongodb://ccates1:florida2@ds145325.mlab.com:45325/pickemsports";
var Contest = mongoose.model('Contest');
var Pick = mongoose.model('Pick');
var User = mongoose.model('User');

var agenda = new Agenda({
    db: {
        address: mongoConnectionString
    }
}, function(err) {
    if (err) {
        console.log(err);
        throw err;
    }
    agenda.emit('ready');
    agenda.every('3 minutes', 'test');
    agenda.start();
});
agenda.define('test', function(job, done) {
    Contest.find({})
        .populate({
            path: 'picks',
            populate: {
                path: 'user'
            }
        })
        .exec(function(err, contests, $http) {
            if (err) {
                throw err;
            }
            for (var i = 0; i < contests.length; i++) {
                console.log('FFFIIIIRRREEEDDD');
                var current = Math.round(moment.now() / 1000);
                var contest = contests[i];
                var end = ((moment(contest.end)).unix());
                if (end < current && contest.isChecked === false) {
                    var data = require('./client/contests/contestWinners.json');
                    var contestWinnerList = data.contests;
                    contestWinnerList.forEach(function(matchedContest) {
                        if (matchedContest.id == contest.id) {
                            var countCorrect;
                            contest.picks.forEach(function(pick) {
                                countCorrect = 0;
                                for (var i = 0; i < matchedContest.winners.length; i++) {
                                    if (pick.selectedTeams[i] == matchedContest.winners[i]) {
                                        countCorrect++;
                                    }
                                }
                                Pick.findById(pick._id, function(err, serverPick) {
                                    if (err) {
                                        throw err;
                                    }
                                    serverPick.contestPoints = countCorrect;
                                    serverPick.save(function(err) {
                                        if (err) {
                                            throw err;
                                        }
                                    });
                                });
                            });
                            contest.picks.sort(function(a, b) {
                                return b.contestPoints - a.contestPoints;
                            });
                            var contestTotal = contest.picks.length;
                            console.log(contestTotal);
                            var count = 0;
                            contest.picks.forEach(function(pick) {
                                count++;
                                if (count == 1) {
                                    Pick.findById(pick._id, function(err, serverPick) {
                                        if (err) {
                                            throw err;
                                        }
                                        serverPick.contestTotal = contestTotal;
                                        serverPick.contestRank = 1;
                                        serverPick.save(function(err) {
                                            if (err) {
                                                throw err;
                                            }
                                        });
                                        User.findById(pick.user._id, function(err, user) {
                                            if (err) {
                                                throw err;
                                            }
                                            user.timesFirstPlaceRanking = user.timesFirstPlaceRanking + 1;
                                            user.save(function(err) {
                                                if (err) {
                                                    throw err;
                                                }
                                            });
                                        });
                                    });
                                } else if (count == 2) {
                                    Pick.findById(serverPick._id, function(err, serverPick) {
                                        if (err) {
                                            throw err;
                                        }
                                        serverPick.contestTotal = contestTotal;
                                        serverPick.contestRank = 2;
                                        serverPick.save(function(err) {
                                            if (err) {
                                                throw err;
                                            }
                                        });
                                        User.findById(pick.user._id, function(err, user) {
                                            if (err) {
                                                throw err;
                                            }
                                            user.timesSecondPlaceRanking = user.timesSecondPlaceRanking + 1;
                                            user.save(function(err) {
                                                if (err) {
                                                    throw err;
                                                }
                                            });
                                        });
                                    });
                                } else if (count == 3) {
                                    Pick.findById(pick._id, function(err, serverPick) {
                                        if (err) {
                                            throw err;
                                        }
                                        serverPick.contestTotal = contestTotal;
                                        serverPick.contestRank = 1;
                                        serverPick.save(function(err) {
                                            if (err) {
                                                throw err;
                                            }
                                        });
                                        User.findById(pick.user._id, function(err, user) {
                                            if (err) {
                                                throw err;
                                            }
                                            user.timesFirstPlaceRanking = user.timesFirstPlaceRanking + 1;
                                            user.save(function(err) {
                                                if (err) {
                                                    throw err;
                                                }
                                            });
                                        });
                                    });
                                } else {
                                    Pick.findById(pick._id, function(err, serverPick) {
                                        if (err) {
                                            throw err;
                                        }
                                        serverPick.contestTotal = contestTotal;
                                        serverPick.contestRank = i + 1;
                                        serverPick.save(function(err) {
                                            if (err) {
                                                throw err;
                                            }
                                        });
                                    });
                                }
                            });
							Contest.findById(contest._id, function(err, serverContest) {
								if(err) {
									throw err;
								}
								console.log("test");
								contest.isChecked = true;
								contest.save(function(err) {
									if(err) {
										throw err;
									}
								});
							});
                        }
                    });
                }
            }
        });
    done();
});