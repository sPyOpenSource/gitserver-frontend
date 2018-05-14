(function ($, Backbone, _, app) {
    var AppRouter = Backbone.Router.extend({
        routes: {
            '': 'home',
            'item/:id': 'item',
            'help': 'help',
            'about': 'about'
        },
        initialize: function (options) {
            this.contentElement = '#content';
            this.message = '#message';
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
        item: function (id) {
            var view = new app.views.ItemView({
                el: this.contentElement,
                itemId: id
            });
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
                original.apply(this, args);
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
