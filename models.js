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
        urlRoot: '/api/users',
        idAttributemodel: 'username'
    });

    app.models.i18n = BaseModel.extend({
        defaults: {
          nl: {
            'a marketplace for refugees and neighbours': 'een marketplaats voor vluchetellingen en buurbewoners',
            'Refugive.com is a website created and used by the people from the neighbourhood.': 'Refugive.com is een website die gemaakt en gebruikt door de buurbewoners.',
            'This site is created to match the wishes of refugees to the openheartness from the locals.': 'Deze website is gemaakt om de wensen van de vluchetellingen te passen bij de openhartigheid van de buurbewoners.',
            'You may found clothes, books, games etc.': 'Jij kan kleren, boeken, speltjes etc vinden.',
            'For examples: how about cooking a meal or doing sports together?': 'Bijvoorbeelden: hoe is het om een maaltijd te komen of samen sport gaan doen?',
            'Do you need something (as a refugee) or you have clothes spare (as a local)?': 'Heb je iets nodig (als een vluchetelling) of heb je kleren te veel (als een buurbewoner)?',
            'Take a look on Refugive.com and meet your new neighbours from there!': 'Nemen een kijk op Refugive.com en ontmoeten jouw nieuwe buren!',
            'If you are a refugee, then it is for you free to advertise your needs and wishes on it.': 'Als je een vluchetelling ben, dan is het voor jou gratis om een advertentie te plaatsen voor wat je nodig hebt en wat je wenst.',
            'It is also free for the locals, but offers should be made within a walking distance from the refugee center.': 'Het is ook gratis voor buurbewoners, maar de aanbod moet binnen de loop afstand vanaf de asielzoek center zijn.',
            'No money should be traded for exhange the goods.': 'Er mag geen geld worden gehandeld voor goederen.',
            'Refugive.com was started by a group of people in Bezuidenhout (The Hague) in order to help refugees from their neighbourhood.': 'Refugive.com is gestart bij een groep mensen uit Bezuidenhout (Den Haag) om de vluchetellingen te helpen in zijn buurt.',
            'Refugive.com is a non-profit website.': 'Refugive.com is een non-profit website.',
            'Best regards,': 'Met vriendelijke groeten,',
            'and': 'en',
            'Add An Item': 'Een Advertentie Toevoegen',
            'Category': 'Categorie',
            'Books': 'Boeken',
            'Others': 'Anders',
            'Toys': 'Speelgoeds',
            'Activities': 'Activiteits',
            'Clothes': 'Kleren',
            'Password': 'Wachtwoord',
            'Submit': 'Verzenden',
            'I lost my password': 'Wachtwoord vergeten',
            'Home': 'Hoofdpagina',
            'Settings': 'Instellingen',
            'Help': 'Hulp',
            'Logout': 'Uitloggen',
            'Login': 'Inloggen',
            'Register': 'Registeren',
            'Q & A': 'Vraag en Antwoord',
            'Username': 'Gebruiksnaam',
            'Group': 'Groep',
            'Save': 'Opslagen',
            'What is Refugive.com and how does it work?': 'Wat is Refugive.com en hoe werkt het?',
            'About us': 'Over ons',
            'Tips, suggestions, complaints or questions?': 'Tips, suggesties, klachten of vragen?',
            'Please': 'Alstublieft',
            'give us feedback': 'geef ons uw feedback',
            'Title': 'Titel',
            'Description': 'Beschrijving',
            'Picture': 'Foto',
            'Cancel': 'Annuleren',
            'Create': 'Toevoegen',
            'Offered by': 'Aangeboden door',
            'since': 'sinds',
            'Reply': 'Reageren',
            'Message': 'Bericht',
            'Local resident': 'Buurbewoner',
            'AZC resident': 'AZC bewoner',
            'How can I add an item?': 'Hoe kan ik een advertentie toevoegen?',
            'You can add an item by clicking on Add An Item button.': 'Jij moet op Een Advertentie Toevoegen knop drukken.',
            'How can I change my personal information?': 'Hoe kan ik mijn personelijk gegevens aanpassen?',
            'You can change your information by click on Settings tab.': 'Jij kan jouw gegevens aanpassen in de Instellingen tab.',
            'How can I react on an item?': 'Hoe kan ik op een advertentie reageren?',
            'You can react on an item by clicking on Reply button after clicking on the item.': 'Jij kan op een advertentie reageren door op de Reageren knop te drukken na dat je die advertentie hebt gekozen.'
          }
        },
        getLanguage: function () {
            return 'nl';
            var lang;
            if (navigator.language) {
                lang = navigator.language;
            } else if (navigator.userLanguage) {
                lang = navigator.userLanguage;
            }
            if (lang && lang.length > 2) {
               lang = lang.substring(0, 2);
            }
            return lang;
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
            own_items: null,
            others_items: null,
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

    app.models.Category = BaseModel.extend({
        urlRoot: '/api/categories'
    });

    app.models.csrf_token = BaseModel.extend({
        urlRoot: '/nl/image'
    });

    app.models.Item = BaseModel.extend({
        urlRoot: '/api/items'
    });

    app.models.Group = BaseModel.extend({
        urlRoot: '/api/groups'
    });

    app.models.Dialogue = BaseModel.extend({
        urlRoot: '/api/dialogues'
    })

    app.models.Message = BaseModel.extend({
        urlRoot: '/api/messages'
    })

    app.collections.ready = $.getJSON(app.apiRoot);
    app.collections.ready.done(function (data) {
        app.collections.Dialogues = Backbone.Collection.extend({
            model: app.models.Dialogue,
            url: '/api/dialogues'
        })
        app.dialogues = new app.collections.Dialogues();

        app.collections.Messages = Backbone.Collection.extend({
            model: app.models.Message,
            url: '/api/messages'
        })
        app.messages = new app.collections.Messages();

        app.collections.Categories = Backbone.Collection.extend({
            model: app.models.Category,
            url: '/api/categories'
        });
        app.categories = new app.collections.Categories();

        app.collections.Items = Backbone.Collection.extend({
            model: app.models.Item,
            url: '/api/items',
            comparator: function(m) {
              var date = new Date(m.get('creationdate'));
              return -date.getTime();
            }
        });
        app.items = new app.collections.Items();

        app.session.set('own_items', new app.collections.Items());
        app.session.set('others_items', new app.collections.Items());

        app.collections.Users = Backbone.Collection.extend({
            model: app.models.User,
            url: '/api/users'
        });
        app.users = new app.collections.Users();

        app.collections.Groups = Backbone.Collection.extend({
            model: app.models.Group,
            url: '/api/groups'
        });
        app.groups = new app.collections.Groups();
    });

})(jQuery, Backbone, _, app);
