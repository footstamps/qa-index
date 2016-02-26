'use strict';
// Author: tngan
// This parser is to do generic post-processing
const _ = require('lodash');
const flatten = require('flat');

const mapping = {
    questions: {
        arrayJoin: { 'tags': ';' },
        omit: ['owner_profile_image', 'owner_link', 'link'],
        flatten: ['owner']
    }
};

module.exports = function(items, category) {
    let resItems = [];
    if(mapping.hasOwnProperty(category)) {
        // TODO Use harmony version to do destruction
        let cmap = mapping[category];
        let arrayJoin = cmap.arrayJoin;
        let omit = cmap.omit;
        let rename = cmap.rename;

        _.forEach(items ,function(item) {
            let resItem = {};
            // Step 1: Flatten
            let flatJson = flatten(item, { delimiter: '_', safe: true }); 
            // Step 2: Filter
            flatJson = _.omit(flatJson, omit);
            // Deeper postprocessing
            _.forEach(flatJson, function(value, key) {
                // Step 3: ArrayJoin
                if(arrayJoin && arrayJoin.hasOwnProperty(key)) {
                    resItem[key] = value.join(arrayJoin[key]);
                } else if(rename && rename.hasOwnProperty(key)) {
                    // Step 4: Rename 
                    resItem[rename[key]] = value; 
                } else {
                    // Step 5: For the rest, just assign
                    resItem[key] = value;
                }
            });

            resItems.push(resItem);
        });
    } else {
        console.log(`There is no mapping of ${category}`);    
    } 
    return resItems;    
};
