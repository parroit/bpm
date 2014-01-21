(function() {
    var modules = {};

    function unzipEntries(entries, cb) {
        var remaining = entries.length;

        function cbOnComplete() {
            remaining--;
            if (remaining === 0) {
                cb();
            }
        }

        entries.forEach(function(entry) {
            if (entry.directory) {
                cbOnComplete();
            } else {
                entry.getData(
                    new zip.TextWriter(),
                    function(text) {
                        localStorage.setItem(entry.filename, text);
                        cbOnComplete();
                    }
                );

            }
        });
    }

    function unzip(blob, cb) {

        zip.createReader(new zip.BlobReader(blob), function(reader) {

            // get all entries from the zip
            reader.getEntries(function(entries) {

                unzipEntries(entries, function() {
                    // close the zip reader
                    reader.close(function() {
                        cb(window._require);
                    });
                });


            });
        }, function(error) {
            console.log(error);
        });
    }

    window.define = function(moduleName, __dirname, moduleWrapper) {
        var module = {
            exports: {},
            name: moduleName
        },
            exports = module.exports,
            __filename;

        moduleWrapper(module, exports, __dirname, __filename);

        modules[moduleName] = module.exports;

    };


    window.install = function(moduleName, cb) {

        var count = 3;


        var xhr = new XMLHttpRequest();
        xhr.onreadystatechange = function() {
            if (this.readyState == 4 && this.status == 200) {
                //this.response is what you're looking for
                unzip(this.response, cb);

            }
        };

        xhr.open("GET", moduleName + ".zip");
        xhr.responseType = "blob";
        xhr.send();


    };


    window._require = function(moduleName, __dirname) {


        if (moduleName in modules) {
            return modules[moduleName];
        } else {

            var filename, dir;
            if (moduleName.charAt(0) === ".") {
                filename = __dirname + "/" + moduleName.substring(2) + ".js";
                dir = __dirname;
            } else {
                var packageContent = localStorage.getItem(moduleName + "/package.json"),
                    pkg = JSON.parse(packageContent);


                filename = moduleName + "/" + pkg.main + ".js";
                dir = moduleName;
            }
            var i=0,
                l=500,
                tabs="";

            for (; i<l; i++){
                tabs+="\t";
            }

            var moduleSource = localStorage.getItem(filename),
                
                line = 0,
                wrapped =
                    tabs+"define('" + moduleName + "','" + dir + "',function(module,exports,__dirname, __filename) {" +
                    "function require(moduleName){" +
                    " return _require(moduleName,__dirname);" +
                    " }\n" +
                    moduleSource+ "\n" +
                    tabs+"});\n" +
                    tabs+"//@ sourceURL=" + filename ;

            eval(wrapped); // jshint ignore:line

            return modules[moduleName];
        }

    };

})();