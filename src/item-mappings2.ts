import { readFile, writeFile } from 'fs';
import axios from 'axios';

function getCommunityItemType(itemClass: number) {
    switch(itemClass) {
        case 15: return 'Animated Avatar';
        case 14: return 'Avatar Frame';
        case 13: return 'Mini-Profile';
        case 11: return 'Animated Sticker';
        case 3: return 'Profile Background';
        case 4: return 'Emoticon';
    }
    return '';
}

const AxiosInstance = axios.create();

readFile('docs/data.json', function(err, data) {
  if (err) {
    console.error(err);
    return;
  }
  let downloadData = JSON.parse(data.toString());
  
  let promises = [];
  for (let i = 0; i < downloadData['urls'].length; i++) {
      promises.push(AxiosInstance.get(downloadData['urls'][i]).catch(console.error));
      
      // TODOE Remove this to process more than a subset of the URLs
      if (i >= 1) {break;}
  }
  
  let itemMapping = {};
  Promise.all(promises).then(function(results) {
      results.forEach(function(response){
          let endpointData = response.data.response;
          endpointData.definitions.forEach(function(item) {
              // Initial item mapping setup when adding items to this app for the first time
              if (!itemMapping[`${item.appid}`]) {
                  itemMapping[`${item.appid}`] = {
                      'name': downloadData['app'][`${item.appid}`]['name'],
                      'items': [],
                      'pointsShop': downloadData['app'][`${item.appid}`]['pointsShop'],
                  };
              }
              // Add extra info about the app, since this is available from the response and discarding all this hard-earned data would be wasteful
              itemMapping[`${item.appid}`]['items'].push({
                      'name': item.community_item_data.item_title,
                      'itemType': getCommunityItemType(item.community_item_class),
                      'cost': item.point_cost
              });
          });
      });
  }).then(function() {
      writeFile('docs/data2.json', JSON.stringify(itemMapping), err => {
        if (err) {
          console.error(err);
          return;
        }
        //file written successfully
      });
  }).catch(console.error); // Error handling
});
