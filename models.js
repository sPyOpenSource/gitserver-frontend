(function ($, Backbone, _, app) {

    // CSRF helper functions taken directly from Django docs
    function csrfSafeMethod(method) {
        // these HTTP methods do not require CSRF protection
        return (/^(GET|HEAD|OPTIONS|TRACE)$/i.test(method));
    }

    function getCookie(name) {
        var cookieValue = null;
        if (document.cookie && document.cookie != '') {
            var cookies = document.cookie.split(';');
            for (var i = 0; i < cookies.length; i++) {
                var cookie = $.trim(cookies[i]);
                // Does this cookie string begin with the name we want?
                if (cookie.substring(0, name.length + 1) == (name + '=')) {
                    cookieValue = decodeURIComponent(
                    cookie.substring(name.length + 1));
                    break;
                }
            }
        }
        return cookieValue;
    }

    // Setup jQuery ajax calls to handle CSRF
    $.ajaxPrefilter(function (settings, originalOptions, xhr) {
        var csrftoken;
        if (!csrfSafeMethod(settings.type) && !this.crossDomain) {
            // Send the token to same-origin, relative URLs only.
            // Send the token only if the method warrants CSRF protection
            // Using the CSRFToken value acquired earlier
            csrftoken = getCookie('csrftoken');
            xhr.setRequestHeader('X-CSRFToken', csrftoken);
        }
    });

    var BaseModel = Backbone.Model.extend({
        url: function () {
            var links = this.get('links'),
                url = links && links.self;
            if (!url) {
                url = Backbone.Model.prototype.url.call(this);
            }
            return url;
        }
    });

    app.models.User = BaseModel.extend({
        urlRoot: '/api/users'
    });

    app.models.i18n = BaseModel.extend({
        getLanguage: function () {
          return 'en';
            var lang = localStorage.language;
            if(lang){
              return lang;
            } else {
              return 'nl';
            }
        },
        setLanguage: function(language) {
          localStorage.language = language;
        },
        T: function (text) {
          var translation = this.get(this.getLanguage());
          if (translation && text in translation){
            return translation[text];
          } else {
            return text;
          }
        }
    });

    var Session = Backbone.Model.extend({
        defaults: {
            token: null,
            user: null,
            item: null,
            i18n: null
        },
        initialize: function (options) {
            this.options = options;
            $.ajaxPrefilter($.proxy(this._setupAuth, this));
            this.load();
            this.set('i18n', new app.models.i18n());
        },
        load: function () {
            var token = localStorage.apiToken;
            if (token) {
                this.set('token', token);
                this.set('user', this.parseJWT(token));
            }
        },
        parseJWT: function (token) {
            var base64Url = token.split('.')[1];
            var base64 = base64Url.replace('-', '+').replace('_', '/');
            var payload = JSON.parse(window.atob(base64));
            return new app.models.User({id: payload.user_id, exp: payload.exp});
        },
        save: function (token) {
            this.set('token', token);
            if (token === null) {
                localStorage.removeItem('apiToken');
            } else {
                this.set('user', this.parseJWT(token));
                localStorage.apiToken = token;
            }
        },
        delete: function () {
            this.save(null);
        },
        authenticated: function () {
            if (this.get('token') === null || this.get('user') === null){
              return false;
            }
            if (this.get('user').toJSON().exp*1000 < + new Date()){
              return false;
            }
            return true;
        },
        _setupAuth: function (settings, originalOptions, xhr) {
            if (this.authenticated()) {
                xhr.setRequestHeader(
                    'Authorization',
                    'JWT ' + this.get('token')
                );
            }
        }
    });

    app.session = new Session();

    app.models.csrf_token = BaseModel.extend({
        urlRoot: '/api/csrf_token'
    });

    app.models.Item = BaseModel.extend({
        urlRoot: '/api/items',
        getDate: function() {
          var date = new Date(this.get('creationdate'));
          return ('0'+date.getDate()).slice(-2)+'-'+('0'+(date.getMonth()+1)).slice(-2)+'-'+date.getFullYear();
        }
    });

    app.models.Message = BaseModel.extend({
        urlRoot: '/api/messages',
        getDatetime: function() {
          var date = new Date(this.get('creationdate'));
          return ('0'+date.getDate()).slice(-2)+'-'+('0'+(date.getMonth()+1)).slice(-2)+'-'+date.getFullYear()+' '+('0'+date.getHours()).slice(-2)+':'+('0'+date.getMinutes()).slice(-2);
        }
    })

    app.collections.Messages = Backbone.Collection.extend({
        model: app.models.Message,
        url: '/api/messages'
    })
    app.messages = new app.collections.Messages();

    app.collections.Items = Backbone.Collection.extend({
        model: app.models.Item,
        url: '/api/items',
        comparator: function(itemA, itemB) {
          if (itemA.get('title') > itemB.get('title')) return 1;
          if (itemB.get('title') > itemA.get('title')) return -1;
          return 0; // equal
        }
    });
    app.items = new app.collections.Items();

    app.collections.Users = Backbone.Collection.extend({
        model: app.models.User,
        url: '/api/users'
    });
    app.users = new app.collections.Users();
})(jQuery, Backbone, _, app);
