import * as cheerio from 'cheerio';

/** Generates configuration information to get Points Shop information from the Steam API.
 *
 * @param {string} responseData: HTML page data containing a list of apps and their ID numbers.
 * @param {string} urlPrefix: The base Steam API URL to query for app data.
 * @param {number} urlLimit: The max. number of apps to fit into one Steam API URL. In general, try to keep this below 440.
 * @param {string} idExtractionRegex: Regex that extracts the true app ID from the provided source value (first match only). Defaults to null.
 * @returns {Object} An object containing general info about each app, and the Steam API URL's to query.
 */
export function getConfigData(responseData: string, urlPrefix: string, urlLimit: number, idExtractionRegex: RegExp = null) {
    const parsedData = cheerio.load(responseData);
    parsedData.html();
    const options = parsedData('select option');

    let output = {
        app: {},
        urls: [urlPrefix]
    };
    let urlCounter = 0;
    let urlIndex = 0;
    // Extract all app id's with potential Points Shop items
    for (let i = 0; i < options.length; i++) {
      let appid = options.eq(i).val();
      if (appid.length > 0) {
        // App ID is not empty, but may need to be extracted from a larger string, usually in the form of "index.php?gamepage-appid-..."
        if (idExtractionRegex) {
            appid = `${appid}`.match(idExtractionRegex)[0];

            // The regex may result in some apps appearing multiple times, in which case only take the first instance.
            // This is a somewhat blind approach, but selecting the correct instance is not so trivial either, depending on the expression.
            if (`${appid}` in output['app']) {
                continue;
            }
        }
        output['app'][`${appid}`] = {
            'name': options.eq(i).text(),
            'pointsShopUrl': `https://store.steampowered.com/points/shop/app/${appid}`
        };
        
        output['urls'][urlIndex] += `&appids[${urlCounter}]=${appid}`;
        urlCounter++;
        if (urlCounter >= urlLimit) {
            urlIndex++;
            output['urls'][urlIndex] = urlPrefix;
            urlCounter = 0;
            console.log(`Processed a full set of ${urlLimit} items.`);
        }
      }
    }
    
    // Omit the final entry, if the limit is a factor of the number of apps
    if (output['urls'][urlIndex] == urlPrefix) {
        output['urls'].pop();
    }
    return output;
}

/** Returns the Steam API extraction result from a given configuration.
 *
 * @param {Object} axiosInstance: An Axios instance used to make web requests.
 * @param {Object} config: A configuration that was returned from `getConfigData()`.
 * @returns {Promise} A promise which returns an object containing Steam API data pertaining to the queried apps.
 */
export function processConfigData(axiosInstance: any, config: any) {
    let promises = [];
    for (let i = 0; i < config['urls'].length; i++) {
        promises.push(axiosInstance.get(config['urls'][i]).catch(console.error));
        console.log(`${promises.length} promise(s) are queued.`);
    }
    
    let itemMapping = {};
    return Promise.all(promises).then(function(results) {
        results.forEach(function(response){
            let endpointData = response.data.response;

            if (endpointData.total_count > endpointData.count) {
                console.warn(`WARNING! Pagination is required to access remaining data. Got ${endpointData.total_count} total items.`);
            }

            if (endpointData.definitions) {
                endpointData.definitions.forEach(function(item) {
                    // Initial item mapping setup when adding items to this app for the first time
                    if (!itemMapping[`${item.appid}`]) {
                        itemMapping[`${item.appid}`] = {
                            'name': config['app'][`${item.appid}`]['name'],
                            'items': [],
                            'pointsShopUrl': config['app'][`${item.appid}`]['pointsShopUrl'],
                        };
                    }
                    // Add extra info about the app, since this is available from the response and discarding all this hard-earned data would be wasteful
                    itemMapping[`${item.appid}`]['items'].push({
                        'name': item.community_item_data.item_name, // This is more consistent than item_title, especially when for Item Bundles
                        'itemType': getCommunityItemType(item.community_item_class),
                        'cost': item.point_cost,
                        'pointsShopUrl': getPointShopClusterUrl(itemMapping[`${item.appid}`]['pointsShopUrl'], item.community_item_class),
                        'imageUrl': getImageUrl(`${item.appid}`, item.community_item_data.item_image_large, item.community_item_class),
                    });
                });
            }
        });
    }).then(function() {
        return itemMapping;
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
        case 0: return 'Item Bundle';
        case 8: return 'Special Profile';
        case 16: return 'Steam Deck Keyboard';
        case 12: return 'Chat Effect';
        case 17: return 'Steam Startup Movie';
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
        case 0: return `${clusterUrl}0`;
        case 8: return `${clusterUrl}1`;
        case 16: return `${clusterUrl}8`;
        case 12: return 'https://store.steampowered.com/points/shop/c/chateffects'; // Chat effects are currently bundled all on the same page
        case 17: return `${clusterUrl}9`;
    }
    return clusterUrl;
}

function getImageUrl(appId: string, imageNameWithExtension: string, itemClass: number) {
    switch(itemClass) {
        case 15:
        case 14:
        case 13:
        case 11:
        case 8:
        case 16:
        case 12:
        case 17:
        case 4: return `https://cdn.akamai.steamstatic.com/steamcommunity/public/images/items/${appId}/${imageNameWithExtension}`;
        case 3: return `https://steamcommunity.com/economy/profilebackground/items/${appId}/${imageNameWithExtension}`;
        case 0: return ''; // Item bundles reuse an existing image, which is not provided through the Steam API
    }
    return '';
}

/** Generates configuration information from the app list data from the Steam API GetAppList v2 endpoint.
 *
 * @param {Object[]} appList: A list of objects with the "appid" and "name" properties.
 * @returns {Object} An object containing general info about each app, and the Steam API URL's to query.
 */
export function getConfigDataFromAppList(appList: any) {
    let output = {
        app: {}
    };

    console.log(`Processing ${appList.length} apps.`);
    for (let i = 0; i < appList.length; i++) {
        let appid = appList[i].appid;
        output.app[`${appid}`] = {
            'name': appList[i].name,
            'pointsShopUrl': `https://store.steampowered.com/points/shop/app/${appid}`
        };
    }

    console.log('Config construction complete.');
    return output;
}

/** Returns the Steam API extraction result from a given configuration, accessing paginated data where necessary.
 *
 * @param {Object} axiosInstance: An Axios instance used to make web requests.
 * @param {Object} itemMapping: An object containing the cumulative result of each page of data from the Steam API.
 * @param {Object} config: A configuration that was returned from `getConfigDataFromAppList()`.
 * @param {string} baseUrl: The main endpoint URL being queried.
 * @param {string} cursor: A cursor used to view a specific page of data.
 * @returns {Promise} A promise which returns an object containing Steam API data.
 */
export function processConfigDataRecursive(axiosInstance: any, itemMapping: any, config: any, baseUrl: string, cursor: string) {
    const url = `${baseUrl}&cursor=${cursor}`;
    console.log(`Getting data from ${url}`);
    return Promise.resolve(axiosInstance.get(url))
                  .then(function(results){
                      let endpointData = results.data.response;

                      if (endpointData.count <= 0) {
                          return itemMapping;
                      }

                      endpointData.definitions.forEach(function(item) {
                          // App ID did not show up in the list of apps from the Steam API, so use the ID as a fallback name
                          if (!config['app'][`${item.appid}`]) {
                              config['app'][`${item.appid}`] = {
                                  'name': `${item.appid}`,
                                  'pointsShopUrl': `https://store.steampowered.com/points/shop/app/${item.appid}`
                              };
                          }

                          // Initial item mapping setup when adding items to this app for the first time
                          if (!itemMapping[`${item.appid}`]) {
                              itemMapping[`${item.appid}`] = {
                                  'name': config['app'][`${item.appid}`]['name'],
                                  'items': [],
                                  'pointsShopUrl': config['app'][`${item.appid}`]['pointsShopUrl'],
                              };
                          }
                          // Add extra info about the app, since this is available from the response and discarding all this hard-earned data would be wasteful
                          itemMapping[`${item.appid}`]['items'].push({
                              'name': item.community_item_data.item_name, // This is more consistent than item_title, especially when for Item Bundles
                              'itemType': getCommunityItemType(item.community_item_class),
                              'cost': item.point_cost,
                              'pointsShopUrl': getPointShopClusterUrl(itemMapping[`${item.appid}`]['pointsShopUrl'], item.community_item_class),
                              'imageUrl': getImageUrl(`${item.appid}`, item.community_item_data.item_image_large, item.community_item_class),
                          });
                      });

                      return processConfigDataRecursive(axiosInstance, itemMapping, config, baseUrl, encodeURIComponent(endpointData.next_cursor));
                  })
                  .catch(console.error); // Error handling
}
