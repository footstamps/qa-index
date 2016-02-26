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


// Generic generator
// Get all questions in 2014
function * genericQueryGenerator() { 
    let startPage = 1;
    while(true) {
        // TODO Abstract it out later on
        // yield query('questions').sort('creation').page(startPage++).pageSize('100').fromDate('1388534400').toDate('1419984000');
        yield query('questions').sort('creation').page(startPage++).pageSize('100').fromDate('1388534400').toDate('1388540000');
    }
}

const questionQueryGenerator = new genericQueryGenerator();

function queryQuestions() {
    return new Promise(function(resolve, reject) {
        questionQueryGenerator.next().value.exec((err, res) => {
            if(res.body.error_id) {
                // Reject this promise
                reject(res.body.error_id);
            } else {
                resolve(res.body.has_more);
            }
        });
    });
}

Promise.resolve(true)
    .then(function loop(hasMore) {
        if(hasMore) {
            return queryQuestions().then(loop);
        }
    })
    .then(function() {
        console.log(`Done ...`);
    })
    .catch(function(e) {
        console.log('error', e);
    });
