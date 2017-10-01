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

    var ServerFormView = TemplateView.extend({
      events: {
        'click button.cancel': 'done'
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
    })

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
            app.messages.create(attributes, {
              wait: true,
              success: $.proxy(self.success, self),
              error: $.proxy(self.modelFailure, self)
            });
        },
        getContext: function () {
            return {
              user: app.session.get('user'),
              item: app.session.get('item'),
              i18n: app.session.get('i18n')
            };
        },
        success: function (model) {
            this.done();
            window.location.hash = '#';
        }
    });

    var NewItemView = ServerFormView.extend({
        templateName: '#new-item-template',
        className: 'new-item',
        initialize: function (options){
          var self = this;
          TemplateView.prototype.initialize.apply(this, arguments);
          this.csrf_token = new app.models.csrf_token();
          this.csrf_token.fetch({
            success: $.proxy(self.render, self)
          });
          app.categories.fetch({
            success: $.proxy(self.render, self)
          });
        },
        getContext: function () {
          return {
            owner: app.session.get('user'),
            categories: app.categories || null,
            csrf_token: this.csrf_token,
            i18n: app.session.get('i18n')
          };
        }
    });

    var NewUserView = ServerFormView.extend({
        templateName: '#new-user-template',
        className: 'new-user',
        initialize: function (options){
          if (document.getElementById("navbarCollapse").getAttribute('aria-expanded')){
            $('#navbarCollapse').collapse('toggle');
          }
          var self = this;
          TemplateView.prototype.initialize.apply(this, arguments);
          this.csrf_token = new app.models.csrf_token();
          this.csrf_token.fetch({
            success: $.proxy(self.render, self)
          });
          app.groups.fetch({
            success: $.proxy(self.render, self)
          });
        },
        getContext: function () {
            return {
              groups: app.groups || null,
              csrf_token: this.csrf_token,
              i18n: app.session.get('i18n')
            };
        }
    });

    var SecondView = Backbone.View.extend({
        initialize: function(){
          this.render();
        },
        render: function(){
          var template = _.template('<script>$("#test").fadeOut(3000);</script><div id="test" class="alert alert-success"><strong>Success!</strong> This alert box could indicate a successful or positive action.</div>');
          this.$el.html(template);
        }
    });

    var ResetPasswordView = ServerFormView.extend({
        templateName: '#password-template',
        className: 'reset-password',
        initialize: function (options){
          if (document.getElementById("navbarCollapse").getAttribute('aria-expanded')){
            $('#navbarCollapse').collapse('toggle');
          }
          var self = this;
          TemplateView.prototype.initialize.apply(this, arguments);
          this.csrf_token = new app.models.csrf_token();
          this.csrf_token.fetch({
            success: $.proxy(self.render, self)
          });
          this.key = options.key;
        },
        getContext: function () {
            return {
              key: this.key,
              csrf_token: this.csrf_token,
              i18n: app.session.get('i18n')
            };
        }
    });

    var SettingsView = FormView.extend({
        templateName: '#settings-template',
        initialize: function (options){
          if (document.getElementById("navbarCollapse").getAttribute('aria-expanded')){
            $('#navbarCollapse').collapse('toggle');
          }
          var self = this;
          TemplateView.prototype.initialize.apply(this, arguments);
            app.groups.fetch({
                success: $.proxy(self.render, self)
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
            return {groups: app.groups || null, user: app.session.get('user'), i18n: app.session.get('i18n')};
        },
        success: function (model) {
            this.done();
            window.location.hash = '#';
        }
    });

    var HelpView = TemplateView.extend({
        templateName: '#help-template',
        initialize: function (options){
          if (document.getElementById("navbarCollapse").getAttribute('aria-expanded')){
            $('#navbarCollapse').collapse('toggle');
          }
          var self = this;
          TemplateView.prototype.initialize.apply(this, arguments);
        },
        getContext: function () {
            return {i18n: app.session.get('i18n')};
        }
    });

    var HomepageView = TemplateView.extend({
        templateName: '#home-template',
        events: {
            'click button.add': 'renderAddForm'
        },
        initialize: function (options) {
          if (document.getElementById("navbarCollapse").getAttribute('aria-expanded')){
            $('#navbarCollapse').collapse('toggle');
          }
          var self = this;
          TemplateView.prototype.initialize.apply(this, arguments);
            app.demos.fetch({
              success: $.proxy(self.render, self)
            });
        },
        getContext: function () {
            return {
              demos: app.demos.sort() || null,
              i18n: app.session.get('i18n'),
              authenticated: app.session.authenticated()
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
        initialize: function(options){
          if (document.getElementById("navbarCollapse").getAttribute('aria-expanded')){
            $('#navbarCollapse').collapse('toggle');
          }
          var self = this;
          TemplateView.prototype.initialize.apply(this, arguments);
        },
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
            window.location = '/';
        },
        getContext: function (data) {
            return {i18n: app.session.get('i18n')};
        }
    });

    var HeaderView = TemplateView.extend({
        tagName: 'nav',
        id: 'myNavbar',
        className: 'navbar navbar-default navbar inverse',
        templateName: '#header-template',
        events: {
            'click a.logout': 'logout',
            'click button.nl': 'nl',
            'click button.en': 'en'
        },
        getContext: function () {
            return {authenticated: app.session.authenticated(), i18n: app.session.get('i18n')};
        },
        logout: function (event) {
            event.preventDefault();
            app.session.delete();
            window.location = '/';
        },
        nl: function () {
            localStorage.language = 'nl';
            window.location = '/';
        },
        en: function () {
            localStorage.language = 'en';
            window.location = '/';
        }
    });

    var FooterView = TemplateView.extend({
        tagName: 'footer',
        templateName: '#footer-template',
        getContext: function () {
            return {i18n: app.session.get('i18n')};
        }
    });

    var AboutView = TemplateView.extend({
      tagName: 'about',
      templateName: '#about-template',
      initialize: function(options){
        if (document.getElementById("navbarCollapse").getAttribute('aria-expanded')){
          $('#navbarCollapse').collapse('toggle');
        }
        var self = this;
        TemplateView.prototype.initialize.apply(this, arguments);
      },
      getContext: function () {
        return {i18n: app.session.get('i18n')}
      }
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
            app.categories.fetch({
              success: $.proxy(self.render, self)
            });
            app.users.fetch({
              success: $.proxy(self.render, self)
            });
            app.messages.fetch({
              data: {item: this.item.id},
              success: $.proxy(self.render, self)
            });
        },
        getContext: function () {
            var url = 'http://localhost:8000/api/items/'+this.item.get('id');
            var date = new Date(this.item.get('creationdate'));
            var text = ('0'+date.getDate()).slice(-2)+'-'+('0'+(date.getMonth()+1)).slice(-2)+'-'+date.getFullYear();
            this.item.set('date', text);
            _.each(app.messages.models, function (message) {
              var date = new Date(message.get('creationdate'));
              var text = '('+('0'+date.getDate()).slice(-2)+'-'+('0'+(date.getMonth()+1)).slice(-2)+'-'+date.getFullYear()+' '+('0'+date.getHours()).slice(-2)+':'+('0'+date.getMinutes()).slice(-2)+') ';
              _.each(app.users.models, function (user) {
                if (user.get('url') === message.get('owner')) {
                  text += '<strong>'+user.get('username')+'</strong>: ';
                }
              });
              text += message.get('text');
              message.set('full_text', text);
            });
            return {item: this.item, messages: app.messages, users: app.users, i18n: app.session.get('i18n')};
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
    app.views.NewUserView = NewUserView;
    app.views.EditView = EditView;
    app.views.AboutView = AboutView;
    app.views.FooterView = FooterView;
    app.views.PasswordView = ResetPasswordView;
    app.views.SecondView = SecondView;
})(jQuery, Backbone, _, app);
