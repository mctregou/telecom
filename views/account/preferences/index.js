'use strict';

var renderSettings = function(req, res, next, oauthMessage) {
  var outcome = {};

  var getAccountData = function(callback) {
    req.app.db.models.Account.findById(req.user.roles.account.id, 'preferences').exec(function(err, account) {
      if (err) {
        return callback(err, null);
      }
      outcome.account = account;
      console.log("On récupère le compte : " + outcome.account);
      callback(null, 'done');
    });
  };

  var getUserData = function(callback) {
    req.app.db.models.User.findById(req.user.id, 'username email country twitter.id github.id facebook.id google.id tumblr.id').exec(function(err, user) {
      if (err) {
        callback(err, null);
      }

      outcome.user = user;
      console.log("On récupère le user : " + outcome.user);
      return callback(null, 'done');
    });
  };

  var asyncFinally = function(err, results) {
    if (err) {
      return next(err);
    }
    res.render('account/preferences/index',{
      data: {
        account: escape(JSON.stringify(outcome.account)),
        user: escape(JSON.stringify(outcome.user))
      },
      film: outcome.account.preferences.film,
      musique: outcome.account.preferences.musique,
      livre: outcome.account.preferences.livre,
      sport: outcome.account.preferences.sport,
      jeu: outcome.account.preferences.jeu,
      culture: outcome.account.preferences.culture,
      politique: outcome.account.preferences.politique,
      country: outcome.account.preferences.country,
      language: outcome.account.preferences.language
    });
  };

    require('async').parallel([getAccountData, getUserData], asyncFinally);
};
exports.init = function(req, res, next){
  renderSettings(req, res, next, '');
};

exports.update = function(req, res, next){
  console.log("Ca marche");
  var workflow = req.app.utility.workflow(req, res);
  workflow.on('validate', function() {
    if (workflow.hasErrors()) {
      return workflow.emit('exception');
    }
    workflow.emit('patchAccount');
  });

  workflow.on('patchAccount', function() {
    var fieldsToSet = {
      preferences: {
        film: req.body.film,
        musique: req.body.musique,
        livre: req.body.livre,
        sport: req.body.sport,
        jeu: req.body.jeu,
        culture: req.body.culture,
        politique: req.body.politique,
        language: req.body.language,
        country:req.body.country
      }
    };
      console.log("Preferences : " + fieldsToSet);
      var options = { select: 'preferences' };
      req.app.db.models.Account.findByIdAndUpdate(req.user.roles.account.id, fieldsToSet, options, function(err, account) {
      if (err) {
        return workflow.emit('exception', err);
      }
      console.log(account);
      workflow.outcome.account = account;
      return workflow.emit('response');
    });
  });

  workflow.emit('validate');
};
