import * as cheerio from 'cheerio';
import { writeFile } from 'fs';

/** Generates configuration information to get Points Shop information from the Steam API.
 *
 * @param {Object} responseData: Page data containing a list of apps and their ID numbers.
 * @param {string} urlPrefix: The base Steam API URL to query for app data.
 * @returns {Object} An object containing general info about each app, and the Steam API URL's to query.
 */
export function getConfigData(responseData: any, urlPrefix: string) {
    const parsedData = cheerio.load(responseData);
    parsedData.html();
    const options = parsedData('select option');

    let output = {
        app: {},
        urls: [urlPrefix]
    };
    const urlLimit = 400;
    let urlCounter = 0;
    let urlIndex = 0;
    // Extract all app id's with potential Points Shop items
    for (let i = 0; i < options.length; i++) {
      let appid = options.eq(i).val();
      if (appid.length > 0) {
        output['app'][`${appid}`] = {
            'name': options.eq(i).text(),
            'pointsShop': `https://store.steampowered.com/points/shop/app/${appid}`
        };
        
        output['urls'][urlIndex] += `&appids[${urlCounter}]=${appid}`;
        urlCounter++;
        if (urlCounter >= urlLimit) {
            urlIndex++;
            output['urls'][urlIndex] = urlPrefix;
            urlCounter = 0;
            console.log(`Processed a full set of ${urlLimit} items.`);
            // TODOE Remove this to process more data sets
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

/** Writes the result of a given configuration to a file.
 *
 * @param {Object} axiosInstance: An Axios instance used to make web requests.
 * @param {Object} config: A configuration that was returned from `getConfigData()`.
 * @param {string} exportedDataPath: The file to write the results to.
 */
export function processConfigData(axiosInstance: any, config: any, exportedDataPath: string) {
    let promises = [];
    for (let i = 0; i < config['urls'].length; i++) {
        promises.push(axiosInstance.get(config['urls'][i]).catch(console.error));
        
        console.log(`${promises.length} promise(s) are queued.`);
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
                        'name': config['app'][`${item.appid}`]['name'],
                        'items': [],
                        'pointsShopUrl': config['app'][`${item.appid}`]['pointsShop'],
                    };
                }
                // Add extra info about the app, since this is available from the response and discarding all this hard-earned data would be wasteful
                itemMapping[`${item.appid}`]['items'].push({
                    'name': item.community_item_data.item_title,
                    'itemType': getCommunityItemType(item.community_item_class),
                    'cost': item.point_cost,
                    'pointsShopUrl': getPointShopClusterUrl(itemMapping[`${item.appid}`]['pointsShopUrl'], item.community_item_class),
                    'imageUrl': getImageUrl(`${item.appid}`, item.community_item_data.item_image_large, item.community_item_class),
                });
            });
        });
    }).then(function() {        
        let exportedData = `var APPDATA = ${JSON.stringify(itemMapping)};`
        writeFile(exportedDataPath, exportedData, otherErr => {
            if (otherErr) {
                console.error(otherErr);
                return;
            }
        });
    }).catch(console.error); // Error handling
}

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

function getPointShopClusterUrl(pointsShopUrl: string, itemClass: number) {
    // Each app's Points Shop page can be subdivided into specific clusters so that only items
    // of a particular type are viewed. Not all clusters will normally be accessible through
    // the Points Shop UI for a given app, but their URL's will still lead to valid pages.
    let clusterUrl = `${pointsShopUrl}/cluster/`;
    switch(itemClass) {
        case 15: return `${clusterUrl}2`;
        case 14: return `${clusterUrl}3`;
        case 13: return `${clusterUrl}4`;
        case 11: return `${clusterUrl}6`;
        case 3: return `${clusterUrl}5`;
        case 4: return `${clusterUrl}7`;
    }
    return clusterUrl;
}

function getImageUrl(appId: string, imageNameWithExtension: string, itemClass: number) {
    switch(itemClass) {
        case 15:
        case 14:
        case 13:
        case 11:
        case 4: return `https://cdn.akamai.steamstatic.com/steamcommunity/public/images/items/${appId}/${imageNameWithExtension}`;
        case 3: return `https://steamcommunity.com/economy/profilebackground/items/${appId}/${imageNameWithExtension}`;
    }
    return '';
}
