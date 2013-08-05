if (window.Backbone) {
    window.spa_eye = {};
    window.spa_eye.sequence = {};
    window.spa_eye.path = [];
    var _ModelProxy = window.Backbone.Model;
    if (_ModelProxy) {
        var _ModelProxyProto = window.Backbone.Model.prototype;
        window.Backbone.Model = function (attributes, options) {
            window.spa_eye.models = window.spa_eye.models || [];
            window.spa_eye.models.push(this);
            _ModelProxy.apply(this, arguments);
        };
        window.Backbone.Model.prototype = _ModelProxyProto;
        _.extend(window.Backbone.Model, _ModelProxy);
    }
    ;

    var _colProxy = window.Backbone.Collection;
    if (_colProxy) {
        var _colProxyProto = window.Backbone.Collection.prototype;
        window.Backbone.Collection = function (attributes, options) {
            this.cid = this.cid || window._.uniqueId('c')
            window.spa_eye.collections = window.spa_eye.collections || [];
            window.spa_eye.collections.push(this);
            _colProxy.apply(this, arguments);
        };
        window.Backbone.Collection.prototype = _colProxyProto;
        _.extend(window.Backbone.Collection, _colProxy);
    }
    ;

    var _viewProxy = window.Backbone.View;
    if (_viewProxy) {
        var _viewProxyProto = window.Backbone.View.prototype;
        window.Backbone.View = function (attributes, options) {
            var renderProxy = this.render;
            var removeProxy = this.remove;
            this.render = function () {
                window.spa_eye.cv = this;
                this.inferredTemplates = this.inferredTemplates || [];
                window.spa_eye.path.push(this);
                var result = renderProxy.apply(this, arguments);
                window.spa_eye.path.pop();
                window.spa_eye.cv = undefined;
                return result;
            };

            this.remove = function () {
                this.mfd = true;
                return removeProxy.apply(this, arguments);
            };

            window.spa_eye.views = window.spa_eye.views || [];
            window.spa_eye.views.push(this);

            _viewProxy.apply(this, arguments);

        };
        window.Backbone.View.prototype = _viewProxyProto;
        _.extend(window.Backbone.View, _viewProxy);

    }
    ;
}
;
