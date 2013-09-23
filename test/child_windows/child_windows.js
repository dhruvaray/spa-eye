function runTest() {
    FBTest.sysout("Child Windows");
    FBTest.openFirebug();
    FBTest.enableAllPanels();

    FBTest.openNewTab(basePath + "/child_windows/child_windows.html", function(win) {
        var node = FBTest.selectPanel("spa_eye").panelNode;
        var config = {tagName: "tr", classes: "memberRow 0level c1"};

        FBTest.waitForDisplayedElement("spa_eye", config, function(row) {
            FBTest.ok(row.domObject.value.cid === "c1", "Found the model");
            FBTest.testDone("Backbone found in child windows");
        });

        FBTest.click(win.frames[0].frames[0].document.getElementById("createModelButton"));

    });
}
