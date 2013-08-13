define([
    "firebug/lib/trace"
],
function (FBTrace) {
    if (/^1\.12/.test(Firebug.version)) {
        try{
            return require("firebug/dom/domReps");
        } catch(e) {
            FBTrace.sysout("spa_eye; DomReps load error", e);
        };
    }
    return {
        DirTablePlate: Firebug.DOMPanel.DirTable
    }
});
