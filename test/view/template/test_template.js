function createDynamicDom(win) {
    var doc = win.document;

    FBTest.ok(true, "Created Backbone View");
    var spa_eyePanel = FBTest.getPanel("spa-eye");
    FBTest.clickToolbarButton(null, "spa_eye_panel_button_view");

    FBTest.click(doc.getElementById("createViewButton"));
    var questionDiv = doc.getElementById('questions-div');
    FBTest.ok(questionDiv.getElementsByTagName('li').length === 1,"Found li element in document as expected");
    FBTest.testDone("View:Underscore.Template.DONE");
}

function runTest() {
    FBTest.sysout("View: Underscore Template");
    FBTest.openNewTab(basePath + "view/template/test_template.html", function(win) {
        FBTest.openFirebug();
        FBTest.enableAllPanels();
        FBTest.selectPanel("spa_eye");
        FBTest.reload(createDynamicDom);
    });
}
