/* global app:true */

(function() {
  'use strict';

  app = app || {};

  app.Account = Backbone.Model.extend({
    idAttribute: '_id',
    url: '/account/preferences/'
  });

  app.User = Backbone.Model.extend({
    idAttribute: '_id',
    url: '/account/preferences/'
  });

  app.Details = Backbone.Model.extend({
    idAttribute: '_id',
    defaults: {
      success: false,
      errors: [],
      errfor: {},
      film: true,
      musique: true,
      livre: true,
      sport: true,
      jeu: true,
      culture: true,
      politique: true,
      //language: "English",
      //country: "France"
    },
    url: '/account/preferences/',
    parse: function(response) {
      if (response.account) {
        app.mainView.account.set(response.account);
        delete response.account;
      }
      return response;
    }
  });

  app.DetailsView = Backbone.View.extend({
    el: '#preferences',
    events: {
      'click .btn-update-preferences': 'update'
    },
    initialize: function() {
      this.model = new app.Details();
      this.syncUp();
      this.listenTo(app.mainView.account, 'change', this.syncUp);
      this.listenTo(this.model, 'sync', this.render);
      this.render();
    },
    syncUp: function() {
      this.model.set({
        _id: app.mainView.account.id,
        film: app.mainView.account.get('preferences').film,
        musique: app.mainView.account.get('preferences').musique,
        livre: app.mainView.account.get('preferences').livre,
        sport: app.mainView.account.get('preferences').sport,
        jeu: app.mainView.account.get('preferences').jeu,
        culture: app.mainView.account.get('preferences').culture,
        politique: app.mainView.account.get('preferences').politique,
        //language: app.mainView.account.get('preferences').language,
        //country: app.mainView.account.get('preferences').country
      });
    },
    render: function() {
      for (var key in this.model.attributes) {
        if (this.model.attributes.hasOwnProperty(key)) {
          this.$el.find('[name="'+ key +'"]').val(this.model.attributes[key]);
        }
      }
    },
    update: function() {
      this.model.save({
        film: this.$el.find('[name="film"]').get(0).checked,
        musique: this.$el.find('[name="musique"]').get(0).checked,
        livre: this.$el.find('[name="livre"]').get(0).checked,
        sport: this.$el.find('[name="sport"]').get(0).checked,
        jeu: this.$el.find('[name="jeu"]').get(0).checked,
        culture: this.$el.find('[name="culture"]').get(0).checked,
        politique: this.$el.find('[name="politique"]').get(0).checked,
        //language: this.$el.find('[name="language"]').options[this.$el.find('[name="language"]').selectedIndex].text,
        //country: this.$el.find('[name="country"]').get(0).options[this.$el.find('[name="country"]').get(0).selectedIndex].text,
      });
      this.render();
    }
  });


  app.MainView = Backbone.View.extend({
    el: '.page .container',
    initialize: function() {
      app.mainView = this;
      this.account = new app.Account( JSON.parse( unescape($('#data-account').html()) ) );
      this.user = new app.User( JSON.parse( unescape($('#data-user').html()) ) );
      app.detailsView = new app.DetailsView();
    }
  });


  $(document).ready(function() {
    app.mainView = new app.MainView();
  });
}());
