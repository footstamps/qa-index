// Author: anthonysko 
var converter = require('json-2-csv');
const fs = require('fs');
var Q = require('q');
var mkdirp = require('mkdirp');

/*
Input Parameter:
	json: the JSON Object
	path: the csv output save location, default ./dummy
*/

/*
Example
	var doc = [
		{
			Make: 'Nissan',
			Model: 'Murano',
			Year: '2013',
			Specifications: {
				Mileage: '7106',
				Trim: 'S AWD'
			}
		},
		{
			Make: 'BMW',
			Model: 'X5',
			Year: '2014',
			Specifications: {
				Mileage: '3287',
				Trim: 'M'
			}
		}
	];
	var converter = require('[PATH]/json2csv.js');
	
	
	converter.convert(doc, 'hi', function(err, path){
		if(err){
			throw err;
		} else{
			console.log("Success! Path= " + path);
		}
		
	});
*/

module.exports.convert = function(json, path, fn) {
	var _path = (path) ? path : 'dummy';
	var _filename;
	var _csv; //The content of CSV
	
	_path += '/';
	
	
	function ensureFilePath(){
		var deferred = Q.defer();	
		mkdirp(path, function(err){
			if(err) deferred.reject(new Error("ensureFilePath() Error!\n" + err));
			deferred.resolve();
		});
		return deferred.promise;
	}	
	
	function toCSV(){
		var deferred = Q.defer();
	
		converter.json2csv(json, function(err, csv){
			if(err) deferred.reject(new Error("toCSV() Error!\n" + err));
			_csv = csv;
			//console.log(_csv);
			deferred.resolve();
		});
		return deferred.promise;
	}
	
	function saveFiletoPath(){
		var deferred = Q.defer();
		_filename = getCustomTimeString() + '.csv';
		var fullpath = _path + _filename;
		fs.writeFile(fullpath, _csv, function(err) {
			if(err) deferred.reject(new Error("saveFiletoPath() Error!\n" + err));
			deferred.resolve();
		});
			
		return deferred.promise;
	}
	

	Q.fcall(ensureFilePath)
	.then(toCSV)
	.catch(function(err){
		return fn(err, null);
		//throw(err);
	})
	.done(function(){
		//create file to Path
		Q.fcall(saveFiletoPath)
		.catch(function(err){
			return fn(err, null);
			//throw(err);
		})
		.done(function(){
			//Create Success! Return the path
			return fn(null, _path.toString() + _filename);
		});
		
	});
	
	//Other Function	
	function getCustomTimeString(){
		var now = new Date();
		var yyyy = now.getFullYear().toString();
		var MM = (now.getMonth()+1).toString(); // getMonth() is zero-based
		var dd  = now.getDate().toString();
		var hh = now.getHours().toString();
		var mm = now.getMinutes().toString();
		var ss = now.getSeconds().toString();
		return yyyy + (MM[1]?MM:"0"+MM[0]) + (dd[1]?dd:"0"+dd[0]) + (hh[1]?hh:"0"+hh[0]) + (mm[1]?mm:"0"+mm[0]) + (ss[1]?ss:"0"+ss[0]); // padding
	};
	
	
}
