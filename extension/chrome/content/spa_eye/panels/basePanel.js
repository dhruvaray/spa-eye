define([
    "firebug/firebug",
    "firebug/lib/object",
    "firebug/lib/trace",

    "spa_eye/lib/require/underscore",

    "spa_eye/dom/keyPanel"
],
function (Firebug, Obj, FBTrace, _, KeyPanel) {

    Firebug.registerStringBundle("chrome://spa_eye/locale/spa_eye.properties");
    Firebug.registerStylesheet("chrome://spa_eye/skin/spa_eye.css");
    Firebug.registerStylesheet("chrome://spa_eye/skin/models.css");

    var unImplementedSuper = function(method) {
        throw "Super does not implement this method: " + method;
    };

    // Extracted from Backbonejs
    //
    // Helper function to correctly set up the prototype chain, for subclasses.
    // Similar to `goog.inherits`, but uses a hash of prototype properties and
    // class properties to be extended.
    var extend = function(protoProps, staticProps) {
        var parent = this,
            _super = parent.prototype,
            child,
            fnTest = /xyz/.test(function(){xyz;}) ? /\b_super\b/ : /.*/;

        // The constructor function for the new subclass is either defined by you
        // (the "constructor" property in your `extend` definition), or defaulted
        // by us to simply call the parent's constructor.
        if (protoProps && _.has(protoProps, 'constructor')) {
            child = protoProps.constructor;
        } else {
            child = function(){
                return parent.apply(this, arguments);
            };
        }

        // Add static properties to the constructor function, if supplied.
        _.extend(child, parent, staticProps);

        // Set the prototype chain to inherit from `parent`, without calling
        // `parent`'s constructor function.
        var Surrogate = function(){
            this.constructor = child;
        };
        Surrogate.prototype = parent.prototype;
        child.prototype = new Surrogate;

        // Add prototype properties (instance properties) to the subclass,
        // if supplied.
        if (protoProps) {
            _.extend(child.prototype, protoProps);
            for (var name in protoProps) {
                if (typeof protoProps[name] == "function" && fnTest.test(protoProps[name])) {
                    child.prototype[name] = (function(name, fn) {
                        var wrapper = function() {
                            var tmp = this._super;
                            this._super = _super[name] || unImplementedSuper(name);

                            var result;
                            try{
                                result = fn.apply(this, arguments);
                            } finally {
                                this._super = tmp;
                            }
                            return result;
                        }
                        return wrapper;
                    })(name, protoProps[name]);
                }
            }
        }

        // Set a convenience property in case the parent's prototype is needed
        // later.
        child.__super__ = parent.prototype;
        return child;
    };

    var BasePanel = function() {};
    BasePanel.extend = extend;
    BasePanel.prototype = Obj.extend(
            Firebug.Panel,
            KeyPanel,

    {
        constructor: BasePanel,

        initialize: function() {
            Firebug.Panel.initialize.apply(this, arguments);
            var listener = this.context.spa_eyeObj._spaHook.listener;
            listener.addListener(this);

            // Attach key listeners
            this.attachKeyListeners();
        },

        destroy: function () {
            try {
                // Detach key listeners
                this.detachKeyListeners();

                var listener = this.context.spa_eyeObj._spaHook.listener;
                listener.removeListener(this);
            } catch(e) {
                if (FBTrace.DBG_SPA_EYE) {
                    FBTrace.sysout("Error while removing listener", e);
                }
            } finally {
                Firebug.Panel.destroy.apply(this, arguments);
            }
        },

        isCurrentPanel: function() {
            return Firebug.currentContext.panelName === this.name;
        }
    });
    return BasePanel;
});
