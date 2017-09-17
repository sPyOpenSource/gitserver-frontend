(function ($, Backbone, _, app) {

    var AppRouter = Backbone.Router.extend({
        routes: {
            '': 'home',
            'item/:id': 'item',
            'edit/:id': 'edit',
            'settings': 'settings',
            'items': 'items',
            'help': 'help',
            'about': 'about'
        },
        initialize: function (options) {
            this.contentElement = '#content';
            this.current = null;
            this.header = new app.views.HeaderView();
            this.footer = new app.views.FooterView();
            $('body').prepend(this.header.el);
            $('body').append(this.footer.el);
            this.header.render();
            this.footer.render();
            Backbone.history.start();
        },
        home: function () {
            var view = new app.views.HomepageView({el: this.contentElement});
            this.render(view);
        },
        items: function () {
            var view = new app.views.MysiteView({el: this.contentElement});
            this.render(view);
        },
        item: function (id) {
            var view = new app.views.ItemView({
                el: this.contentElement,
                itemId: id
            });
            this.render(view);
        },
        edit: function (id) {
            var view = new app.views.EditView({
                el: this.contentElement,
                itemId: id
            });
            this.render(view);
        },
        settings: function(){
          var view = new app.views.SettingsView({el: this.contentElement});
          this.render(view);
        },
        help: function(){
          var view = new app.views.HelpView({el: this.contentElement});
          this.render(view);
        },
        about: function(){
          var view = new app.views.AboutView({el: this.contentElement});
          this.render(view);
        },
        route: function (route, name, callback) {
            // Override default route to enforce login on every page
            callback = callback || this[name];
            callback = _.wrap(callback, function (original) {
                var args = _.without(arguments, original);
                if (app.session.authenticated() || name === 'about' || name === 'help') {
                    original.apply(this, args);
                } else {
                    // Show the login screen before calling the view
                    // Bind original callback once the login is successful
                    var view = new app.views.LoginView({el: this.contentElement});
                    this.render(view);
                }
            });
            return Backbone.Router.prototype.route.apply(this, [route, name, callback]);
        },
        render: function (view) {
            if (this.current) {
                this.current.undelegateEvents();
                this.current.$el = $();
                this.current.remove();
            }
            this.current = view;
            this.current.render();
        }
    });

    app.router = AppRouter;

})(jQuery, Backbone, _, app);
