// Entry point of data fetching
const request = require('superagent');
const path = require('path');
const url = require('url');

const DOMAIN = 'https://api.stackexchange.com';
const API_VERSION = '2.2';

// API Url
const apiUrl = {
    questions: `${DOMAIN}/${API_VERSION}/questions`
}; 

// Simple URL fetching using superagent module
request
.get(apiUrl.questions)
.query('order=desc&sort=activity&site=stackoverflow')
.set('Accept', 'application/json')
.end((err,res) => {
    console.log(res.body);
    // TODO Find an online database server (use question_id as the key)
    // TODO Think about handling time-series data
    // TODO Filter unused data
    // TODO Add the fetching timestamp (For another interesting questions in weekly/festival bias)
});
