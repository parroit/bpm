(function() {
    var ERR_HTTP_RANGE = "HTTP Range not supported.";

    window.zip = window.zip || {};
    window.zip.fs = window.zip.fs || {};

    window.zip.fs.initCORSProxyServer = function(allowedOrigin){


        //respond to events
        window.addEventListener('message',function(event) {
            if(event.origin !== allowedOrigin) {
                console.log("Error: message receive from unauthorized origin "+event.origin);
                return;
            }

            var msg = event.data;
            switch (msg.method){
                case "init":
                    var request = new XMLHttpRequest();
                    function onError(){
                        event.source.postMessage({
                            response:'onerror',
                            error:ERR_HTTP_RANGE,
                            id:msg.id
                        },event.origin);
                    }
                    request.addEventListener("load", function() {
                        if (request.getResponseHeader("Accept-Ranges") == "bytes"){
                            event.source.postMessage({
                                response:'callbak',
                                size:Number(request.getResponseHeader("Content-Length")),
                                id:msg.id
                            },event.origin);
                        } else {
                            onError();
                        }
                    }, false);
                    request.addEventListener("error", onError, false);
                    request.open("HEAD", msg.url);
                    request.send();
                    break;
                default:

            }



        },false);
    }
    /*
    function CORSProxy(){
        var that = this;

        function init(callback, onerror) {
            var request = new XMLHttpRequest();
            request.addEventListener("load", function() {
                that.size = Number(request.getResponseHeader("Content-Length"));
                if (request.getResponseHeader("Accept-Ranges") == "bytes")
                    callback();
                else
                    onerror(ERR_HTTP_RANGE);
            }, false);
            request.addEventListener("error", onerror, false);
            request.open("HEAD", url);
            request.send();
        }

        function readArrayBuffer(index, length, callback, onerror) {
            var request = new XMLHttpRequest();
            request.open("GET", url);
            request.responseType = "arraybuffer";
            request.setRequestHeader("Range", "bytes=" + index + "-" + (index + length - 1));
            request.addEventListener("load", function() {
                callback(request.response);
            }, false);
            request.addEventListener("error", onerror, false);
            request.send();
        }

        function readUint8Array(index, length, callback, onerror) {
            readArrayBuffer(index, length, function(arraybuffer) {
                callback(new Uint8Array(arraybuffer));
            }, onerror);
        }

        that.size = 0;
        that.init = init;
        that.readUint8Array = readUint8Array;
    }
     */
    var nextDownloadId=1;
    var currentDownloads={};

    var CORSProxyClientInitialized =false;
    function initCORSProxyClient(){
        if (CORSProxyClientInitialized ) return;
        CORSProxyClientInitialized = true;
        window.addEventListener('message',function(event) {
            if(
                !event.data.id ||
                !currentDownloads[event.data.id] ||
                event.origin !== currentDownloads[event.data.id].foreignSiteProxyURL.substring(0,event.origin.length)
                ) {
                console.log("Error: message receive from unauthorized origin "+event.origin);
                return false;
            }

            console.log('response received:  ' + JSON.stringify(event.data));
            event.preventDefault();
            event.stopPropagation();
            return false;

        },false);

    }

    function HttpRangeReaderCORS(foreignSiteProxyURL,url) {
        initCORSProxyClient();

        var self = this;
        function init(callback, onerror) {

            if (!document.getElementById("cors-proxy-server")){
                var frame = document.createElement("iframe");
                frame.setAttribute("src",foreignSiteProxyURL);
                frame.setAttribute("id","cors-proxy-server");
                frame.setAttribute("style","display:none");
                document.body.appendChild(frame);
                frame.addEventListener('load',function(){
                    self.corsProxyServer = frame.contentWindow;
                });

            }

            function initDownloadInstance(){
                var downloadInstance = {
                    method: "init",
                    url: url,
                    id: nextDownloadId,
                    foreignSiteProxyURL:foreignSiteProxyURL
                };
                currentDownloads[nextDownloadId] = downloadInstance;
                nextDownloadId++;
                self.corsProxyServer.postMessage(downloadInstance, foreignSiteProxyURL);
                downloadInstance.callback = callback;
                downloadInstance.onerror = onerror;

            }

            if (this.corsProxyServer){
                initDownloadInstance();
            } else {
                setTimeout(function(){
                    self.init(callback,onerror);
                },0);
            }

        }


        function readUint8Array(index, length, callback, onerror) {

        }

        this.size = 0;
        this.init = init;
        this.readUint8Array = readUint8Array;

    }
    HttpRangeReaderCORS.prototype = new zip.Reader();
    HttpRangeReaderCORS.prototype.constructor = HttpRangeReaderCORS;

    zip.fs.ZipDirectoryEntry.prototype.importHttpContentCORS = function(foreignSiteProxyURL,foreignSiteURL,  onend, onerror) {
        this.importZip(new HttpRangeReaderCORS(foreignSiteProxyURL,foreignSiteURL), onend, onerror);
    };

    zip.fs.FS.prototype.importHttpContentCORS = function(foreignSiteProxyURL,foreignSiteURL, useRangeHeader, onend, onerror) {
        this.entries = [];
        this.root = new zip.fs.ZipDirectoryEntry(this);
        this.root.importHttpContentCORS(foreignSiteProxyURL,foreignSiteURL, useRangeHeader, onend, onerror);
    };



})();
