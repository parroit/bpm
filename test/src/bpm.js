var bpm = (function () {


    function FSManager() {
        var fs = null;
        var requestFileSystem = window.requestFileSystem ||
            window.webkitRequestFileSystem;
        var storageInfo = navigator.persistentStorage ||
            navigator.webkitPersistentStorage;

        storageInfo.requestQuota(

            1024 * 1024 * 200,
            function (grantedBytes) {

                requestFileSystem(PERSISTENT, grantedBytes, onInitFs, errorHandler);
            },
            function (e) {

                console.log('Error', e);
            }
        );


        function onInitFs(requestedFs) {
            fs = requestedFs;
            console.log('Opened file system: ' + fs.name);
        }


        this.directoryExists = function (path, callback) {
            fs.root.getDirectory(path, {create: false}, function () {
                callback(true);
            }, function () {
                callback(false);
            });
        };

        function createDirectories(folders, callback, parentDirectory) {
            parentDirectory = parentDirectory || fs.root;
            parentDirectory.getDirectory(folders[0], {create: true}, function (dirEntry) {
                if (folders.length) {
                    createDirectories(folders.slice(1), callback, dirEntry);
                } else {
                    callback(dirEntry);
                }
            }, errorHandler);
        }

        this.whenReady = function (onReady, retryCount) {

            if (fs == null) {
                retryCount |= 0;


                if (retryCount < 60) {
                    console.log("localfilesystem not ready. retry in " + retryCount + " seconds.");
                    var self = this;
                    setTimeout(function () {
                        self.whenReady(onReady, (retryCount + 1) * 2)

                    }, retryCount * 1000);
                } else {
                    console.log("ERROR: could not allocate localfilesystem.");
                }

                return false;
            }

            onReady();
            return true;
        };

        this.clearRepository = function (whenRepoCleared) {
            fs.root.getDirectory("repository", {create: true}, function (dirEntry) {
                dirEntry.removeRecursively(
                    function () {
                        whenRepoCleared();
                    },
                    errorHandler
                );
            });

        };

        this.readPackageDescriptor = function (packageName, packageVersion, whenPackageReaded) {
            var filePath = ['repository', packageName, packageVersion, "package.json"].join("/");
            fs.root.getFile(filePath, {create: false}, function (fileEntry) {
                fileEntry.file(function (file) {
                    var reader = new FileReader();

                    reader.onloadend = function () {
                        whenPackageReaded(JSON.parse(this.result.toString()));

                    };

                    reader.readAsText(file);

                }, errorHandler);
            }, errorHandler);
        };

        this.downloadPackageToLocalFS = function (baseRepoUrl, packageName, packageVersion, whenPackageSaved) {


            var filePath = ['repository', packageName, packageVersion];

            createDirectories(filePath, function (dirEntry) {


                var url = baseRepoUrl + packageName + "/" + packageVersion + "/package.zip";


                zip.workerScriptsPath = "/test/src/zip.js/";


                var zipFs = new zip.fs.FS();
                zipFs.importHttpContent(
                    url,
                    "useRangeHeader" == true,
                    function success() {

                        zipFs.root.getFileEntry(dirEntry, function () {
                            whenPackageSaved && whenPackageSaved(dirEntry);
                            console.log("Package extracted successfully.");
                        });
                    },
                    function failure(error) {
                        console.log(error);
                    }
                );
            });
        };

        function errorHandler(e) {

            for (var errCode in FileError) {
                if (
                    FileError.hasOwnProperty(errCode) &&
                        FileError[errCode] == e.code
                    ) {

                    console.log('Error: ' + errCode);
                    return;
                }
            }
        }
    }

    var fsManager = new FSManager();


    var packageRegistry = {};
    var exports = {};

    exports.isInstalled = function (packageName, packageVersion, responseCallback) {
        var rootPath = ['repository', packageName, packageVersion].join("/");
        fsManager.whenReady(function () {
            fsManager.directoryExists(rootPath, responseCallback);
        });
    };

    exports.define = function (packageInfo, packageFactory) {
        var packageName = packageInfo.name,
            packageVersion = packageInfo.version;

        packageRegistry[packageName + '/' + packageVersion].factory = packageFactory;
    };


    exports.requirePackage = function (callingPackageInfo, packageName) {

        if (packageName.substring(0, 2) == "./") {
            return requirePackageExact(
                callingPackageInfo.descriptor.name,
                callingPackageInfo.descriptor.version,
                packageName
            );

        } else {
            var packageVersion = callingPackageInfo.descriptor.dependencies[packageName];
            return requirePackageExact(packageName, packageVersion);
        }

    };


    function requirePackageExact(packageName, packageVersion, moduleName) {

        var xmlhttp = new XMLHttpRequest();
        var packageInfo =
            packageRegistry[packageName + '/' + packageVersion];
        var url;

        if (moduleName) {
            url = packageInfo.url + "/" + moduleName + ".js";
        } else {
            url = packageInfo.url + "/" + packageInfo.descriptor.main;
        }


        xmlhttp.open("GET", url, false);
        xmlhttp.send();
        var scriptContent =
            "(function(){\n" +
                "var package = " + JSON.stringify(packageInfo) + ";\n" +
                "function require(packageName) { \n" +
                "	return bpm.requirePackage(package,packageName);" +
                "}\n" +

                "bpm.define(package, function() {\n" +
                "	var exports = {};\n" +
                xmlhttp.response + "\n" +
                "	return exports;\n" +
                "});\n" +
                "})();\n";

        var head = document.getElementsByTagName('head')[0];
        var script = document.createElement('script');
        script.type = 'text/javascript';
        script.textContent = scriptContent;

        try {
            head.appendChild(script);
        } catch (err) {
            console.log("Cannot load script " +
                packageName +
                " ver. " + packageVersion +
                ", module:" + moduleName +
                "\nError: " + err
            );
        }


        return packageInfo.factory();
    }

    exports.createEmptyRepo = function (onRepoCreated) {
        fsManager.whenReady(function () {
            fsManager.clearRepository(onRepoCreated);
        });
    };
    var baseRepoUrl = "";
    exports.useRepository = function (baseRepositoryUrl) {
        baseRepoUrl = baseRepositoryUrl;
    };
    exports.install = function (packageName, packageVersion, onPackageInstalled) {
        console.log("Bpm installing " + packageName + " version " + packageVersion);
        fsManager.whenReady(function () {

            fsManager.downloadPackageToLocalFS(
                baseRepoUrl,
                packageName,
                packageVersion,
                function (packageRootEntry) {


                    console.log("Bpm has installed " + packageName + " version " + packageVersion);


                    fsManager.readPackageDescriptor(
                        packageName,
                        packageVersion,
                        function (packageDescriptor) {
                            packageRegistry[packageName + '/' + packageVersion] = {
                                url: packageRootEntry.toURL(),
                                version: packageVersion,
                                name: packageName,
                                descriptor: packageDescriptor
                            };

                            resolvePackageDependencies(packageDescriptor);
                        }
                    );
                }
            );
        });

        function resolvePackageDependencies(packageDescriptor) {

            console.log("Bpm resolving dependency for " + packageName + " version " + packageVersion);

            var dependencies = packageDescriptor.dependencies;

            var dependenciesInstalledCount = 0;
            var dependenciesRequired = 0;

            function onSuccess() {
                function require(packageName) {
                    var rootPackageInfo = {
                        descriptor: {
                            dependencies: {
                            }
                        }
                    };

                    rootPackageInfo.
                        descriptor.
                        dependencies[packageName] = packageVersion;

                    return exports.requirePackage(
                        rootPackageInfo,
                        packageName
                    );
                }

                onPackageInstalled && onPackageInstalled(require);
            }

            for (var name in dependencies) {
                if (dependencies.hasOwnProperty(name)) {
                    dependenciesRequired++;
                    var version = dependencies[name];

                    exports.install(name, version, function () {
                        dependenciesInstalledCount++;
                        //noinspection JSReferencingMutableVariableFromClosure
                        if (dependenciesInstalledCount == dependenciesRequired)
                            onSuccess();
                    });
                }

            }

            if (dependenciesRequired == 0)
                onSuccess();

        }

    };


    return exports;

})();