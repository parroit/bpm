asyncTest("load simple package without dependencies", function() {
    expect(1);

    install("test", function(require) {
        var gogogo = require("test");

        ok(gogogo() === "I'm AI'm B");
        start();
    });


});