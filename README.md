BPM
===

A javascript package manager that work in the browser, but is compatible with [npm](https://npmjs.org/)

See more info on [web site](http://parroit.github.io/bpm/)


Status
======

Just a proof of concept by now, but, it work!
Look a sample working on
[this example page](http://parroit.github.io/bpm/test/examples/awesome-test/).

This sample page work on last chrome version. Actually it is a blank page, but you
can see messages on debug console...

Here is wat it test:

    bpm.useRepository("http://parroit.github.io/bpm/repo/");

    bpm.createEmptyRepo(function(){

        //testami ver. 0 will check if two independent version
        //of same module could coesist. module testami
        //ver. 0.0.0 depend on modules test and baz.
        //they in turn depend on different version of module foo.

        //if the test pass, they should display two different
        //alerts
        bpm.install("testami","0.0.0",function(require) {

            var testModule = require("testami");

            testModule.run();
        });

        //testami ver. 0 will check if it's possible for
        //main module of package to call internal submodule.
        //testami ver. 1 contains main module and logger module.

        //main module just require logger module
        //and, if test succeed it display an alert.
        bpm.install("testami","0.0.1",function(require) {

            var testModule = require("testami");

            testModule.run();
        });

    });




We just started, please hold on!

If you like the idea, [please star the project](https://github.com/parroit/bpm/star)
to keep me going on...



