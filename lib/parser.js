'use strict';
// Author: tngan
// This parser is to do generic post-processing
const _ = require('lodash');
const flatten = require('flat');
const ent = require('ent');
const schema = require('./schema');
const count = require('wordcount');

const mapping = {
  questions: {
    arrayJoin: { 
      'tags': {
        delimiter: ';',
        isCount: true
      }
    },
    pick: Object.keys(schema.questions),
    flatten: ['owner'],
    decode: ['title'],
    schema: schema.questions,
    wordCount: ['title']
  },
  tags: {
    pick: Object.keys(schema.tags),
    schema: schema.tags
  },
  users: {
    pick: Object.keys(schema.users),
    schema: schema.users,
    flatten: ['badge_counts'],
    decode: ['location', 'display_name']
  },
};

function parseValue(value, flag) {
  // 1. HTML decode
  // 2. Quote embed
  if(flag) {
    value = ent.decode(value).replace(/"/g, '""');
    return `"${value}"`;
  }
  return value;
}

module.exports = function(items, category) {
  let resItems = [];
  if(mapping.hasOwnProperty(category)) {
    // TODO Use harmony version to do destruction
    let cmap = mapping[category];
    let arrayJoin = cmap.arrayJoin;
    let pick = cmap.pick;
    let rename = cmap.rename;
    let schema = cmap.schema;
    let wordCount = cmap.wordCount || [];
    let decode = cmap.decode || [];

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
          resItem[key] = value.join(arrayJoin[key].delimiter);
          // Step 3.1 Add tag count
          if(arrayJoin[key].isCount) {
            resItem[`${key}_count`] = value.length;
          }
        } else if(rename && rename.hasOwnProperty(key)) {
          // Step 4: Rename 
          key = rename[key];
          resItem[key] = parseValue(value, _.includes(decode, key)); 
        } else {
          // Step 5: For the rest, just assign
          resItem[key] = parseValue(value, _.includes(decode, key));
        }

        if(_.includes(wordCount, key)) {
          resItem[`${key}_word_count`] = count(resItem[key] || '');
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
