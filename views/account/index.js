'use strict';

var renderSettings = function(req, res, next, objectResults) {
  var outcome = {};
  var getAccountData = function(callback) {
    req.app.db.models.Account.findById(req.user.roles.account.id, 'preferences').exec(function(err, account) {
      if (err) {
        return callback(err, null);
      }
      outcome.account = account;
      callback(null, 'done');
    });
  };

  var getUserData = function(callback) {
    req.app.db.models.User.findById(req.user.id, 'username email country twitter.id github.id facebook.id google.id tumblr.id').exec(function(err, user) {
      if (err) {
        callback(err, null);
      }

      outcome.user = user;
      return callback(null, 'done');
    });
  };

  var asyncFinally = function(err, results) {
    if (err) {
      return next(err);
    }
    res.render('account/index',{
      data: {
        account: escape(JSON.stringify(outcome.account)),
        user: escape(JSON.stringify(outcome.user))
      },
      resultat_film: objectResults.resultat_film,
      resultat_livre: objectResults.resultat_livre,
      resultat_album: objectResults.resultat_album,
      resultat_sport: objectResults.resultat_sport,
      film: outcome.account.preferences.film,
      musique: outcome.account.preferences.musique,
      livre: outcome.account.preferences.livre,
      sport: outcome.account.preferences.sport,
      jeu: outcome.account.preferences.jeu,
      culture: outcome.account.preferences.culture,
      politique: outcome.account.preferences.politique,
      //country: outcome.account.preferences.country,
      //language: outcome.account.preferences.langue
    });
  };

    require('async').parallel([getAccountData, getUserData], asyncFinally);
};

var SparqlClient = require('sparql-client');


exports.init = function(req, res, next){
  var filmChecking = false;
  var albumChecking = false;
  var livreChecking = false;
  var sportChecking = false;
  var objectResults = {};
  var endpoint, prefixes, query, client;
  var lang = "en";

  //to get all movies
  if(!filmChecking){
    endpoint = 'http://www.linkedmdb.org/sparql';
    var actorName = "Tom Cruise";
    prefixes = "PREFIX owl: <http://www.w3.org/2002/07/owl#>\n"+
                    "PREFIX xsd: <http://www.w3.org/2001/XMLSchema#>\n"+
                    "PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>\n"+
                    "PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>\n"+
                    "PREFIX foaf: <http://xmlns.com/foaf/0.1/>\n"+
                    "PREFIX oddlinker: <http://data.linkedmdb.org/resource/oddlinker/>\n"+
                    "PREFIX map: <file:/C:/d2r-server-0.4/mapping.n3#>\n"+
                    "PREFIX db: <http://data.linkedmdb.org/resource/>\n"+
                    "PREFIX dbpedia: <http://dbpedia.org/property/>\n"+
                    "PREFIX skos: <http://www.w3.org/2004/02/skos/core#>\n"+
                    "PREFIX dc: <http://purl.org/dc/terms/>\n"+
                    "PREFIX movie: <http://data.linkedmdb.org/resource/movie/>\n";
    query = prefixes + "SELECT ?movieTitle WHERE{ "+
      "?actor <http://data.linkedmdb.org/resource/movie/actor_name> \""+actorName+"\" . "+
      "?movie movie:actor ?actor ."+
      "?movie dc:date ?date ."+
      "?movie dc:title ?movieTitle .}\nORDER BY DESC(?date)\nLIMIT 8";
    client = new SparqlClient(endpoint);

    client.query(query)
    .bind('city', '<http://dbpedia.org/resource/Vienna>')
    .execute(function(error, results) {
      filmChecking = true;
      objectResults.resultat_film = results.results.bindings;
      console.log("ok pour les films");
      renderSettings(req, res, next, objectResults);
    });
  }

  //to get all books
  if(!livreChecking){
    endpoint = 'http://dbpedia.org/sparql';
    prefixes = "PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>\n"+
               "PREFIX dbpedia3: <http://dbpedia.org/ontology/>\n"+
               "PREFIX dc: <http://purl.org/dc/elements/1.1/>\n"+
               "PREFIX dbpedia: <http://dbpedia.org/resource/>\n"+
               "PREFIX dbp: <http://dbpedia.org/property/>\n";
    query = prefixes + "SELECT ?auteur ?f ?name WHERE {" +
                       "?f   rdf:type   dbpedia3:Book  ." +
                       "?f   dbp:releaseDate ?d ." +
                       "?f   dbp:author ?a ." +
                       "?a   dbp:caption  ?auteur ." +
                       "?f   dbp:name ?name ."+
                       "FILTER ((?d>=\"2015-01-01\"^^xsd:date)" +
                       "&& (?d<\"2015-12-31\"^^xsd:date))" +
                        "}";
    client = new SparqlClient(endpoint);
    client.query(query)
    .execute(function(error, results) {
      livreChecking = true;
      objectResults.resultat_livre = results.results.bindings;
      console.log("ok pour les livres");
    });
  }


  //to get all albums
  if(!albumChecking){
    endpoint = 'http://dbpedia.org/sparql';
    var singerName = "Ed Sheeran";
    //formatting first letter uppercase
    singerName = singerName.replace(/\w\S*/g, function(txt){return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();});
    //replace space by _
    singerName = singerName.replace(/ /g,"_");
    prefixes = "PREFIX dbpedia-owl: <http://dbpedia.org/ontology/>\n"+
                "PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>\n"+
                "PREFIX dbp: <http://dbpedia.org/property/>\n";
    query = prefixes + "SELECT DISTINCT ?albumName WHERE {"+
                      "?album a dbpedia-owl:Album ."+
                      "?album rdfs:label ?albumName."+
                      "?album dbpedia-owl:releaseDate ?date."+
                      "?album dbpedia-owl:artist <http://dbpedia.org/resource/"+singerName+">."+
                      "FILTER (lang(?albumName) = '"+lang+"').}\nORDER BY DESC(?date)\nLIMIT 10";
    client = new SparqlClient(endpoint);

    client.query(query)
    .bind('city', '<http://dbpedia.org/resource/Vienna>')
    .execute(function(error, results) {
      albumChecking = true;
      objectResults.resultat_album = results.results.bindings;
      console.log("ok pour la musique");
    });
  }


  //to get all sports
  if(!sportChecking){
    endpoint = 'http://dbpedia.org/sparql';
    prefixes = "PREFIX dbpedia-owl: <http://dbpedia.org/ontology/>\n"+
               "PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>\n"+
               "PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>\n";
    query = prefixes + "SELECT ?competition ?date ?label WHERE {"+
                       "?competition rdf:type dbpedia-owl:SportsEvent."+
                       "?competition rdfs:label ?label." +
                       "?competition dbpedia-owl:startDate ?date."+
                       "FILTER (lang(?label) = '"+lang+"').}" +
                       "\nORDER BY DESC(?date)" +
                       "\nLIMIT 8";
    client = new SparqlClient(endpoint);
    client.query(query)
    .execute(function(error, results) {
      sportChecking = true;
      objectResults.resultat_sport = results.results.bindings;
      console.log("ok pour le sport");
    });
  }
};