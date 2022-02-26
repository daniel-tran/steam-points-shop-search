import axios from 'axios';
import { writeFile } from 'fs';
import { processConfigDataRecursive, getConfigDataFromAppList } from './utils';

const AxiosInstance = axios.create();
const jsonIndentation = '    ';

// See the technical notes for why this endpoint is still problematic for obtaining the app list
AxiosInstance.get('https://api.steampowered.com/ISteamApps/GetAppList/v2/?')
  .then( // Once we have data returned ...
    response => {
        return getConfigDataFromAppList(response.data.applist.apps);
    }
  ).then(
    response => {
        writeFile('debug/config.json', JSON.stringify(response, null, jsonIndentation), err => {
            if (err) {
                console.warn(err);
            }
        });
        return processConfigDataRecursive(AxiosInstance, {}, response, 'https://api.steampowered.com/ILoyaltyRewardsService/QueryRewardItems/v1/?count=1000', '')
    }
  ).then(
    response => {
        writeFile('debug/output.json', JSON.stringify(response, null, jsonIndentation), err => {
            if (err) {
                console.warn(err);
            } else {
                console.log('Success! Got all necessary data from the Steam API.');
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
