define("localFs","core",function(module,exports) {

	exports.saveFile = function(path,content){
		localStorage.setItem(path,content);
		
	};

	exports.loadFile = function(path){
		return localStorage.getItem(path);
		
	};


});