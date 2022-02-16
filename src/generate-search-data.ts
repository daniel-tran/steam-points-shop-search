import axios from 'axios';
import { getConfigData, processConfigData } from './utils';

const AxiosInstance = axios.create(); 

// Send an async HTTP Get request to the url
AxiosInstance.get('https://www.steamcardexchange.net/index.php?backgroundviewer')
  .then( // Once we have data returned ...
    response => {
        return getConfigData(response.data, 'https://api.steampowered.com/ILoyaltyRewardsService/QueryRewardItems/v1/?count=1000', 130);
    }
  ).then(
    response => {
        processConfigData(AxiosInstance, response, 'docs/data.js');
    }
  ).catch(console.error); // Error handling
