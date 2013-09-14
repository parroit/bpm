exports.runTest = function(){
	var testModule = require("test");
    return testModule.doLog();

}

exports.runBaz = function(){
    var bazModule = require("baz");
    return bazModule.doLog();
}