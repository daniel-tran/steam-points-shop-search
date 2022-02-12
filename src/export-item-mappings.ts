import { readFile, writeFile } from 'fs';

readFile('docs/data2.json', function(err, data) {
    if (err) {
        console.error(err);
        return;
    }
    
    let exportedData = `var APPDATA = ${data.toString()};`
    writeFile('docs/data2.js', exportedData, otherErr => {
        if (otherErr) {
            console.error(otherErr);
            return;
        }
    });
});
