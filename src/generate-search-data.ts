import axios from 'axios';
import { writeFile } from 'fs';
import { getConfigData, processConfigData } from './utils';

const AxiosInstance = axios.create();
const jsonIndentation = '    ';

// Send an async HTTP Get request to the url
AxiosInstance.get('https://www.steamcardexchange.net/index.php?showcase')
  .then( // Once we have data returned ...
    response => {
        return getConfigData(response.data, 'https://api.steampowered.com/ILoyaltyRewardsService/QueryRewardItems/v1/?count=1000', 120, /\d+/);
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

        let exportedData = `var APPDATA = ${JSON.stringify(response, null, jsonIndentation)};`
        writeFile('docs/data.js', exportedData, err => {
            if (err) {
                console.error(err);
                return;
            }
        });
    }
  ).catch(console.error); // Error handling
