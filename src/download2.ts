import axios from 'axios';
import * as cheerio from 'cheerio';
import { writeFile } from 'fs';

interface AppData {
    name: string,
    appid: string,
    pointsShopUrl: string,
    items: string[],
}

let allAppData = [];
const AxiosInstance = axios.create(); 

// Send an async HTTP Get request to the url
AxiosInstance.get('https://www.steamcardexchange.net/index.php?backgroundviewer')
  .then( // Once we have data returned ...
    response => {
      const appData = response.data;
      const parsedData = cheerio.load(appData);
      parsedData.html();

      const urlPrefix = 'https://api.steampowered.com/ILoyaltyRewardsService/QueryRewardItems/v1/?count=1000&community_item_classes[0]=15&community_item_classes[1]=14&community_item_classes[2]=13&community_item_classes[3]=11&community_item_classes[4]=3';
      let output = {
          app: {},
          urls: [urlPrefix]
      };
      const urlLimit = 400;
      let urlCounter = 0;
      let urlIndex = 0;
      // Extract all app id's with potential Points Shop items
      for (let i = 0; i < parsedData('select option').length; i++) {
        let appid = parsedData('select option').eq(i).val();
        if (appid.length > 0) {
          output['app'][`${appid}`] = {
              'name': parsedData('select option').eq(i).text(),
              'pointsShop': `https://store.steampowered.com/points/shop/app/${appid}`
          };
          
          output['urls'][urlIndex] += `&appids[${urlCounter}]=${appid}`;
          urlCounter++;
          if (urlCounter >= urlLimit) {
              urlIndex++;
              output['urls'][urlIndex] = urlPrefix;
              urlCounter = 0;
              console.log(`Processed a full set of ${urlLimit} items.`);
              break;
          }
        }
      }
      
      // Omit the final entry, if the limit is a factor of the number of apps
      if (output['urls'][urlIndex] == urlPrefix) {
          output['urls'].pop();
      }
      return output;
    }
  ).then(
    response => {
      writeFile('docs/data.json', JSON.stringify(response), err => {
        if (err) {
          console.error(err);
          return;
        }
        //file written successfully
      });
    }
  )
  .catch(console.error); // Error handling
