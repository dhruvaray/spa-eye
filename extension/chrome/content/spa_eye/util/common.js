define([

], function () {
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
        }
    };
});
