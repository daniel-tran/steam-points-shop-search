import axios from 'axios';
import { writeFile, appendFile } from 'fs';
import { getConfigData, processConfigData } from './utils';

const AxiosInstance = axios.create();
const jsonIndentation = '    ';

// Send an async HTTP Get request to each url
const urlList = [
    'https://www.steamcardexchange.net/index.php?showcase-filter-ac',
    'https://www.steamcardexchange.net/index.php?showcase-filter-df',
    'https://www.steamcardexchange.net/index.php?showcase-filter-gi',
    'https://www.steamcardexchange.net/index.php?showcase-filter-jl',
    'https://www.steamcardexchange.net/index.php?showcase-filter-mo',
    'https://www.steamcardexchange.net/index.php?showcase-filter-pr',
    'https://www.steamcardexchange.net/index.php?showcase-filter-su',
    'https://www.steamcardexchange.net/index.php?showcase-filter-vx',
    'https://www.steamcardexchange.net/index.php?showcase-filter-yz',
    'https://www.steamcardexchange.net/index.php?showcase-filter-09',
    'https://www.steamcardexchange.net/index.php?showcase-filter-sym',
];
for (let i = 0; i < urlList.length; i++) {
    AxiosInstance.get(urlList[i])
      .then( // Once we have data returned ...
        response => {
            console.log(`Acquired raw page data from "${urlList[i]}", now extracting app ID data.`);
            return getConfigData(response.data, 'https://api.steampowered.com/ILoyaltyRewardsService/QueryRewardItems/v1/?count=1000', 110, /\d+/);
        }
      ).then(
        response => {
            writeFile('debug/config.json', JSON.stringify(response, null, jsonIndentation), err => {
                if (err) {
                    console.warn(err);
                }
            });
            return processConfigData(AxiosInstance, response);
        }
      ).then(
        response => {
           writeFile('debug/output.json', JSON.stringify(response, null, jsonIndentation), err => {
               if (err) {
                   console.warn(err);
               } else {
                   console.log('Success! Got data from the Steam API.');
               }
           });

           let exportedData = `APPDATA = {...APPDATA, ...${JSON.stringify(response, null, jsonIndentation)}};\n`;
           appendFile('docs/data.js', exportedData, err => {
               if (err) {
                   console.error(err);
                   return;
               }
           });
        }
      ).catch(console.error); // Error handling
}
