// Author: anthonysko
// Customized function that merge multiple csv to single csv file

/*
Example:
const csvMerger = require('./lib/mergecsv.js');

//Process Specific range of file in the path
csvMerger.merge('./dummy', '20160228000000', '20160229000000', (err, path) => {
	if(err) throw err;
	console.log(path);
});

//Process All file in the path
csvMerger.merge('./dummy', '', '', (err, path) => {
	if(err) throw err;
	console.log(path);
});

*/

/*
Note Or toDo:
-- The CSV files are not validated
-- The CSV content is not validated
-- May have performance issues
*/

const fs = require('fs');
const Q = require('q');

const FILE_LEN = 18;  //e.g. YYYYMMDDhhmmss.csv
const FILE_EXT = '.csv';
const OUTPUT_FILE_NAME = 'merge' + FILE_EXT;

module.exports.merge = function(path, from, to, fn){
	var _path = (path) ? path : 'dummy';
	_path += '/';
	
	
	//Get all the File in the path
	function getFileArray() {
		var deferred = Q.defer();
		fs.readdir(_path, (err, files) => {
			if(err) deferred.reject(new Error("getFileArray() Error!\n" + err));
			deferred.resolve(files);
		});
		return deferred.promise;
	}
	
	
	function getProcArray(arr) {
		var deferred = Q.defer();
		getFileArray()
		.catch((err) => {
			deferred.reject(new Error("getProcArray() Error!\n +err"));
		})
		.done((fileArr) => {
			//Check file name format
			
			fileArr.forEach((fileName) => {
				
				if(fileName.length == FILE_LEN && fileName.substr(fileName.length -4) === FILE_EXT) {
					if(from == '' && to == ''){
						arr.push(fileName);
					} 
					else if(fileName.substr(0,fileName.length -4) > from && fileName.substr(fileName.length -4) < to) {
						arr.push(fileName);
					}
				}
			});
			deferred.resolve(arr);
		});
		return deferred.promise;
	}
	
	function getCSVHeader(path){
		var deferred = Q.defer();
		fs.readFile(path, 'utf8', (err, data) => {
			if(err) deferred.reject(new Error("getCSVHeader() Error!\n" + err));
			
			// Improvement: loop over the buffer and stop when the line is reached
			var lines = data.toString().split("\n");
			deferred.resolve(lines[0]);
		});
		return deferred.promise;
	}
	
	function getCSVContent(path){
		var deferred = Q.defer();
		fs.readFile(path, 'utf8', (err, data) => {
			if(err) deferred.reject(new Error("getCSVContent() Error!\n" + err));
			
			// Improvement: loop over the buffer and stop when the line is reached
			var lines = data.toString().split("\n");
			lines.shift(); //remove Header
			lines.pop(); //remove empty line
			deferred.resolve(lines);
		});
		return deferred.promise;
	}
	
	function writeCSV(path, contentArr){
		var deferred = Q.defer();
		console.log(contentArr);
		//var wstream = fs.createWriteStream(_path + );
		fs.writeFile( path, contentArr.join("\n"), (err) => {
			if(err) deferred.reject(new Error("writeCSV() Error!\n" + err));
			deferred.resolve();
		});
		
		return deferred. promise;
	}


	getProcArray([])
	.catch((err) => {
		return fn(err, null);
	})
	.done((procArr) => {
		if(procArr.length > 0) {
			
			//Get the CSV Header, assume only one format header
			getCSVHeader(_path + procArr[0])
			.catch((err) => {
				return fn(err, null);
			})
			.done((CSVHeader) => {
				var promises = [];
				for(var i=0;i<procArr.length;i++){
					promises.push(getCSVContent(_path + procArr[i]));
				}
				//Get all the CSVContent of file in procArr
				//when done all file content will be cached in dataArr
				Q.all(promises)
				.catch((err) => {
					return fn("Q.all(promises) Error" + err, null);
				})
				.done((dataArr) => {
					//flatten an array of arrays
					var flattened = dataArr.reduce(function(a, b) {
						return a.concat(b);
					}, []);
					flattened.unshift(CSVHeader);
					
					//Write the final result to the path
					writeCSV(_path + OUTPUT_FILE_NAME, flattened)
					.catch((err) => {
						return fn(err, null);
					})
					.done(function() {
						return fn(null, _path + OUTPUT_FILE_NAME);
					});
				});
				
			});
			
		} else{
			return fn("No CSV need to be processed!", null);
		}
	});
	

	
}