if (window.Backbone){
    var _ModelProxy = window.Backbone.Model;
    if (_ModelProxy){
        var _ModelProxyProto = window.Backbone.Model.prototype;
        window.Backbone.Model = function(attributes,options){
            _ModelProxy.apply(this, arguments);
            window._models = window._models || [];
            window._models.push(this);
        };
        window.Backbone.Model.prototype = _ModelProxyProto;
        _.extend(window.Backbone.Model,_ModelProxy);
    };

    var _colProxy = window.Backbone.Collection;
    if (_colProxy){
        var _colProxyProto = window.Backbone.Collection.prototype;
        window.Backbone.Collection = function(attributes,options){
            _colProxy.apply(this, arguments);
            window._collections = window._collections || [];
            window._collections.push(this);
        };
        window.Backbone.Collection.prototype = _colProxyProto;
        _.extend(window.Backbone.Collection,_colProxy);
    };

    var _viewProxy = window.Backbone.View;
    if (_viewProxy){
        var _viewProxyProto = window.Backbone.View.prototype;
        window.Backbone.View = function(attributes,options){
            _viewProxy.apply(this, arguments);
            window._views = window._views || [];
            window._views.push(this);
        };
        window.Backbone.View.prototype = _viewProxyProto;
        _.extend(window.Backbone.View,_viewProxy);

    };

};
