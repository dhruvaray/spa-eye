define([
    "firebug/firebug",
    "firebug/lib/object",
    "firebug/lib/trace",
    "firebug/lib/locale",
    "firebug/lib/domplate",
    "firebug/lib/dom",
    "firebug/lib/css",
    "firebug/lib/events",
    "firebug/lib/string",

    "spa_eye/lib/require/underscore"
],
function (Firebug, Obj, FBTrace, Locale, Domplate, Dom, Css, Events,  Str, _) {
    var Notification = function (parent, options) {
        this.parent = parent;
        this.doc = this.parent.ownerDocument;

        // Options
        options || (options = {});
        this.text = options.text || Locale.$STR("spa_eye.loading");
        this.type = options.type || Notification.INFO;
        if (typeof options.autoRemove === 'undefined') {
            options.autoRemove = true;
        }
        this.autoRemove = !!options.autoRemove;
        this.replace = !!options.replace;
        this.timeout = options.timeout || 5000;

        // Initialize
        this.initialize();
    }

    Notification.INFO = 'row-info';
    Notification.ERROR = 'row-error';
    Notification.WARNING = 'row-warning';

    Notification.prototype = {
        constructor:Notification,
        initialize:function () {
            this.element = this.doc.createElement('div');
            this.element.innerHTML = Str.escapeForTextNode(this.text);
            Css.setClass(this.element, 'notification');
            Css.setClass(this.element, this.type);

            // Set attributes
            this.element.domObject = this;

            var fc = this.parent.firstChild;
            if (fc && Css.hasClass(fc, 'notification')) {
                var oldNotification = fc.domObject;
                if (oldNotification) {
                    oldNotification.destroy();
                } else {
                    fc.remove();
                }
                fc = this.parent.firstChild;
            }

            if (this.replace) {
                this.parent.innerHTML = null;
                this.parent.appendChild(this.element);
            } else if (fc) {
                this.parent.insertBefore(this.element, fc);
            } else {
                this.parent.appendChild(this.element);
            }

            this.onClick = this.onClick.bind(this);
            this.element.addEventListener('click', this.onClick);

            if (this.autoRemove) {
                this.timeoutId = setTimeout(function(nObj){
                    nObj.destroy();
                }, this.timeout, this);
            }
        },
        onClick:function () {
            this.destroy();
        },
        destroy:function () {
            this.timeoutId && clearTimeout(this.timeoutId);
            this.element.removeEventListener('click', this.onClick);
            this.element.remove();
        }
    }

    return Notification;
});
