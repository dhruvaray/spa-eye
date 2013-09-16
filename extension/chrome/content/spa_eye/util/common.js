define([
    "firebug/lib/http",
    "firebug/lib/locale",

    "spa_eye/lib/require/underscore"
], function (Http, Locale, _) {
    return {
        Operation:{
            SAVE:"save", FETCH:"fetch", SET:"set", UNSET:"unset", CLEAR:"clear", RENDER:"render", ADD:"add",
            REMOVE:"remove", RESET:"reset", SORT:"sort", DESTROY:"destroy", SYNC:"sync", CREATE:"create"
        },
        OperationClass:{
            "render":"row-info",
            "destroy":"row-error",
            "remove":"row-error",
            "sync":"row-success"
        },
        EntityType:{
            Model:"Model", View:"View", Collection:"Collection"
        },
        getVersion:function (versionURL) {
            var version = Locale.$STR("spa_eye.version.custom");
            var content = Http.getResource(versionURL);
            if (content) {
                var m = /VERSION=(.*)/.exec(content);
                if (m) {
                    version = m[1];
                }
            }
            return version;
        },
        // Extended version of _.result
        //
        // If the value of the named `key` is a function then invoke it with the
        // `object` as context; otherwise, return it.
        result: function(object, key) {
            if (object == null) return void 0;
            var value = object[key],
                args = Array.prototype.slice.call(arguments, 2);
            return _.isFunction(value) ? value.apply(object, args) : value;
        }
    };
});
