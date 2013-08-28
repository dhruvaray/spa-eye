define([
    "firebug/lib/http",
    "firebug/lib/locale"
], function (Http, Locale) {
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
        }
    };
});
