'use strict';
const csvMerger = require('../lib/mergecsv.js');
const path = require('path');

const argLength = process.argv.length;
const root = path.join(__dirname, '../raw');

// Callback for commonly use
const callback = (err, path) => {
    if(err) throw err;
    console.log(path);
};

// Default argumemnt: Merge all .csv under the raw directory (only the top directory, not include the entire hierarchy)
let args = [root, '', '', callback];

if(argLength === 3) {
    //Process for given folder under the raw directory
    args = [path.join(root, process.argv[2]), '', '', callback];  
} else if(argLength === 4) {
    //Process Specific range of file in the path
    args = [root, process.argv[2], process.argv[3], '', callback];  
}

csvMerger.merge.apply(undefined, args);
