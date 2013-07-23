if (window.Backbone) {
    window.spa_eye = {};
    window.spa_eye.sequence = {};
    var _ModelProxy = window.Backbone.Model;
    if (_ModelProxy) {
        var _ModelProxyProto = window.Backbone.Model.prototype;
        window.Backbone.Model = function (attributes, options) {
            _ModelProxy.apply(this, arguments);
            window.spa_eye.models = window.spa_eye.models || [];
            window.spa_eye.models.push(this);
        };
        window.Backbone.Model.prototype = _ModelProxyProto;
        _.extend(window.Backbone.Model, _ModelProxy);
    };

    var _colProxy = window.Backbone.Collection;
    if (_colProxy) {
        var _colProxyProto = window.Backbone.Collection.prototype;
        window.Backbone.Collection = function (attributes, options) {
            _colProxy.apply(this, arguments);
            this.cid = this.cid || window._.uniqueId('c')
            window.spa_eye.collections = window.spa_eye.collections || [];
            window.spa_eye.collections.push(this);
        };
        window.Backbone.Collection.prototype = _colProxyProto;
        _.extend(window.Backbone.Collection, _colProxy);
    };

    var _viewProxy = window.Backbone.View;
    if (_viewProxy) {
        var _viewProxyProto = window.Backbone.View.prototype;
        window.Backbone.View = function (attributes, options) {
            var renderProxy = this.render;
            this.render = function () {
                window.spa_eye.cv = this;
                this.inferredTemplates = this.inferredTemplates || [];
                var result = renderProxy.apply(this, arguments);
                window.spa_eye.cv = undefined;
                return result;
            };

            window.spa_eye.views = window.spa_eye.views || [];
            window.spa_eye.views.push(this);

            _viewProxy.apply(this, arguments);

        };
        window.Backbone.View.prototype = _viewProxyProto;
        _.extend(window.Backbone.View, _viewProxy);

    } ;
};
