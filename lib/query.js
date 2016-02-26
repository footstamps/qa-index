// Author: tngan
const request = require('superagent');
const path = require('path');
const url = require('url');

const DOMAIN = 'https://api.stackexchange.com';
const API_VERSION = '2.2';

function query(category) {
    
    // Internal functions
    const append = key => value => {
        this.queryParams = Object.assign(this.defaultQueryParams, this.queryParams, { [key]: value });
        return this;
    };

    // 
    this.queryParams = {};

    this.defaultQueryParams = {
        order: 'desc',
        site: 'stackoverflow',
        pagesize: '10'
    };

    this.url = url.resolve(DOMAIN, path.join(API_VERSION, category));

    // Public functions
    
    this.fromDate = append('fromdate');

    this.toDate = append('todate');

    this.order = append('order');

    this.site = append('site');

    this.pageSize = append('pagesize');
    
    this.page = append('page');

    this.sort = append('sort');

    this.site = append('site');

    this.exec = callback => {
        request
            .get(this.url)
            .query(this.queryParams)
            .set('Accept', 'application/json')
            .end(callback);
        
        // Avoid memory leak
        delete this;
    };

}

module.exports = function(category) {
    return new query(category);
};
