(function ($, Backbone, _, app) {

    var TemplateView = Backbone.View.extend({
        initialize: function () {
            this.template = _.template($(this.templateName).html());
        },
        render: function () {
            var context = this.getContext(),
            html = this.template(context);
            this.$el.html(html);
        },
        getContext: function () {
            return {};
        }
    });

    var FormView = TemplateView.extend({
        events: {
            'submit form': 'submit',
            'click button.cancel': 'done'
        },
        errorTemplate: _.template('<span class="error"><%- msg %></span>'),
        clearErrors: function () {
            $('.error', this.form).remove();
        },
        showErrors: function (errors) {
            _.map(errors, function (fieldErrors, name) {
                var field = $(':input[name=' + name + ']', this.form),
                    label = $('label[for=' + field.attr('id') + ']', this.form);
                if (label.length === 0) {
                    label = $('label', this.form).first();
                }
                function appendError(msg) {
                    label.before(this.errorTemplate({msg: msg}));
                }
                _.map(fieldErrors, appendError, this);
            }, this);
        },
        serializeForm: function (form) {
            return _.object(_.map(form.serializeArray(), function (item) {
                // Convert object to tuple of (name, value)
                return [item.name, item.value];
            }));
        },
        submit: function (event) {
            event.preventDefault();
            this.form = $(event.currentTarget);
            //console.log(this.form);
            this.clearErrors();
        },
        failure: function (xhr, status, error) {
            var errors = xhr.responseJSON;
            this.showErrors(errors);
        },
        done: function (event) {
            if (event) {
                event.preventDefault();
            }
            this.trigger('done');
            this.remove();
        },
        modelFailure: function (model, xhr, options) {
            var errors = xhr.responseJSON;
            this.showErrors(errors);
        }
    });

    var NewMessageView = FormView.extend({
        templateName: '#new-message-template',
        className: 'new-message',
        submit: function (event) {
            var self = this,
                attributes = {};
            FormView.prototype.submit.apply(this, arguments);
            attributes = this.serializeForm(this.form);
            app.collections.ready.done(function () {
                app.messages.create(attributes, {
                    wait: true,
                    success: $.proxy(self.success, self),
                    error: $.proxy(self.modelFailure, self)
                });
            });
        },
        getContext: function () {
            return {
              user: app.session.get('user'), item: app.session.get('item')
            };
        },
        success: function (model) {
            this.done();
            window.location.hash = '#';
        }
    });

    var NewItemView = TemplateView.extend({
        events: {
          'click button.cancel': 'done'
        },
        templateName: '#new-item-template',
        className: 'new-item',
        initialize: function (options){
          var self = this;
          TemplateView.prototype.initialize.apply(this, arguments);
          this.csrf_token = new app.models.csrf_token();
          this.csrf_token.fetch({
            success: $.proxy(self.render, self)
          });
          app.collections.ready.done(function() {
            app.categories.fetch({
                success: $.proxy(self.render, self)
            });
          });
        },
        submit: function (event) {
            var self = this,
                attributes = {};
            FormView.prototype.submit.apply(this, arguments);
            attributes = this.serializeForm(this.form);
            app.collections.ready.done(function () {
                app.items.create(attributes, {
                    wait: true,
                    success: $.proxy(self.success, self),
                    error: $.proxy(self.modelFailure, self)
                });
            });
        },
        getContext: function () {
            return {
              owner: app.session.get('user'),
              categories: app.categories || null,
              csrf_token: this.csrf_token
            };
        },
        done: function (event) {
            if (event) {
                event.preventDefault();
            }
            this.trigger('done');
            this.remove();
        },
        success: function (model) {
            this.done();
            window.location.hash = '#';
        }
    });

    var SettingsView = FormView.extend({
        templateName: '#settings-template',
        initialize: function (options){
          var self = this;
          TemplateView.prototype.initialize.apply(this, arguments);
          app.collections.ready.done(function() {
            app.groups.fetch({
                success: $.proxy(self.render, self)
            });
          });
        },
        submit: function (event) {
            var self = this,
                attributes = {};
            FormView.prototype.submit.apply(this, arguments);
            attributes = this.serializeForm(this.form);
            app.session.get('user').set(attributes);
            app.session.get('user').save();
        },
        getContext: function () {
            return {groups: app.groups || null, user: app.session.get('user')};
        },
        success: function (model) {
            this.done();
            window.location.hash = '#';
        }
    });

    var HelpView = TemplateView.extend({
        templateName: '#help-template',
        initialize: function (options){
          var self = this;
          TemplateView.prototype.initialize.apply(this, arguments);
          app.collections.ready.done(function() {
            app.groups.fetch({
                success: $.proxy(self.render, self)
            });
          });
        },
        getContext: function () {
            return {groups: app.groups || null, user: app.session.get('user')};
        }
    });

    var HomepageView = TemplateView.extend({
        templateName: '#mysite-template',
        events: {
            'click button.add': 'renderAddForm'
        },
        initialize: function (options) {
            var self = this;
            TemplateView.prototype.initialize.apply(this, arguments);
            app.collections.ready.done(function () {
                var now = new Date();
                now = now.toISOString().replace(/T.*/g, '');
                app.items.fetch({
                  data: {expirydate: now},
                  success: $.proxy(self.render, self)
                });
                app.users.fetch({
                  success: $.proxy(self.render, self)
                });
                app.categories.fetch({
                  success: $.proxy(self.render, self)
                })
            });
        },
        getContext: function () {
            if (typeof app.items !== 'undefined'){
              _.each(app.items.models, function(item){
                _.each(app.users.models, function(user){
                  if ((user.get('group') !== app.session.get('user').get('group')) && (user.get('url') === item.get('owner'))){
                    app.session.get('others_items').add(item);
                  }
                });
              });
            }
            return {
              items: app.items.sort() || null,
              users: app.users || null,
              categories: app.categories || null,
              owner: app.session.get('user')
            };
        },
        renderAddForm: function (event) {
            var view = new NewItemView(),
                link = $(event.currentTarget);
            event.preventDefault();
            link.before(view.el);
            link.hide();
            view.render();
            view.on('done', function () {
                link.show();
            });
        }
    });

    var MysiteView = TemplateView.extend({
        templateName: '#mysite-template',
        events: {
            'click button.add': 'renderAddForm'
        },
        initialize: function (options) {
            var self = this;
            TemplateView.prototype.initialize.apply(this, arguments);
            app.collections.ready.done(function () {
                var now = new Date();
                now = now.toISOString().replace(/T.*/g, '');
                app.items.fetch({
                  data: {expirydate: now},
                  success: $.proxy(self.render, self)
                });
                app.categories.fetch({
                  success: $.proxy(self.render, self)
                });
                app.messages.fetch({
                  success: $.proxy(self.render, self)
                });
                app.users.fetch({
                  success: $.proxy(self.render, self)
                });
            });
        },
        getContext: function () {
            if (typeof app.items !== 'undefined'){
              _.each(app.items.models, function(item){
                if(item.get('owner')===app.session.get('user').get('url')){
                  app.session.get('own_items').add(item);
                }
              });
            }
            return {
              items: app.items.sort() || null,
              categories: app.categories || null,
              messages: app.messages || null,
              users: app.users || null,
              owner: app.session.get('user') || null
            };
        },
        renderAddForm: function (event) {
            var view = new NewItemView(),
                link = $(event.currentTarget);
            event.preventDefault();
            link.before(view.el);
            link.hide();
            view.render();
            view.on('done', function () {
                link.show();
            });
        }
    });

    var LoginView = FormView.extend({
        templateName: '#login-template',
        submit: function (event) {
            var data = {};
            FormView.prototype.submit.apply(this, arguments);
            data = this.serializeForm(this.form);
            $.post(app.apiLogin, data)
                .done($.proxy(this.loginSuccess, this))
                .fail($.proxy(this.failure, this));
        },
        loginSuccess: function (data) {
            app.session.save(data.token);
            window.location = '/static/index.html';
        }
    });

    var HeaderView = TemplateView.extend({
        tagName: 'header',
        templateName: '#header-template',
        events: {
            'click a.logout': 'logout'
        },
        initialize: function(options){
          var self = this;
          TemplateView.prototype.initialize.apply(this, arguments);
          if (app.session.get('user')!==null){
            app.session.get('user').fetch({
              success: $.proxy(self.render, self)
            });
          }
        },
        getContext: function () {
            var username = null;
            if (app.session.get('user')!==null){
              username = app.session.get('user').get('username');
            };
            return {authenticated: app.session.authenticated(), username: username};
        },
        logout: function (event) {
            event.preventDefault();
            app.session.delete();
            window.location = '/';
        }
    });

    var AboutView = TemplateView.extend({
      tagName: 'about',
      templateName: '#about-template'
    })

    var EditView = FormView.extend({
        templateName: '#edit-template',
        initialize: function (options) {
            var self = this;
            TemplateView.prototype.initialize.apply(this, arguments);
            this.item = new app.models.Item({id: options.itemId});
            this.item.fetch();
            app.collections.ready.done(function() {
              app.categories.fetch({
                  success: $.proxy(self.render, self)
              });
            });
        },
        submit: function (event) {
            FormView.prototype.submit.apply(this, arguments);
            attributes = this.serializeForm(this.form);
            this.item.set(attributes);
            this.item.save();
            window.location = '/';
        },
        getContext: function () {
            return {item: this.item, categories: app.categories};
        },
        render: function () {
            TemplateView.prototype.render.apply(this, arguments);
        },
    });

    var ItemView = TemplateView.extend({
        templateName: '#item-template',
        events: {
            'click button.add': 'renderAddForm'
        },
        initialize: function (options) {
            var self = this;
            TemplateView.prototype.initialize.apply(this, arguments);
            this.item = new app.models.Item({id: options.itemId});
            this.item.fetch({
              success: $.proxy(self.render, self)
            });
            app.session.set('item', this.item);
            app.collections.ready.done(function() {
              app.categories.fetch({
                  success: $.proxy(self.render, self)
              });
              app.users.fetch({
                  success: $.proxy(self.render, self)
              })
              app.messages.fetch({
                  success: $.proxy(self.render, self)
              })
            });
        },
        getContext: function () {
            var url = 'http://localhost:8000/api/items/'+this.item.get('id');
            var date = new Date(this.item.get('creationdate'));
            var text = ('0'+date.getDate()).slice(-2)+'-'+('0'+(date.getMonth()+1)).slice(-2)+'-'+date.getFullYear();
            this.item.set('date', text);
            var messages = new app.collections.Messages();
            _.each(app.messages.models, function (message) {
              if ( url === message.get('item')) {
                messages.add(message);
                var date = new Date(message.get('creationdate'));
                var text = '('+('0'+date.getDate()).slice(-2)+'-'+('0'+(date.getMonth()+1)).slice(-2)+'-'+date.getFullYear()+' '+('0'+date.getHours()).slice(-2)+':'+('0'+date.getMinutes()).slice(-2)+') ';
                _.each(app.users.models, function (user) {
                  if (user.get('url') === message.get('owner')) {
                    text += '<strong>'+user.get('username')+'</strong>: ';
                  }
                });
                text += message.get('text');
                message.set('full_text', text);
              }
            });
            return {item: this.item, messages: messages, users: app.users};
        },
        render: function () {
            TemplateView.prototype.render.apply(this, arguments);
        },
        renderAddForm: function (event) {
            var view = new NewMessageView(),
                link = $(event.currentTarget);
            event.preventDefault();
            link.before(view.el);
            link.hide();
            view.render();
            view.on('done', function () {
                link.show();
            });
        }
    });

    app.views.HelpView = HelpView;
    app.views.HomepageView = HomepageView;
    app.views.LoginView = LoginView;
    app.views.HeaderView = HeaderView;
    app.views.ItemView = ItemView;
    app.views.SettingsView = SettingsView;
    app.views.MysiteView = MysiteView;
    app.views.EditView = EditView;
    app.views.AboutView = AboutView;
})(jQuery, Backbone, _, app);
