if (window.Backbone) {
    window.spa_eye = {};
    window.spa_eye.sequence = {};
    window.spa_eye.path = [];
    window.spa_eye.idCounter = 0;
    window.spa_eye.templates = {};

    window.spa_eye.uniqueId = function (prefix) {
        var id = ++this.idCounter + '';
        return prefix ? prefix + id : id;
    };
    //var proxyable = [window.Backbone.Model, window.Backbone.Collection, window.Backbone.View];

    var _ModelProxy = window.Backbone.Model;
    if (_ModelProxy) {
        var _ModelProxyProto = window.Backbone.Model.prototype;
        window.Backbone.Model = function (attributes, options) {
            window.spa_eye.models = window.spa_eye.models || [];
            window.spa_eye.models.push(this);
            var result = _ModelProxy.apply(this, arguments);
            var event = new CustomEvent('Backbone_Eye:ADD', {'detail':{'type':'Model', data:this}});
            window.dispatchEvent(event);
            return result;
        };
        window.Backbone.Model.prototype = _ModelProxyProto;
        _.extend(window.Backbone.Model, _ModelProxy);
    }
    ;

    var _colProxy = window.Backbone.Collection;
    if (_colProxy) {
        var _colProxyProto = window.Backbone.Collection.prototype;
        window.Backbone.Collection = function (attributes, options) {
            this.cid = this.cid || (typeof(window._) === "undefined")
                ? window.spa_eye.uniqueId('col')
                : window._.uniqueId('col');
            window.spa_eye.collections = window.spa_eye.collections || [];
            window.spa_eye.collections.push(this);
            var result = _colProxy.apply(this, arguments);
            var event = new CustomEvent('Backbone_Eye:ADD', {'detail':{'type':'Collection', data:this}});
            window.dispatchEvent(event);
            return result;
        };
        window.Backbone.Collection.prototype = _colProxyProto;
        _.extend(window.Backbone.Collection, _colProxy);
    }
    ;

    var _viewProxy = window.Backbone.View;
    if (_viewProxy) {
        var _viewProxyProto = window.Backbone.View.prototype;
        window.Backbone.View = function (attributes, options) {
            window.spa_eye.views = window.spa_eye.views || [];
            window.spa_eye.views.push(this);
            var result = _viewProxy.apply(this, arguments);
            var event = new CustomEvent('Backbone_Eye:ADD', {'detail':{'type':'View', data:this}});
            window.dispatchEvent(event);
            return result;
        };
        window.Backbone.View.prototype = _viewProxyProto;
        _.extend(window.Backbone.View, _viewProxy);

    }
    ;
}
;
