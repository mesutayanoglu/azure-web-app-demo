const tr = require('turkey-city-regions');
const fs = require('fs');

const dataArray = Array.isArray(tr.getAllData) ? tr.getAllData : [];

const citiesMap = new Map();

// Helper to convert TR uppercase to title case
function toTitleCase(str) {
  if (!str) return str;
  return str.split(' ').map(word => {
    if (word.length === 0) return '';
    return word.charAt(0).toLocaleUpperCase('tr-TR') + word.slice(1).toLocaleLowerCase('tr-TR');
  }).join(' ');
}

dataArray.forEach(item => {
    let il = toTitleCase(item.il);
    let ilce = toTitleCase(item.ilce);
    
    if (il === "Afyon") il = "Afyonkarahisar"; // standardize
    if (il === "Icel") il = "Mersin";

    if (!citiesMap.has(il)) {
        citiesMap.set(il, { name: il, districtSet: new Set() });
    }
    citiesMap.get(il).districtSet.add(ilce);
});

const result = [];
let idCounter = 1;

// We sort by Turkish locale
const sortedCities = Array.from(citiesMap.keys()).sort((a, b) => a.localeCompare(b, 'tr-TR'));

sortedCities.forEach(cityName => {
    const val = citiesMap.get(cityName);
    // Sort districts
    const dArray = Array.from(val.districtSet).sort((a, b) => a.localeCompare(b, 'tr-TR')).map(d => ({ name: d }));
    
    result.push({
        id: idCounter++,
        name: val.name,
        districts: dArray
    });
});

fs.writeFileSync('./data/cities.json', JSON.stringify(result, null, 2));
console.log('Cities generated successfully!');
