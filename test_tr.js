const tr = require('turkey-city-regions');
const fs = require('fs');

const data = tr.getDistrictsOfEachCity(); 
// Let's console.log the structure to see what it gives
console.log(JSON.stringify(Object.keys(data).slice(0, 2)));
console.log(JSON.stringify(data[Object.keys(data)[0]]));
