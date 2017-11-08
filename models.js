(function ($, Backbone, _, app) {
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

    var Session = Backbone.Model.extend({
        defaults: {
            item: null
        }
    });

    app.session = new Session();

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
          return ('0'+date.getDate()).slice(-2)+'-'+('0'+(date.getMonth()+1)).slice(-2)+'-'+date.getFullYear()+' ('+('0'+date.getHours()).slice(-2)+':'+('0'+date.getMinutes()).slice(-2)+')';
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
})(jQuery, Backbone, _, app);
