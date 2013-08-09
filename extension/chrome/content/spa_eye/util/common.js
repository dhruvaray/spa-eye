define([

], function () {
    return {
        Operation:{
            SAVE:"save", FETCH:"fetch", SET:"set", VIEW:"render", ADD:"add",
            REMOVE:"remove", RESET:"reset", SORT:"sort", DESTROY:"destroy", SYNC:"sync"
        },
        OperationClass:{
            "render":"row-info",
            "destroy":"row-error",
            "remove":"row-error",
            "sync":"row-success"
        }
    };
});
