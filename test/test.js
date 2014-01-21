asyncTest("load simple package without dependencies", function() {
    expect(1);

    install("simple", function(require) {
        var gogogo = require("simple");

        ok(gogogo() === "I'm AI'm B");
        start();
    });


});


asyncTest("load package with dependencies", function() {
    expect(1);

    install("multi-module", function(require) {
        var gogogo = require("multi-module");

        ok(gogogo() === "a module-b module");
        start();
    });


});