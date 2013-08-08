if (window.Backbone) {
    window.spa_eye = {};
    window.spa_eye.sequence = {};
    window.spa_eye.path = [];
    window.spa_eye.idCounter = 0;
    window.spa_eye.uniqueId = function (prefix) {
        var id = ++this.idCounter + '';
        return prefix ? prefix + id : id;
    };
    var _ModelProxy = window.Backbone.Model;
    if (_ModelProxy) {
        var _ModelProxyProto = window.Backbone.Model.prototype;
        window.Backbone.Model = function (attributes, options) {
            try {
                window.spa_eye.models = window.spa_eye.models || [];
                window.spa_eye.models.push(this);
            } catch (e) {
            } finally {
                _ModelProxy.apply(this, arguments);
            }
        };
        window.Backbone.Model.prototype = _ModelProxyProto;
        _.extend(window.Backbone.Model, _ModelProxy);
    }
    ;

    var _colProxy = window.Backbone.Collection;
    if (_colProxy) {
        var _colProxyProto = window.Backbone.Collection.prototype;
        window.Backbone.Collection = function (attributes, options) {
            try {
                this.cid = this.cid || (typeof(window._) === "undefined")
                    ? window.spa_eye.uniqueId('col')
                    : window._.uniqueId('col');
                window.spa_eye.collections = window.spa_eye.collections || [];
                window.spa_eye.collections.push(this);
            } catch (e) {
            } finally {
                _colProxy.apply(this, arguments);
            }
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
            try {
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
                    var result = removeProxy.apply(this, arguments);
                    this.mfd = true;
                    var event = new CustomEvent('SPA_Eye:View.Remove', {'view':this});
                    window.dispatchEvent(event);
                    return result;
                };

                window.spa_eye.views = window.spa_eye.views || [];
                window.spa_eye.views.push(this);
            } catch (e) {
            } finally {
                _viewProxy.apply(this, arguments);
            }
        };
        window.Backbone.View.prototype = _viewProxyProto;
        _.extend(window.Backbone.View, _viewProxy);

    }
    ;
}
;
