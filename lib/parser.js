'use strict';
// Author: tngan
// This parser is to do generic post-processing
const _ = require('lodash');
const flatten = require('flat');
const schema = require('./schema');

const mapping = {
    questions: {
        arrayJoin: { 'tags': ';' },
        pick: Object.keys(schema.questions),
        flatten: ['owner'],
        schema: schema.questions
    },
    tags: {
        pick: Object.keys(schema.tags),
        schema: schema.tags
    }
};

module.exports = function(items, category) {
    let resItems = [];
    if(mapping.hasOwnProperty(category)) {
        // TODO Use harmony version to do destruction
        let cmap = mapping[category];
        let arrayJoin = cmap.arrayJoin;
        let pick = cmap.pick;
        let rename = cmap.rename;
        let schema = cmap.schema;

        _.forEach(items ,function(item) {
            let resItem = {};
            // Step 1: Flatten
            let flatJson = flatten(item, { delimiter: '_', safe: true }); 
            // Step 2: Filter
            flatJson = _.pick(flatJson, pick);
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
            // Step 6: Make sure all item has same schema, default value is an empty string
            resItem = Object.assign({}, schema, resItem);
            // Step 7: Push the parsed item object back to the return array
            resItems.push(resItem);
        });
    } else {
        console.log(`There is no mapping of ${category}`);    
    } 
    return resItems;    
};
