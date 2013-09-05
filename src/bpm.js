var bpm = (function (){
	

	function FSManager(){
		var fs = null;
		var requestFileSystem  = window.requestFileSystem ||
								 window.webkitRequestFileSystem;
		var storageInfo = navigator.persistentStorage ||
								 navigator.webkitPersistentStorage;

		storageInfo.requestQuota(
			
			1024*1024*200, 
			function(grantedBytes) {
			
				requestFileSystem(PERSISTENT, grantedBytes, onInitFs, errorHandler);
			}, 
			function(e) {
		  	
		  		console.log('Error', e);
			}
		);						 

		
		function onInitFs(requestedFs) {
		  fs = requestedFs;	
		  console.log('Opened file system: ' + fs.name);
		}


		this.directoryExists = function(path, callback) {
	        fs.root.getDirectory(path, {create : false}, function() {
	            callback(true);
	        }, function() {
	            callback(false);
	        });
	    }

		function createDirectories(folders,callback,parentDirectory) {
			parentDirectory = parentDirectory || fs.root;
			parentDirectory.getDirectory(folders[0], {create: true}, function(dirEntry) {
				if (folders.length) {
					createDirectories(folders.slice(1),callback,dirEntry);
				} else {
					callback(dirEntry);
				}
			}, errorHandler);
		};

		this.whenReady = function(onReady,retryCount){
			
			if (fs == null) {
				retryCount |= 0;

				
				if (retryCount < 60) {
					console.log("localfilesystem not ready. retry in "+retryCount+" seconds.");
					var self = this;
					setTimeout(function() {
						self.whenReady(onReady,(retryCount+1)*2)

					},retryCount*1000); 	
				} else {
					console.log("ERROR: could not allocate localfilesystem.");
				}
				
				return false;
			} 
			
			onReady();
			return true;
		}

		this.readPackageDescriptor = function(packageName,packageVersion,whenPackageReaded) {
			var filePath = ['repository',packageName,packageVersion,"package.json"].join("/");
			fs.root.getFile(filePath, {create: false}, function(fileEntry) {
				fileEntry.file( function(file) {
			       var reader = new FileReader();

			       reader.onloadend = function(e) {
			         whenPackageReaded(JSON.parse( this.result ));
			         
			       };

			       reader.readAsText(file);
			    
			    }, errorHandler);
			}, errorHandler);
		};		

		this.savePackage = function(packageName,packageVersion,whenPackageSaved) {
			
			
			var filePath = ['repository',packageName,packageVersion];

			createDirectories(filePath, function(dirEntry) {
				
				
				var url = packageName+"/"+packageVersion+"/package.zip";
				

				zip.workerScriptsPath = "zip.js/";
				 

				var zipFs = new zip.fs.FS();
				zipFs.importHttpContent(
					url,
				 	"useRangeHeader" == true, 
					function success() {
						
						zipFs.root.getFileEntry(dirEntry,function(){
							whenPackageSaved && whenPackageSaved(dirEntry);
							console.log("Package extracted successfully.");	
						});
					},
					function failure(error) {
						console.log(error);	
					}

				);

			});

			
		}

		function errorHandler(e) {
		  var msg = '';

		  switch (e.code) {
		    case FileError.QUOTA_EXCEEDED_ERR:
		      msg = 'QUOTA_EXCEEDED_ERR';
		      break;
		    case FileError.NOT_FOUND_ERR:
		      msg = 'NOT_FOUND_ERR';
		      break;
		    case FileError.SECURITY_ERR:
		      msg = 'SECURITY_ERR';
		      break;
		    case FileError.INVALID_MODIFICATION_ERR:
		      msg = 'INVALID_MODIFICATION_ERR';
		      break;
		    case FileError.INVALID_STATE_ERR:
		      msg = 'INVALID_STATE_ERR';
		      break;
		    default:
		      msg = 'Unknown Error';
		      break;
		  };

		  console.log('Error: ' + msg);
		}
	
	}
	
	var fsManager = new FSManager();

	exports = {};

	exports.isInstalled = function(packageName,packageVersion,responseCallback) {
		var rootPath = ['repository',packageName,packageVersion].join("/");
		fsManager.directoryExists(rootPath,responseCallback);
	};

	exports.install = function(packageName,packageVersion,onPackageInstalled) {
		console.log("Bpm installing " + packageName + " version " + packageVersion);
		fsManager.whenReady( function(){
			
			fsManager.savePackage(
				packageName,
				packageVersion,
				function (packageRootEntry) {
					console.log("Bpm has installed " + packageName + " version " + packageVersion);
					resolvePackageDependencies(packageRootEntry);
				}
				
			);
		});

		function resolvePackageDependencies(packageRootEntry){

			fsManager.readPackageDescriptor(
				packageName,
				packageVersion,
				function(packageDescriptor){
					console.log("Bpm resolving dependency for "+packageName + " version " + packageVersion); 
					
					var dependencies =  packageDescriptor.dependencies;
					
					var dependenciesInstalledCount = 0;
					var dependenciesRequired = 0;
					for (var name in dependencies) { 
						if (dependencies.hasOwnProperty(name)) {
							dependenciesRequired++;
							var version = dependencies[name];
							
							exports.install(name, version,function(){
								dependenciesInstalledCount++; 
								if (dependenciesRequired == dependenciesInstalledCount)
									onPackageInstalled && onPackageInstalled();
							});		
						}
						
					}	
				
					if (dependenciesRequired == 0)
						onPackageInstalled && onPackageInstalled();

					
					
				}
			);

		}

		
	};

	
	return exports;

})();