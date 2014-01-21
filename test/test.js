asyncTest("load simple package without dependencies", function() {
    expect(1);

    install("simple", function(require) {
        var gogogo = require("simple");

        ok(gogogo() === "I'm AI'm B");
        start();
    });


});