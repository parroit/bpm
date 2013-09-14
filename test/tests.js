
asyncTest("two independent version of same module could coesist", function() {


    bpm.useRepository("http://localhost:8080/test-repo/");

    bpm.createEmptyRepo(function(){


        //ver. 0.0.0 of testami depend on modules test and baz.
        //they in turn depend on different version of module foo.

        bpm.install("testami","0.0.0",function(require) {

            var testModule = require("testami");

            var runTest = testModule.runTest();
            ok( runTest == "ciao -> foo 1.0.0", "Expected ciao -> foo 1.0.0, was "+ runTest );
            var runBaz = testModule.runBaz();
            ok( runBaz == "ciao -> foo 2.0.0", "Expected ciao -> foo 2.0.0, was " +runBaz );


            start();
        });
    });


});

asyncTest("it's possible for main module of package to call internal submodule", function() {


    bpm.useRepository("http://localhost:8080/test-repo/");

    bpm.createEmptyRepo(function(){


        //testami ver. 1 contains main module and logger module

        bpm.install("testami","0.0.1",function(require) {

            var testModule = require("testami");

            var run = testModule.run();
            ok( run == "I am a logger", "Expected I am a logger, was " +run );
            start();
        });

    });
});

