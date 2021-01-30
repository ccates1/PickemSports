var path = require('path');
var qs = require('querystring');

var async = require('async');
var bcrypt = require('bcryptjs');
var bodyParser = require('body-parser');
var crypto = require('crypto');
var colors = require('colors');
var cors = require('cors');
var express = require('express');
var logger = require('morgan');
var jwt = require('jwt-simple');
var moment = require('moment');
var mongoose = require('mongoose');
var nodemailer = require('nodemailer');
var request = require('request');

var agenda = require('agenda');
var config = require('./config');

// Users
var userSchema = new mongoose.Schema({
    email: {
        type: String,
        unique: true,
        lowercase: true
    },
    password: {
        type: String,
        select: false
    },
    displayName: String,
    picture: String,
    facebook: String,
    twitter: String,
    timesFirstPlaceRanking: {
        type: Number,
        default: 0
    },
    timesSecondPlaceRanking: {
        type: Number,
        default: 0
    },
    timesThirdPlaceRanking: {
        type: Number,
        default: 0
    },
    totalPoints: {
        type: Number,
        default: 0
    },
    mlb: {
        total: {
            type: Number,
            default: 0
        },
        correct: {
            type: Number,
            default: 0
        },
        percentage: {
            type: Number,
            default: 0
        }
    },
    nba: {
        total: {
            type: Number,
            default: 0
        },
        correct: {
            type: Number,
            default: 0
        },
        percentage: {
            type: Number,
            default: 0
        }
    },
    nfl: {
        total: {
            type: Number,
            default: 0
        },
        correct: {
            type: Number,
            default: 0
        },
        percentage: {
            type: Number,
            default: 0
        }
    },
    ncaaf: {
        total: {
            type: Number,
            default: 0
        },
        correct: {
            type: Number,
            default: 0
        },
        percentage: {
            type: Number,
            default: 0
        }
    },
    ncaam: {
        total: {
            type: Number,
            default: 0
        },
        correct: {
            type: Number,
            default: 0
        },
        percentage: {
            type: Number,
            default: 0
        }
    },
    picks: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Pick'
    }]
});

userSchema.pre('save', function(next) {
    var user = this;
    if (!user.isModified('password')) {
        return next();
    }
    bcrypt.genSalt(10, function(err, salt) {
        bcrypt.hash(user.password, salt, function(err, hash) {
            user.password = hash;
            next();
        });
    });
});

userSchema.methods.comparePassword = function(password, done) {
    bcrypt.compare(password, this.password, function(err, isMatch) {
        done(err, isMatch);
    });
};

var User = mongoose.model('User', userSchema);

// Contests
var contestSchema = new mongoose.Schema({
    id: Number,
    tags: String,
    matchups: [{
        matchupId: Number,
        homeTeam: String,
        homeLogo: String,
        homeRecord: String,
        homeInfo: String,
        awayTeam: String,
        awayLogo: String,
        awayRecord: String,
        awayInfo: String,
        selectedTeam: String,
        matchupWinner: String,
        percentPicked: Number,
        matchupLeague: String
    }],
    participants: {
        type: Number
    },
    usersWhoJoined: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    }],
    picks: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "Pick"
    }],
    posts: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "Post"
    }],
    isChecked: Boolean,
    end: String,
    start: String
});

var Contest = mongoose.model('Contest', contestSchema);

// Picks
var pickSchema = new mongoose.Schema({
    contest: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Contest"
    },
    selectedTeams: [String],
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    },
    contestPoints: {
        type: Number,
        default: 0
    },
    contestRank: {
        type: Number,
        default: 0
    },
    contestTotal: {
        type: Number,
        default: 0
    },
    choseCorrectly: [Boolean]
});

var Pick = mongoose.model('Pick', pickSchema);

var postSchema = new mongoose.Schema({
    title: String,
    contest: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Contest"
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    },
    upvotes: {
        type: Number,
        default: 0
    },
    downvotes: {
        type: Number,
        default: 0
    },
    comments: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "Comment"
    }],
    usersWhoUpvoted: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    }],
    usersWhoDownvoted: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    }]
});

var Post = mongoose.model('Post', postSchema);

var commentSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    },
    usersWhoUpvoted: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    }],
    usersWhoDownvoted: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    }],
    upvotes: {
        type: Number,
        default: 0
    },
    downvotes: {
        type: Number,
        default: 0
    },
    post: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Post"
    },
    message: String
});

var Comment = mongoose.model('Comment', commentSchema);

mongoose.Promise = global.Promise;
mongoose.connect("mongodb://ccates1:florida2@ds145325.mlab.com:45325/pickemsports");
mongoose.connection.on('error', function(err) {
    console.log('Error: Could not connect to MongoDB. Did you forget to run `mongod`?'.red);
});


var app = express();

var agenda = require('./agenda');


app.options(/\.*/, function (req, res, next) {
        res.header("Access-Control-Allow-Origin", "*");
        res.header("Access-Control-Allow-Headers", "X-Requested-With, Content-Type");
        res.header('Access-Control-Allow-Methods', 'GET, POST, DELETE, PUT');
        res.sendStatus(200);
    });

app.set('port', process.env.PORT || 3198);
app.use(cors({
    origin: '*',
    withCredentials: false,
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin' ]
}));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
    extended: true
}));

// Force HTTPS on Heroku
if (app.get('env') === 'production') {
    app.use(function(req, res, next) {
        var protocol = req.get('x-forwarded-proto');
        protocol == 'https' ? next() : res.redirect('https://' + req.hostname + req.url);
    });
}
app.use(express.static(path.join(__dirname, 'client')));

/*
 |--------------------------------------------------------------------------
 | Login Required Middleware
 |--------------------------------------------------------------------------
 */
function ensureAuthenticated(req, res, next) {
    if (!req.header('Authorization')) {
        return res.status(401).send({
            message: 'Please make sure your request has an Authorization header'
        });
    }
    var token = req.header('Authorization').split(' ')[1];

    var payload = null;
    try {
        payload = jwt.decode(token, config.TOKEN_SECRET);
    } catch (err) {
        return res.status(401).send({
            message: err.message
        });
    }

    if (payload.exp <= moment().unix()) {
        return res.status(401).send({
            message: 'Token has expired'
        });
    }
    req.user = payload.sub;
    next();
}

/*
 |--------------------------------------------------------------------------
 | Generate JSON Web Token
 |--------------------------------------------------------------------------
 */
function createJWT(user) {
    var payload = {
        sub: user._id,
        iat: moment().unix(),
        exp: moment().add(14, 'days').unix()
    };
    return jwt.encode(payload, config.TOKEN_SECRET);
}
/*
 |--------------------------------------------------------------------------
 | GET /api/me
 |--------------------------------------------------------------------------
 */
app.get('/api/me', ensureAuthenticated, function(req, res) {
    User.findById(req.user, function(err, user) {
        res.send(user);
    });
});

app.get('/api/all', function(req, res) {
    User.find({}, function(err, users) {
        User.populate(users, {
            path: "picks"
        }).then(function(picks) {
            res.send(users);
            res.json(picks);
        });
    });
});

/*
 |--------------------------------------------------------------------------
 | PUT /api/me
 |--------------------------------------------------------------------------
 */
app.put('/api/me', ensureAuthenticated, function(req, res) {
    User.findById(req.user, function(err, user) {
        if (!user) {
            return res.status(400).send({
                message: 'User not found'
            });
        }
        User.findOne({
            email: req.body.email
        }, function(err, existingUser) {
            if(req.body.password === null) {
                user.displayName = req.body.displayName || user.displayName;
                user.email = req.body.email || user.email;
                user.password = req.body.password || user.password;
            } else {
                user.displayName = req.body.displayName || user.displayName;
                user.email = req.body.email || user.email;
                user.password = req.body.password || user.password;
            }
            user.save(function(err) {
                res.status(200).end();
            });
        });
    });
});

app.get('/forgot', function(req, res) {
    res.render('forgot', {
        user: req.user
    });
});

app.post('/forgot', function(req, res, next) {
    async.waterfall([
        function(done) {
            crypto.randomBytes(20, function(err, buf) {
                var token = buf.toString('hex');
                done(err, token);
            });
        },
        function(token, done) {
            console.log(req.body.email);
            User.findOne({
                email: req.body.email
            }, function(err, user) {
                if (!user) {
                    return res.status(400).send({
                        message: 'User not found'
                    });
                }

                user.resetPasswordToken = token;
                user.resetPasswordExpires = Date.now() + 3600000;

                user.save(function(err) {
                    done(err, token, user);
                });
            });
        },
        function(token, user, done) {
            var smtpTransport = nodemailer.createTransport('SMTP', {
                service: 'SendGrid',
                auth: {
                    user: '*****',
                    pass: '*****'
                }
            });
            var mailOptions = {
                to: user.email,
                from: 'passwordreset@pickemsports.com',
                subject: 'Node.js Password Reset',
                text: 'You are receiving this because you (or someone else) have requested the reset of the password for your account.\n\n' +
                    'Please click on the following link, or paste this into your browser to complete the process:\n\n' +
                    'http://' + req.headers.host + '/reset/' + token + '\n\n' +
                    'If you did not request this, please ignore this email and your password will remain unchanged.\n'
            };
            smtpTransport.sendMail(mailOptions, function(err) {
                done(err, user);
            });
        }

    ], function(err) {
        if (err) return next(err);
        res.redirect('/login');
    });
});

app.get('/reset/:token', function(req, res) {
    User.findOne({ resetPasswordToken: req.params.token, resetPasswordExpires: { $gt: Date.now() } }, function(err, user) {
            if (!user) {
      ressend('Password reset token is invalid or has expired.');
      return res.redirect('/login');
    }
    res.render('reset', {
      user: req.user
    });
    })
});

app.post('/reset/:token', function(req, res) {
  async.waterfall([
    function(done) {
      User.findOne({ resetPasswordToken: req.params.token, resetPasswordExpires: { $gt: Date.now() } }, function(err, user) {
        if (!user) {
          res.send('Password reset token is invalid or has expired.');
          return res.redirect('back');
        }

        user.password = req.body.password;
        user.resetPasswordToken = undefined;
        user.resetPasswordExpires = undefined;

        user.save(function(err) {
          req.logIn(user, function(err) {
            done(err, user);
          });
        });
      });
    },
    function(user, done) {
      var smtpTransport = nodemailer.createTransport('SMTP', {
        service: 'SendGrid',
        auth: {
          user: '*****',
          pass: '*****'
        }
      });
      var mailOptions = {
        to: user.email,
        from: 'passwordreset@demo.com',
        subject: 'Your password has been changed',
        text: 'Hello,\n\n' +
          'This is a confirmation that the password for your account ' + user.email + ' has just been changed.\n'
      };
      smtpTransport.sendMail(mailOptions, function(err) {
        done(err);
      });
    }
  ], function(err) {
    res.redirect('/');
  });
});


/*
 |--------------------------------------------------------------------------
 | Log in with Email
 |--------------------------------------------------------------------------
 */
app.post('/auth/login', function(req, res) {
    User.findOne({
        email: req.body.email
    }, '+password', function(err, user) {
        if (!user) {
            return res.status(401).send({
                message: 'Invalid email and/or password'
            });
        }
        user.comparePassword(req.body.password, function(err, isMatch) {
            if (!isMatch) {
                return res.status(401).send({
                    message: 'Invalid email and/or password'
                });
            }
            res.send({
                token: createJWT(user)
            });
        });
    });
});

/*
 |--------------------------------------------------------------------------
 | Create Email and Password Account
 |--------------------------------------------------------------------------
 */
app.post('/auth/signup', function(req, res) {
    User.findOne({
        $or: [{
            email: req.body.email
        }, {
            displayName: req.body.displayName
        }]
    }, function(err, user) {
        if (user) {
            if (user.displayName === req.body.displayName) {
                return res.status(409).send({
                    message: 'Username is already taken'
                });
            } else {
                return res.status(409).send({
                    message: 'Email is already taken'
                });
            }
        }
        var user = new User({
            username: req.body.displayName,
            email: req.body.email,
            password: req.body.password
        });
        user.save(function(err, result) {
            if (err) {
                res.status(500).send({
                    message: err.message
                });
            }
            res.send({
                token: createJWT(result)
            });
        });
    });
});

/*
 |--------------------------------------------------------------------------
 | Contest Routes
 |--------------------------------------------------------------------------
 */

app.param('contest', function(req, res, next, id) {
    var query = Contest.findById(id);

    query.exec(function(err, contest) {
        if (err) {
            return next(err);
        }
        if (!contest) {
            return next(new Error('cannot find that contest'));
        }
        req.contest = contest;
        return next();
    });
});

app.param('pick', function(req, res, next, id) {
    var query = Pick.findById(id);

    query.exec(function(err, pick) {
        if (err) {
            return next(err);
        }
        if (!pick) {
            return next(new Error('cannot find that pick'));
        }
        req.pick = pick;
        return next();
    });
});

app.param('post', function(req, res, next, id) {
    var query = Post.findById(id);

    query.exec(function(err, post) {
        if (err) {
            return next(err);
        }
        if (!post) {
            return next(new Error('cannot find that post'));
        }
        req.post = post;
        return next();
    });
});

app.param('comment', function(req, res, next, id) {
    var query = Comment.findById(id);

    query.exec(function(err, comment) {
        if (err) {
            return next(err);
        }
        if (!comment) {
            return next(new Error('cannont find that comment'));
        }
        req.comment = comment;
        return next();
    });
});

app.get('/contests', function(req, res) {
    Contest.find({}, function(err, contests) {
        Contest.populate(contests, {
            path: "picks"
        }).then(function() {
            res.json(contests);
        })
    });
});

app.get('/contests/:contest', function(req, res, next) {
    Contest.populate(req.contest, {
        path: "picks posts"
    }).then(function(contest) {
        Pick.populate(req.contest.picks, {
            path: "user"
        }).then(function(picks) {
            Post.populate(req.contest.posts, {
                path: "user comments"
            }).then(function(posts) {
                res.json(contest);
                res.json(picks);
                res.json(posts);
            });
        });
    });
});

app.get('/picks/:pick', function(req, res, next) {
    Pick.populate(req.pick, {
        path: "contest"
    }).then(function(pick) {
        res.json(pick);
    })
});

app.post('/contests/:contest/picks', function(req, res, next) {
    var pick = new Pick(req.body);
    pick.contestPoints = 0;
    User.findById(pick.user, function(err, user) {
        if (err) {
            return next(err);
        }
        user.picks.push(pick);

        user.save(function(err, user) {
            if (err) {
                return next(err);
            }
        });
    });

    pick.save(function(err, pick) {
        if (err) {
            return next(err);
        }
        req.contest.picks.push(pick);
        req.contest.participants++;

        req.contest.save(function(err, contest) {
            if (err) {
                return next(err);
            }
            Contest.populate(req.contest, {
                path: "picks",
            }).then(function(contest) {
                Pick.populate(req.contest.picks, {
                    path: "user",
                    select: "username"
                }).then(function(picks) {
                    res.json(contest);
                    res.json(picks);
                });
            });
        })
    });
});

app.delete('/contests/:contest/picks/:pick', function(req, res, next) {
    User.findById(req.pick.user, function(err, user) {
        if (err) {
            return next(err);
        }
        var array = user.picks;
        var index = array.indexOf(req.pick._id);
        if (index > -1) {
            user.picks.splice(index, 1);
        }

        user.save(function(err, user) {
            if (err) {
                return next(err);
            }
        });
        req.contest.picks.splice(req.contest.picks.indexOf(req.pick._id), 1);
        req.contest.usersWhoJoined.splice(req.contest.usersWhoJoined.indexOf(req.pick.user._id), 1);
        req.contest.participants--;
        req.contest.save(function(err, contest) {
            if (err) {
                return next(err);
            }
            req.pick.remove(function(err) {
                if (err) {
                    return next(err);
                }
                res.send("success");
            });
        });
    });
});

app.put('/contests/:contest/picks/:pick/edit', function(req, res, next) {
    req.pick.selectedTeams = req.body.pickSet;
    req.pick.save(function(err, pick) {
        if (err) {
            return next(err);
        }
        Pick.populate(req.pick, {
            path: "user",
            select: "username"
        }).then(function(pick) {
            res.json(pick);
        });
    });
});

app.post('/contests/:contest/posts', function(req, res, next) {
    var post = new Post(req.body);

    post.save(function(err, post) {
        if (err) {
            return next(err);
        }
        req.contest.posts.push(post);
        req.contest.save(function(err, contest) {
            if (err) {
                return next(err);
            }

            Contest.populate(req.contest, {
                path: "posts"
            }).then(function(contest) {
                Post.populate(req.contest.posts, {
                    path: "user comments"
                }).then(function(posts) {
                    res.json(contest);
                    res.json(posts);
                });
            });
        });
    });
});

app.delete('/contests/:contest/posts/:post', function(req, res, next) {
    for (var i = 0; i < req.post.comments.length; i++) {
        Comment.find({
            post: req.post
        }).remove().exec();
    }
    req.contest.posts.splice(req.contest.posts.indexOf(req.post), 1);
    req.contest.save(function(err, contest) {
        if (err) {
            return next(err);
        }
        req.post.remove(function(err) {
            if (err) {
                return next(err);
            }
            res.send("success");
        });
    });
});

app.delete('/contests/:contest/posts/:post/comments/:comment', function(req, res, next) {
    req.post.comments.splice(req.post.comments.indexOf(req.comment), 1);
    req.post.save(function(err, post) {
        if (err) {
            return next(err);
        }
        req.comment.remove(function(err) {
            if (err) {
                return next(err);
            }
            res.send("success");
        });
    });
});

app.post('/contests/:contest/posts/:post/comments', function(req, res, next) {
    var comment = new Comment(req.body);
    comment.message = req.body.message;
    comment.post = req.post;


    comment.save(function(err, comment) {
        if (err) {
            return next(err);
        }

        req.post.comments.push(comment);
        req.post.save(function(err, post) {
            if (err) {
                return next(err);
            }

            Post.populate(req.post, {
                path: "comments"
            }).then(function(post) {
                Comment.populate(req.post.comments, {
                    path: "user"
                }).then(function(comments) {
                    res.json(post);
                    res.json(comments);
                });
            });
        });
    });
});

app.put('/contests/:contest/posts/:post/upvotePost', function(req, res, next) {
    var token = req.header('Authorization').split(' ')[1];
    var payload = jwt.decode(token, config.TOKEN_SECRET);

    if (req.post.usersWhoUpvoted.indexOf(payload.sub) == -1) {
        req.post.upvotes++;
        req.post.usersWhoUpvoted.push(payload.sub);
        req.post.save(function(err, post) {
            if (err) {
                return next(err);
            }

            Post.populate(req.post, {
                path: "comments"
            }).then(function(post) {
                Comment.populate(req.post.comments, {
                    path: "user"
                }).then(function(comments) {
                    res.json(post);
                });
            });
        });
    };
});

app.put('/contests/:contest/posts/:post/downvotePost', function(req, res, next) {
    var token = req.header('Authorization').split(' ')[1];
    var payload = jwt.decode(token, config.TOKEN_SECRET);

    if (req.post.usersWhoDownvoted.indexOf(payload.sub) == -1) {
        req.post.downvotes++;
        req.post.usersWhoDownvoted.push(payload.sub);
        req.post.save(function(err, post) {
            if (err) {
                return next(err);
            }

            Post.populate(req.post, {
                path: "comments"
            }).then(function(post) {
                Comment.populate(req.post.comments, {
                    path: "user"
                }).then(function(comments) {
                    res.json(post);
                });
            });
        });
    };
});

app.put('/contests/:contest/posts/:post/comments/:comment/upvoteComment', function(req, res, next) {
    var token = req.header('Authorization').split(' ')[1];
    var payload = jwt.decode(token, config.TOKEN_SECRET);

    if (req.comment.usersWhoUpvoted.indexOf(payload.sub) == -1) {
        req.comment.upvotes++;
        req.comment.usersWhoUpvoted.push(payload.sub);
        req.comment.save(function(err, comment) {
            if (err) {
                return next(err);
            }
            Comment.populate(req.comment, {
                path: "user"
            }).then(function(comment) {
                res.json(comment);
            });
        });
    };
});

app.put('/contests/:contest/posts/:post/comments/:comment/downvoteComment', function(req, res, next) {
    var token = req.header('Authorization').split(' ')[1];
    var payload = jwt.decode(token, config.TOKEN_SECRET);

    if (req.comment.usersWhoDownvoted.indexOf(payload.sub) == -1) {
        req.comment.downvotes++;
        req.comment.usersWhoDownvoted.push(payload.sub);
        req.comment.save(function(err, comment) {
            if (err) {
                return next(err);
            }
            Comment.populate(req.comment, {
                path: "user"
            }).then(function(comment) {
                res.json(comment);
            });
        });
    };
});

app.get('/contests/:contest/posts/:post', function(req, res, next) {
    Post.populate(req.post, {
        path: "user comments"
    }).then(function(post) {
        Comment.populate(req.post.comments, {
            path: "user"
        }).then(function(comments) {
            res.json(post);
            res.json(comments);
        });
    });
});

/*
 |--------------------------------------------------------------------------
 | Login with Facebook
 |--------------------------------------------------------------------------
 */
app.post('/auth/facebook', function(req, res) {
    var fields = ['id', 'email', 'first_name', 'last_name', 'link', 'name'];
    var accessTokenUrl = 'https://graph.facebook.com/v2.5/oauth/access_token';
    var graphApiUrl = 'https://graph.facebook.com/v2.5/me?fields=' + fields.join(',');
    var params = {
        code: req.body.code,
        client_id: req.body.clientId,
        client_secret: config.FACEBOOK_SECRET,
        redirect_uri: req.body.redirectUri
    };

    // Step 1. Exchange authorization code for access token.
    request.get({
        url: accessTokenUrl,
        qs: params,
        json: true
    }, function(err, response, accessToken) {
        if (response.statusCode !== 200) {
            return res.status(500).send({
                message: accessToken.error.message
            });
        }

        // Step 2. Retrieve profile information about the current user.
        request.get({
            url: graphApiUrl,
            qs: accessToken,
            json: true
        }, function(err, response, profile) {
            if (response.statusCode !== 200) {
                return res.status(500).send({
                    message: profile.error.message
                });
            }
            if (req.header('Authorization')) {
                User.findOne({
                    facebook: profile.id
                }, function(err, existingUser) {
                    if (existingUser) {
                        return res.status(409).send({
                            message: 'There is already a Facebook account that belongs to you'
                        });
                    }
                    var token = req.header('Authorization').split(' ')[1];
                    var payload = jwt.decode(token, config.TOKEN_SECRET);
                    User.findById(payload.sub, function(err, user) {
                        if (!user) {
                            return res.status(400).send({
                                message: 'User not found'
                            });
                        }
                        user.facebook = profile.id;
                        user.picture = 'https://graph.facebook.com/' + profile.id + '/picture?type=large';
                        //user.displayName = user.displayName || profile.name;
                        user.save(function() {
                            var token = createJWT(user);
                            res.send({
                                token: token
                            });
                        });
                    });
                });
            } else {
                // Step 3. Create a new user account or return an existing one.
                User.findOne({
                    facebook: profile.id
                }, function(err, existingUser) {
                    if (existingUser) {
                        var token = createJWT(existingUser);
                        return res.send({
                            token: token
                        });
                    } else {
                        return res.status(500).send({
                            message: "You need to create an account before linking a social profile!"
                        });
                    }
                });
            }
        });
    });
});

/*
 |--------------------------------------------------------------------------
 | Login with Twitter
 |--------------------------------------------------------------------------
 */
app.post('/auth/twitter', function(req, res) {
    var requestTokenUrl = 'https://api.twitter.com/oauth/request_token';
    var accessTokenUrl = 'https://api.twitter.com/oauth/access_token';
    var profileUrl = 'https://api.twitter.com/1.1/users/show.json?screen_name=';

    // Part 1 of 2: Initial request from Satellizer.
    if (!req.body.oauth_token || !req.body.oauth_verifier) {
        var requestTokenOauth = {
            consumer_key: config.TWITTER_KEY,
            consumer_secret: config.TWITTER_SECRET,
            callback: req.body.redirectUri
        };

        // Step 1. Obtain request token for the authorization popup.
        request.post({
            url: requestTokenUrl,
            oauth: requestTokenOauth
        }, function(err, response, body) {
            var oauthToken = qs.parse(body);

            // Step 2. Send OAuth token back to open the authorization screen.
            res.send(oauthToken);
        });
    } else {
        // Part 2 of 2: Second request after Authorize app is clicked.
        var accessTokenOauth = {
            consumer_key: config.TWITTER_KEY,
            consumer_secret: config.TWITTER_SECRET,
            token: req.body.oauth_token,
            verifier: req.body.oauth_verifier
        };

        // Step 3. Exchange oauth token and oauth verifier for access token.
        request.post({
            url: accessTokenUrl,
            oauth: accessTokenOauth
        }, function(err, response, accessToken) {

            accessToken = qs.parse(accessToken);

            var profileOauth = {
                consumer_key: config.TWITTER_KEY,
                consumer_secret: config.TWITTER_SECRET,
                oauth_token: accessToken.oauth_token
            };

            // Step 4. Retrieve profile information about the current user.
            request.get({
                url: profileUrl + accessToken.screen_name,
                oauth: profileOauth,
                json: true
            }, function(err, response, profile) {

                // Step 5a. Link user accounts.
                if (req.header('Authorization')) {
                    User.findOne({
                        twitter: profile.id
                    }, function(err, existingUser) {
                        if (existingUser) {
                            return res.status(409).send({
                                message: 'There is already a Twitter account that belongs to you'
                            });
                        }

                        var token = req.header('Authorization').split(' ')[1];
                        var payload = jwt.decode(token, config.TOKEN_SECRET);

                        User.findById(payload.sub, function(err, user) {
                            if (!user) {
                                return res.status(400).send({
                                    message: 'User not found'
                                });
                            }

                            user.twitter = profile.id;
                            user.displayName = user.displayName || profile.name;
                            user.picture = profile.profile_image_url.replace('_normal', '');
                            user.save(function(err) {
                                res.send({
                                    token: createJWT(user)
                                });
                            });
                        });
                    });
                } else {
                    // Step 5b. Create a new user account or return an existing one.
                    User.findOne({
                        twitter: profile.id
                    }, function(err, existingUser) {
                        if (existingUser) {
                            return res.send({
                                token: createJWT(existingUser)
                            });
                        } else {
                            return res.status(500).send({
                                message: "You need to create an account before linking a social profile!"
                            });
                        }
                    });
                }
            });
        });
    }
});

/*
 |--------------------------------------------------------------------------
 | Unlink Provider
 |--------------------------------------------------------------------------
 */
app.post('/auth/unlink', ensureAuthenticated, function(req, res) {
    var provider = req.body.provider;
    var providers = ['facebook', 'twitter'];

    if (providers.indexOf(provider) === -1) {
        return res.status(400).send({
            message: 'Unknown OAuth Provider'
        });
    }

    User.findById(req.user, function(err, user) {
        if (!user) {
            return res.status(400).send({
                message: 'User Not Found'
            });
        }
        user[provider] = undefined;
        user.save(function() {
            res.status(200).end();
        });
    });
});


/*
 |--------------------------------------------------------------------------
 | Start the Server
 |--------------------------------------------------------------------------
 */
app.listen(app.get('port'), function() {
    console.log('Express server listening on port ' + app.get('port'));
});
