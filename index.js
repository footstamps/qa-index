'use strict';
// Author: tngan
//
// TODO Find an online database server (use question_id as the key)
// TODO Think about handling time-series data
// TODO Filter unused data
// TODO Add the fetching timestamp (For another interesting questions in weekly/festival bias)

//Sample code to use parser
//parser(res.body.items, 'questions');

const query = require('./lib/query');
const parser = require('./lib/parser');
const converter = require('./lib/json2csv');
const tLib = require('./lib/timeConverter');
const _ = require('lodash');
const fs = require('fs');


let results = [];
let page = 0;
let startPage = 1;
let config;

try {
    config = JSON.parse(fs.readFileSync('./config.json', 'utf8'));
} catch(e) {
	throw e;
}

const fromDate = tLib.getTimestamp(config.from);
const toDate = tLib.getTimestamp(config.to);
const isChainDate = fromDate && toDate;	//getTimestamp will return 0 if the input value is not valid
const tag = config.tag;
const pageSize = config.pageSize || 100;
const pagePerFile = config.pagePerFile || 100;
const pagePerTick = config.pagePerTick || 25; //The number of makeQuery() per tick
const key = config.key;

console.log("----- Input Parameter Start -----");
console.log("Tag: " + tag);
console.log("From: " + config.from + " (" + fromDate + ")");
console.log("To: " + config.to + " (" + toDate + ")");
console.log("Page per file: " + config.pagePerFile);
console.log("Page size: " + config.pageSize);
console.log("----- Input Parameter End -----\n");

function * genericQueryGenerator(category) { 
  let basicQuery = query(category).sort('creation').tagged(tag).pageSize(pageSize);
  // Add key to the query for stack app (obtain 10K query quota)
  if(_.isString(key)) {
    basicQuery = basicQuery.addKey(key);
  }
  while(true) {
    // TODO Abstract it out later on
    console.log(`Fetching page ${startPage} ...`);
    basicQuery = basicQuery.page(startPage++);
    if (isChainDate) {
      yield basicQuery.fromDate(fromDate).toDate(toDate);
    } else {
      yield basicQuery;
    }
  }
}

const questionQueryGenerator = new genericQueryGenerator('questions');
const tagQueryGenerator = new genericQueryGenerator('tags');

function makeQuery() {
  return new Promise(function(resolve, reject) {
    questionQueryGenerator.next().value.exec((err, res) => {
      if(res.body.error_id) {
        // Reject this promise
        console.log(res.body.error_message);
        return reject(false);
      } 
      // Promise only accept one value, has_more determines whether next page is needed to be fetched
      // You can get the json for current page using
      // parser(res.body.items, 'questions')
	  
      //results = results.concat(parser(res.body.items, 'questions'));
	  
	  var ret = {};
	  ret.has_more =  res.body.has_more;
	  ret.data = parser(res.body.items, 'questions');
    //console.dir(res.body.it
	  return resolve(ret);
      //return resolve(res.body.has_more);
    });
  });
}

Promise
  .resolve(true)
  .then(function loop(hasMore) {
    if(page > 0 && (page % pagePerFile === 0 || !hasMore)) {
      converter.convert(results.slice(0), './raw', (err, path) => {
        if(err) {
            console.log('Error', err);
        } else {
            console.log(`See the .csv file in under ./raw for page ${page - pagePerFile} - ${ page - 1 }`);
        }
      });
      results = []; // Restore
    }
    if(hasMore) {
      page+=pagePerTick;
      let xPromises = [];
      for(var i=0;i<pagePerTick;i++){
        xPromises.push(makeQuery());
      }
      Promise
        .all(xPromises)
        .then(res => {
          let flgHasMore = true;
          for(var i=0;i<pagePerTick;i++){
            results = results.concat(res[i].data);
            if(!res[i].has_more) {
              flgHasMore = false;
              throw "No more data";
            }
            
          }
          loop(flgHasMore);
        })
        .catch((err) => {
          console.log('Error', err);
          if(results.length > 0) {
            console.log('Attempt dumping remaining data');
            converter.convert(results.slice(0), './raw', (err, path) => {
              if(err) {
                console.log('Error', err);
              } else {
                console.log(`See the .csv file in under ./raw for page ${page - pagePerFile} - ${ page - 1 }`);
              }
            });
          }
        });
    }
  });

