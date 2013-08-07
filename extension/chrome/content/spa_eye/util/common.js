define([

], function () {
    return {
        Operation:{
            SAVE:"save", FETCH:"fetch", SET:"set", VIEW:"render", ADD:"add",
            REMOVE:"remove", RESET:"reset", SORT:"sort", DESTROY:"destroy"
        },
        OperationClass:{
            "render":"row-info",
            "destroy":"row-error",
            "remove":"row-error"
        }
    };
});
