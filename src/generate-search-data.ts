import axios from 'axios';
import { getConfigData, processConfigData } from './utils';

const AxiosInstance = axios.create(); 

// Send an async HTTP Get request to the url
AxiosInstance.get('https://www.steamcardexchange.net/index.php?backgroundviewer')
  .then( // Once we have data returned ...
    response => {
        return getConfigData(response.data, 'https://api.steampowered.com/ILoyaltyRewardsService/QueryRewardItems/v1/?count=1000&community_item_classes[0]=15&community_item_classes[1]=14&community_item_classes[2]=13&community_item_classes[3]=11&community_item_classes[4]=3', 400);
    }
  ).then(
    response => {
        processConfigData(AxiosInstance, response, 'docs/data2.js');
    }
  ).catch(console.error); // Error handling
