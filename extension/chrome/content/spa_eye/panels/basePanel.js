define([
    "firebug/firebug",
    "firebug/lib/object"
],
function (Firebug, Obj) {

    Firebug.registerStringBundle("chrome://spa_eye/locale/spa_eye.properties");
    Firebug.registerStylesheet("chrome://spa_eye/skin/spa_eye.css");
    Firebug.registerStylesheet("chrome://spa_eye/skin/models.css");

    var SPAPanel = {};

    return SPAPanel;
});
