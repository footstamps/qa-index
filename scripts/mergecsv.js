const csvMerger = require('../lib/mergecsv.js');
const path = require('path');

const argLength = process.argv.length;
const root = path.join(__dirname, '../raw');

console.log(root);

if(argLength === 2) {
    //Process All file in the path
    csvMerger.merge(root, '', '', (err, path) => {
        if(err) throw err;
        console.log(path);
    });
} else if(argLength === 4) {
    //Process Specific range of file in the path
    csvMerger.merge(root, process.argv[2], process.argv[3], (err, path) => {
	    if(err) throw err;
        console.log(path);
    });
}
