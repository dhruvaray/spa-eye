define([
    "firebug/lib/http"
], function (Http) {
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
            var version = '';
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
