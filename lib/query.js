// Author: tngan
const request = require('superagent');
const path = require('path');
const url = require('url');

const DOMAIN = 'https://api.stackexchange.com';
const API_VERSION = '2.2';

function query(category) {
    
    // Internal functions
    const append = key => value => {
        this.queryParams = Object.assign(this.getDefaultQueryParams(), this.queryParams, { [key]: value });
        return this;
    };

    // 
    this.queryParams = {};
	
    this.getDefaultQueryParams = () => {
        const now = Date.now()/1000 | 0;
		return {
			order: 'asc',
			site: 'stackoverflow',
			pagesize: '100',
			fromdate: now, 
			todate: now
		};
    };

    this.url = url.resolve(DOMAIN, path.join(API_VERSION, category));

    // Public functions
    
    this.fromDate = append('fromdate');

    this.toDate = append('todate');

    this.order = append('order');

    this.tagged = append('tagged');

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
