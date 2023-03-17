import { getConfigData, processConfigData, getConfigDataFromAppList, processConfigDataRecursive } from './utils';
import axios from 'axios';

jest.mock('axios');

describe('Utils unit tests', () => {
    describe('Configuration construction', () => {
        test('should generate normal config', () => {
           const responseData = `
           <select>
             <option value='1435780'>Farm Frenzy Refreshed</option>
           </select>
           `;
           const config = getConfigData(responseData, 'https://api.steampowered.com?count=100', 2);
           const configItem = config.app['1435780'];
           expect(configItem).toBeDefined();
           expect(configItem.name).toEqual('Farm Frenzy Refreshed');
           expect(configItem.pointsShopUrl).toEqual('https://store.steampowered.com/points/shop/app/1435780');
           expect(config.urls).toEqual(['https://api.steampowered.com?count=100&appids[0]=1435780']);
        });

        test('should handle empty app', () => {
           const responseData = `
           <select>
             <option value=''></option>
           </select>
           `;
           const config = getConfigData(responseData, 'https://api.steampowered.com?count=100', 2);
           expect(config.app).toEqual({});
           expect(config.urls).toEqual([]);
        });

        test("should disperse apps into multiple URL's", () => {
           const responseData = `
           <select>
             <option value='1435780'>Farm Frenzy Refreshed</option>
             <option value='440'>Team Fortress 2</option>
             <option value='92800'>SpaceChem</option>
           </select>
           `;
           const config = getConfigData(responseData, 'https://api.steampowered.com?count=100', 2);
           expect(config.app['1435780']).toBeDefined();
           expect(config.app['440']).toBeDefined();
           expect(config.urls.length).toEqual(2);
           expect(config.urls[0]).toEqual('https://api.steampowered.com?count=100&appids[0]=1435780&appids[1]=440');
           expect(config.urls[1]).toEqual('https://api.steampowered.com?count=100&appids[0]=92800');
        });

        test('should remove extra text in app ID if required', () => {
           const responseData = `
           <select>
             <option value='app-1435780'>Farm Frenzy Refreshed</option>
           </select>
           `;
           const config = getConfigData(responseData, 'https://api.steampowered.com?count=100', 2, /\d+/);
           const configItem = config.app['1435780'];
           expect(configItem).toBeDefined();
        });

        test('should remove duplicate app ID', () => {
           const responseData = `
           <select>
             <option value='app-1435780'>Farm Frenzy Refreshed</option>
             <option value='app-1435780#goty'>Farm Frenzy Refreshed - Game of the Year Edition</option>
           </select>
           `;
           const config = getConfigData(responseData, 'https://api.steampowered.com?count=100', 2, /\d+/);
           const configItem = config.app['1435780'];
           expect(configItem).toBeDefined();
           // Ensure the correct single app was selected, even though both may very well be valid apps
           expect(configItem.name).toEqual('Farm Frenzy Refreshed');
        });

        test("should handle empty page data", () => {
           const responseData = '';
           const config = getConfigData(responseData, 'https://api.steampowered.com?count=100', 1);
           expect(config.app).toEqual({});
           expect(config.urls).toEqual([]);
        });
    });

    describe('Configuration processing', () => {
        test('should handle single app', () => {
            axios.get = jest.fn().mockResolvedValue({
                data: {
                    response: {
                        definitions: [{'appid':1435780,'defid':123033,'type':1,'community_item_class':11,'community_item_type':24,'point_cost':'1000','timestamp_created':1625205994,'timestamp_updated':1626057643,'timestamp_available':0,'timestamp_available_end':0,'quantity':'1','internal_description':'FFpiggy','active':true,'community_item_data':{'item_name':'Mr. Fancy Pig','item_title':'Mr. Fancy Pig','item_description':"Hey, look! It's a plump piggy in a flat hat!",'item_image_small':'e331c234f9c241118eff464a4a575da99625af91.png','item_image_large':'f33d61a2ca4488fa7729c5a8c88421f8d0181288.png','animated':true},'usable_duration':0,'bundle_discount':0}],
                        total_count: 1,
                        count: 1
                    }
                }
            });

            let config = {
                'urls': ['datrandomurl'],
                'app': {
                    '1435780': {
                        'name': 'Farm Frenzy Refreshed',
                        'pointsShopUrl': 'https://store.steampowered.com/points/shop/app/1435780'
                    }
                }
            };

            processConfigData(axios, config).then(data => {
                const app = data['1435780'];
                expect(app.name).toEqual('Farm Frenzy Refreshed');
                expect(app.items.length).toEqual(1);
                expect(app.items[0].name).toEqual('Mr. Fancy Pig');
                expect(app.items[0].itemType).toEqual('Animated Sticker');
                expect(app.items[0].cost).toEqual('1000');
                expect(app.items[0].pointsShopUrl).toEqual('https://store.steampowered.com/points/shop/app/1435780/cluster/6');
                expect(app.items[0].imageUrl).toEqual('https://cdn.akamai.steamstatic.com/steamcommunity/public/images/items/1435780/f33d61a2ca4488fa7729c5a8c88421f8d0181288.png');
            });
        });

        test('should handle single app with multiple items', () => {
            axios.get = jest.fn().mockResolvedValue({
                data: {
                    response: {
                        definitions: [{'appid':1435780,'defid':123033,'type':1,'community_item_class':11,'community_item_type':24,'point_cost':'1000','timestamp_created':1625205994,'timestamp_updated':1626057643,'timestamp_available':0,'timestamp_available_end':0,'quantity':'1','internal_description':'FFpiggy','active':true,'community_item_data':{'item_name':'Mr. Fancy Pig','item_title':'Mr. Fancy Pig','item_description':"Hey, look! It's a plump piggy in a flat hat!",'item_image_small':'e331c234f9c241118eff464a4a575da99625af91.png','item_image_large':'f33d61a2ca4488fa7729c5a8c88421f8d0181288.png','animated':true},'usable_duration':0,'bundle_discount':0},
                        {'appid':1435780,'defid':123032,'type':1,'community_item_class':11,'community_item_type':23,'point_cost':'1000','timestamp_created':1625206291,'timestamp_updated':1626057643,'timestamp_available':0,'timestamp_available_end':0,'quantity':'1','internal_description':'ААhorsy','active':true,'community_item_data':{'item_name':'Horsing around','item_title':'Horsing around','item_description':'Feel the groove!','item_image_small':'9e4cff3b53ea7d6967306d9c75e1d91a75dc8e39.png','item_image_large':'ca6214edb9a7317086517f186942845c37869bd3.png','animated':true},'usable_duration':0,'bundle_discount':0}],
                        total_count: 1,
                        count: 1
                    }
                }
            });

            let config = {
                'urls': ['datrandomurl'],
                'app': {
                    '1435780': {
                        'name': 'Farm Frenzy Refreshed',
                        'pointsShopUrl': 'https://store.steampowered.com/points/shop/app/1435780'
                    }
                }
            };

            processConfigData(axios, config).then(data => {
                const app = data['1435780'];
                expect(app.items.length).toEqual(2);
                expect(app.items[0].name).toEqual('Mr. Fancy Pig');
                expect(app.items[1].name).toEqual('Horsing around');
            });
        });

        test('should handle empty response from Steam API', () => {
            axios.get = jest.fn().mockResolvedValue({
                data: {
                    response: {
                        total_count: 1,
                        count: 0
                    }
                }
            });

            let config = {
                'urls': ['datrandomurl'],
                'app': {
                    '1435780': {
                        'name': 'Farm Frenzy Deluxe',
                        'pointsShop': 'https://store.steampowered.com/points/shop/app/1435780'
                    }
                }
            };

            processConfigData(axios, config).then(data => {
                expect(data).toEqual({});
            });
        });

        test('should handle empty configuration', () => {
            axios.get = jest.fn().mockResolvedValue({
                data: {
                    response: {
                        total_count: 1,
                        count: 0
                    }
                }
            });

            let config = {
                'urls': [],
                'app': {}
            };

            processConfigData(axios, config).then(data => {
                expect(data).toEqual({});
            });
        });
    });

    describe('Mocked end-to-end test', () => {
        test('should feed valid config into processing function', () => {
           const responseData = `
           <select>
             <option value='1435780'>Farm Frenzy Refreshed</option>
             <option value='440'>Team Fortress 2</option>
             <option value='1263950'>The Debut Collection</option>
             <option value='1846860'>Winter Sale 2021</option>
             <option value='1675200'>Steam Deck</option>
             <option value='1195690'>Winter Sale Event 2019</option>
             <option value='756'>Steam Big Picture</option>
           </select>
           `;
           // Just take a real data sample from the Steam API and add it to the mocked response
           axios.get = jest.fn().mockResolvedValue({
               data: {
                   response: {
                       definitions: [
                       // Animated Sticker
                       {'appid':1435780,'defid':123033,'type':1,'community_item_class':11,'community_item_type':24,'point_cost':'1000','timestamp_created':1625205994,'timestamp_updated':1626057643,'timestamp_available':0,'timestamp_available_end':0,'quantity':'1','internal_description':'FFpiggy','active':true,'community_item_data':{'item_name':'Mr. Fancy Pig','item_title':'Mr. Fancy Pig','item_description':"Hey, look! It's a plump piggy in a flat hat!",'item_image_small':'e331c234f9c241118eff464a4a575da99625af91.png','item_image_large':'f33d61a2ca4488fa7729c5a8c88421f8d0181288.png','animated':true},'usable_duration':0,'bundle_discount':0},
                       // Emoticon
                       {"appid":1435780,"defid":123023,"type":1,"community_item_class":4,"community_item_type":14,"point_cost":"100","timestamp_created":1624618947,"timestamp_updated":1626057643,"timestamp_available":0,"timestamp_available_end":0,"quantity":"1","internal_description":"Pizza","active":true,"community_item_data":{"item_name":":FFpizza:","item_title":":FFpizza:","item_description":"Pizza party, everyone!","item_image_small":"c9a4a2aa6f37c387d88e79e66d1f030ae1b17890.png","item_image_large":"b86c859e3fc6b58b39eb960cc1de31866dc7cac0.png","animated":false},"usable_duration":0,"bundle_discount":0},
                       // Background
                       {"appid":1435780,"defid":123019,"type":1,"community_item_class":3,"community_item_type":10,"point_cost":"500","timestamp_created":1611223060,"timestamp_updated":1626057643,"timestamp_available":0,"timestamp_available_end":0,"quantity":"1","internal_description":"Animals","active":true,"community_item_data":{"item_name":"Animals","item_title":"Animals","item_description":"A cat on the farm is worth a bear in the bush","item_image_large":"d621f08fcb9b35cb2bfb6a2e15afa3aff9a24607.jpg","animated":false},"usable_duration":0,"bundle_discount":0},
                       // Item bundle
                       {"appid":440,"defid":105513,"type":6,"community_item_class":0,"community_item_type":0,"point_cost":"0","timestamp_created":1612913866,"timestamp_updated":1620665400,"timestamp_available":0,"timestamp_available_end":0,"quantity":"0","internal_description":"Team Fortress 2 Auto-Generated Bundle","active":true,"community_item_data":{"item_name":"Team Fortress 2 Auto-Generated Bundle","item_title":"","item_description":""},"bundle_defids":[1468,1480,1491,1496,1506,1511,1518,1521,1529,1534,1536,1542,1547,1553,1560,1564,1570,102812,102813,102814,102815,102816,102817,102818,102819,102820,102821,102822,102823,102824,102825,102826,102827,102828,102829],"usable_duration":0,"bundle_discount":20},
                       // Mini-Profile Background
                       {"appid":1263950,"defid":79681,"type":1,"community_item_class":13,"community_item_type":50,"point_cost":"2000","timestamp_created":1600898758,"timestamp_updated":1620665370,"timestamp_available":0,"timestamp_available_end":0,"quantity":"1","internal_description":"Bunnies","active":true,"community_item_data":{"item_name":"Bunnies Mini-Profile","item_title":"Bunnies Mini-Profile","item_description":"Art by Joe Williamson.","item_image_large":"e9a0bc30602a6fa8f59fd220ef26857ccb3f381a.jpg","item_movie_webm":"caff3536fa5d8caba6163cb5eef0d8316048be7f.webm","item_movie_mp4":"b60767651d441a44fbcb1cc9d7236fcad31c36a8.mp4","animated":true},"usable_duration":0,"bundle_discount":0},
                       // Avatar Frame
                       {"appid":1263950,"defid":80071,"type":1,"community_item_class":14,"community_item_type":65,"point_cost":"2000","timestamp_created":1600898758,"timestamp_updated":1620665370,"timestamp_available":0,"timestamp_available_end":0,"quantity":"1","internal_description":"Neon","active":true,"community_item_data":{"item_name":"Neon","item_title":"Neon","item_image_small":"175875a819256fdeb4a2f4bf1b124afba6c3e2e3.png","item_image_large":"89dcb4ff7bcd5dfbfc40dd488910503f1afc9c6b.png","animated":true},"usable_duration":0,"bundle_discount":0},
                       // Animated Avatar
                       {"appid":1263950,"defid":78781,"type":1,"community_item_class":15,"community_item_type":5,"point_cost":"3000","timestamp_created":1600898758,"timestamp_updated":1620665370,"timestamp_available":0,"timestamp_available_end":0,"quantity":"1","internal_description":"Entering VR","active":true,"community_item_data":{"item_name":"Entering VR","item_title":"Entering VR","item_image_small":"4e0f9df2a984e2208844614afdfb59c8f903b7a6.gif","item_image_large":"31282c57ab27f4bc07aded27f1910f83287059c3.jpg","animated":true},"usable_duration":0,"bundle_discount":0},
                       // Special Profile
                       {"appid":1846860,"defid":150092,"type":1,"community_item_class":8,"community_item_type":13,"point_cost":"5000","timestamp_created":1641234579,"timestamp_updated":1641419301,"timestamp_available":0,"timestamp_available_end":0,"quantity":"1","internal_description":"Winter 2021","active":true,"community_item_data":{"item_name":"Winter 2021","item_title":"Winter 2021","item_image_small":"ff46ca81f6c9fcb8165bfb2b161bbe364a8d14df.jpg","item_image_large":"32161169b3224ac783dec362027afeff7b7607c2.jpg","animated":false,"profile_theme_id":"Winter2021"},"bundle_defids":[150088,150089,150091,150090],"usable_duration":0,"bundle_discount":0},
                       // Chat Effect
                       {"appid":1675200,"defid":160000,"type":1,"community_item_class":16,"community_item_type":13,"point_cost":"5000","timestamp_created":1647055151,"timestamp_updated":1647056882,"timestamp_available":0,"timestamp_available_end":0,"quantity":"1","internal_description":"Grape","active":true,"community_item_data":{"item_name":"Grape","item_title":"Grape","item_image_small":"4943f6a4483a3bb4b1147342c2a6a9b0b535efd8.png","item_image_large":"5dd1c85d418897b9a59995dfda68e4d74afc8731.png","animated":true,"profile_theme_id":"Grape"},"usable_duration":0,"bundle_discount":0},
                       {"appid":1195690,"defid":75834,"type":1,"community_item_class":12,"community_item_type":70,"point_cost":"1500","timestamp_created":1577115502,"timestamp_updated":1612915098,"timestamp_available":0,"timestamp_available_end":0,"quantity":"1","internal_description":"balloons","active":true,"community_item_data":{"item_name":"Balloons","item_title":"Balloons","item_description":"Release a cascade of balloons in chat. Ring in the new year the inflatable way!","item_image_small":"e0086370cd28c29e0fff147942c2429259e3aa8a.png","item_image_large":"e0086370cd28c29e0fff147942c2429259e3aa8a.png","animated":false},"usable_duration":0,"bundle_discount":0},
                       // Steam Startup Movie
                       {"appid":756,"defid":195306,"type":1,"community_item_class":17,"community_item_type":1,"point_cost":"3000","timestamp_created":1678998474,"timestamp_updated":1678998489,"timestamp_available":0,"timestamp_available_end":0,"quantity":"1","internal_description":"OG Big Picture","active":true,"community_item_data":{"item_name":"OG Big Picture","item_title":"OG Big Picture","item_image_small":"ea4e6a32249db4d57ef4ee393f9ca29210d1479c.png","item_image_large":"ea4e6a32249db4d57ef4ee393f9ca29210d1479c.png","item_movie_webm":"bade616401392739e67eb00ff2b43750da0316ec.webm","item_movie_webm_small":"5ccce40a3d09c713a62d0a14d97da577c4ee2bd1.webm","animated":false},"usable_duration":0,"bundle_discount":0},
                       // Invalid item - in this case, a limited edition badge that can no longer be found or purchased on the Points Shop.
                       // Item class has been deliberately set to -1 (it is actually 1 in Steam API).
                       {"appid":1263950,"defid":78777,"type":2,"community_item_class":-1,"community_item_type":1,"point_cost":"1000","timestamp_created":1620665352,"timestamp_updated":1620665370,"timestamp_available":0,"timestamp_available_end":0,"quantity":"1","internal_description":"The Summer Debut Badge","active":true,"community_item_data":{"item_name":"","animated":false,"badge_data":[{"level":1,"image":"740f08be972c6daeabe437a956bc6237397ee485.png"},{"level":2,"image":"d779085f334e5b1d477a36e41809109c830ecf39.png"},{"level":3,"image":"a0b90e2a1122227ae6706dbbf6a16457d363ca46.png"},{"level":4,"image":"7daf2808f1724c409875762db006373ecf1514d9.png"},{"level":5,"image":"a82e46ad0179610f89fbd9b4422d64e93c755011.png"},{"level":6,"image":"2f40f4cd8c9e0407a28de04ca40d76719c1c1021.png"},{"level":7,"image":"dc2afec0695106d589714459a44eef5ddcb5639d.png"},{"level":8,"image":"2badfaea5c5a8f5e0f425ec5b7e141ebcf213201.png"},{"level":9,"image":"eadd5afbfb858f91cccf471559fbc2dd6144a0d2.png"},{"level":10,"image":"0786523036fea921bd6ecd3e9f9969b7a88f2511.png"},{"level":11,"image":"547ef7e2e5aa5556793a67e2d60f8c0edd5b8193.png"},{"level":12,"image":"3e7047f407a86f522ae23182bb2377b5844802c7.png"},{"level":13,"image":"18aa299e361a4dd9a3c62fa96d97ceb515bb1a1d.png"},{"level":14,"image":"b235c464a6ae54dac6ebd0f67facb4f12e8f9af7.png"},{"level":15,"image":"e3e7abfc307684f256234860b8c41d0930c770fa.png"},{"level":16,"image":"55896dc2c14deca8b84ec2914cc56498a8df9f8a.png"},{"level":17,"image":"5ae95ebe1f14c3ea3024ce34884cb1a6a3d53a12.png"},{"level":18,"image":"5cda1b981cbae93e1e2729176951521a01896b7a.png"},{"level":19,"image":"61617ce9b70193e23b463448b37c2746b7726eb1.png"},{"level":20,"image":"24a62a6fa825d6b0a174675fb97a01e9df81d030.png"}]},"usable_duration":0,"bundle_discount":0}
                       ],
                       total_count: 1000,
                       count: 1000
                   }
               }
           });
           const result = {
               "440": {
                   "name": "Team Fortress 2",
                   "items": [
                       {
                           "name": "Team Fortress 2 Auto-Generated Bundle",
                           "itemType": "Item Bundle",
                           "cost": "0",
                           "pointsShopUrl": "https://store.steampowered.com/points/shop/app/440/cluster/0",
                           "imageUrl": ""
                       }
                   ],
                   "pointsShopUrl": "https://store.steampowered.com/points/shop/app/440"
               },
               "1435780": {
                   "name": "Farm Frenzy Refreshed",
                   "items": [
                       {
                           "name": "Mr. Fancy Pig",
                           "itemType": "Animated Sticker",
                           "cost": "1000",
                           "pointsShopUrl": "https://store.steampowered.com/points/shop/app/1435780/cluster/6",
                           "imageUrl": "https://cdn.akamai.steamstatic.com/steamcommunity/public/images/items/1435780/f33d61a2ca4488fa7729c5a8c88421f8d0181288.png"
                       },
                       {
                           "name": ":FFpizza:",
                           "itemType": "Emoticon",
                           "cost": "100",
                           "pointsShopUrl": "https://store.steampowered.com/points/shop/app/1435780/cluster/7",
                           "imageUrl": "https://cdn.akamai.steamstatic.com/steamcommunity/public/images/items/1435780/b86c859e3fc6b58b39eb960cc1de31866dc7cac0.png"
                       },
                       {
                           "name": "Animals",
                           "itemType": "Profile Background",
                           "cost": "500",
                           "pointsShopUrl": "https://store.steampowered.com/points/shop/app/1435780/cluster/5",
                           "imageUrl": "https://steamcommunity.com/economy/profilebackground/items/1435780/d621f08fcb9b35cb2bfb6a2e15afa3aff9a24607.jpg"
                       }
                   ],
                   "pointsShopUrl": "https://store.steampowered.com/points/shop/app/1435780"
               },
               "1846860": {
                   "name": "Winter Sale 2021",
                   "items": [
                       {
                           "name": "Winter 2021",
                           "itemType": "Special Profile",
                           "cost": "5000",
                           "pointsShopUrl": "https://store.steampowered.com/points/shop/app/1846860/cluster/1",
                           "imageUrl": "https://cdn.akamai.steamstatic.com/steamcommunity/public/images/items/1846860/32161169b3224ac783dec362027afeff7b7607c2.jpg"
                       }
                   ],
                   "pointsShopUrl": "https://store.steampowered.com/points/shop/app/1846860"
               },
               "1263950": {
                   "items": [
                       {
                           "name": "Bunnies Mini-Profile",
                           "itemType": "Mini-Profile",
                           "cost": "2000",
                           "pointsShopUrl": "https://store.steampowered.com/points/shop/app/1263950/cluster/4",
                           "imageUrl": "https://cdn.akamai.steamstatic.com/steamcommunity/public/images/items/1263950/e9a0bc30602a6fa8f59fd220ef26857ccb3f381a.jpg"
                       },
                       {
                           "name": "Neon",
                           "itemType": "Avatar Frame",
                           "cost": "2000",
                           "pointsShopUrl": "https://store.steampowered.com/points/shop/app/1263950/cluster/3",
                           "imageUrl": "https://cdn.akamai.steamstatic.com/steamcommunity/public/images/items/1263950/89dcb4ff7bcd5dfbfc40dd488910503f1afc9c6b.png"
                       },
                       {
                           "name": "Entering VR",
                           "itemType": "Animated Avatar",
                           "cost": "3000",
                           "pointsShopUrl": "https://store.steampowered.com/points/shop/app/1263950/cluster/2",
                           "imageUrl": "https://cdn.akamai.steamstatic.com/steamcommunity/public/images/items/1263950/31282c57ab27f4bc07aded27f1910f83287059c3.jpg"
                       },
                       {
                           "name": "",
                           "itemType": "",
                           "cost": "1000",
                           "pointsShopUrl": "https://store.steampowered.com/points/shop/app/1263950/cluster/",
                           "imageUrl": "",
                       },
                   ],
                   "name": "The Debut Collection",
                   "pointsShopUrl": "https://store.steampowered.com/points/shop/app/1263950",
               },
               "1675200": {
                   "name": "Steam Deck",
                   "items": [
                       {
                           "name": "Grape",
                           "itemType": "Steam Deck Keyboard",
                           "cost": "5000",
                           "pointsShopUrl": "https://store.steampowered.com/points/shop/app/1675200/cluster/8",
                           "imageUrl": "https://cdn.akamai.steamstatic.com/steamcommunity/public/images/items/1675200/5dd1c85d418897b9a59995dfda68e4d74afc8731.png"
                       }
                   ],
                   "pointsShopUrl": "https://store.steampowered.com/points/shop/app/1675200"
               },
               "1195690": {
                   "name": "Winter Sale Event 2019",
                   "items": [
                       {
                           "name": "Balloons",
                           "itemType": "Chat Effect",
                           "cost": "1500",
                           "pointsShopUrl": "https://store.steampowered.com/points/shop/c/chateffects",
                           "imageUrl": "https://cdn.akamai.steamstatic.com/steamcommunity/public/images/items/1195690/e0086370cd28c29e0fff147942c2429259e3aa8a.png"
                       }
                   ],
                   "pointsShopUrl": "https://store.steampowered.com/points/shop/app/1195690"
               },
               "756": {
                   "name": "Steam Big Picture",
                   "items": [
                       {
                           "cost": "3000",
                           "imageUrl": "https://cdn.akamai.steamstatic.com/steamcommunity/public/images/items/756/ea4e6a32249db4d57ef4ee393f9ca29210d1479c.png",
                           "itemType": "Steam Startup Movie",
                           "name": "OG Big Picture",
                           "pointsShopUrl": "https://store.steampowered.com/points/shop/app/756/cluster/9",
                       },
                   ],
                   "pointsShopUrl": "https://store.steampowered.com/points/shop/app/756",
               },
           };

           const config = getConfigData(responseData, 'https://api.steampowered.com?count=100', 10);
           processConfigData(axios, config).then(data => {
               expect(data).toEqual(result);
           });
        });
    });
});

describe('Utils (alternate implementation) unit tests', () => {
    describe('Configuration construction', () => {
        test('should generate normal config', () => {
            const config = getConfigDataFromAppList([
                {'appid':1881330,'name':'Lunar New Year Pack'}
            ]);
            const configItem = config.app['1881330'];
            expect(configItem).toBeDefined();
            expect(configItem.name).toEqual('Lunar New Year Pack');
            expect(configItem.pointsShopUrl).toEqual('https://store.steampowered.com/points/shop/app/1881330');
        });

        test('should handle empty app list', () => {
            const config = getConfigDataFromAppList([]);
            expect(config).toEqual({'app': {}});
        });
    });

    describe('Configuration processing', () => {
        test('should handle empty response from Steam API', () => {
            axios.get = jest.fn().mockResolvedValue({
                data: {
                    response: {
                        total_count: 0,
                        count: 0
                    }
                }
            });

            const config = {
                'app': {
                    '1435780': {
                        'name': 'Farm Frenzy Refreshed',
                        'pointsShop': 'https://store.steampowered.com/points/shop/app/1435780'
                    }
                }
            };

            processConfigDataRecursive(axios, {}, config, 'https://api.steampowered.com?', '').then(data => {
                expect(data).toEqual({});
            });
        });

        test('should handle single page from Steam API', () => {
            axios.get = jest.fn().mockResolvedValueOnce({
                data: {
                    response: {
                        definitions: [{'appid':1435780,'defid':123033,'type':1,'community_item_class':11,'community_item_type':24,'point_cost':'1000','timestamp_created':1625205994,'timestamp_updated':1626057643,'timestamp_available':0,'timestamp_available_end':0,'quantity':'1','internal_description':'FFpiggy','active':true,'community_item_data':{'item_name':'Mr. Fancy Pig','item_title':'Mr. Fancy Pig','item_description':"Hey, look! It's a plump piggy in a flat hat!",'item_image_small':'e331c234f9c241118eff464a4a575da99625af91.png','item_image_large':'f33d61a2ca4488fa7729c5a8c88421f8d0181288.png','animated':true},'usable_duration':0,'bundle_discount':0}],
                        total_count: 1,
                        count: 1,
                        next_cursor: 'Que?'
                    }
                }
            }).mockResolvedValue({
                data: {
                    response: {
                        total_count: 1,
                        count: 0
                    }
                }
            });

            const config = {
                'app': {
                    '1435780': {
                        'name': 'Farm Frenzy Refreshed',
                        'pointsShopUrl': 'https://store.steampowered.com/points/shop/app/1435780'
                    }
                }
            };

            processConfigDataRecursive(axios, {}, config, 'https://api.steampowered.com?', '').then(data => {
                expect(data).toEqual({
                    '1435780': {
                        'name': 'Farm Frenzy Refreshed',
                        'pointsShopUrl': 'https://store.steampowered.com/points/shop/app/1435780',
                        'items': [
                            {
                                'name': 'Mr. Fancy Pig',
                                'itemType': 'Animated Sticker',
                                'cost': '1000',
                                'pointsShopUrl': 'https://store.steampowered.com/points/shop/app/1435780/cluster/6',
                                'imageUrl': 'https://cdn.akamai.steamstatic.com/steamcommunity/public/images/items/1435780/f33d61a2ca4488fa7729c5a8c88421f8d0181288.png'
                            }
                        ]
                    }
                });
            });
        });

        test('should handle unknown app ID in config', () => {
            axios.get = jest.fn().mockResolvedValueOnce({
                data: {
                    response: {
                        definitions: [{'appid':1435780,'defid':123033,'type':1,'community_item_class':11,'community_item_type':24,'point_cost':'1000','timestamp_created':1625205994,'timestamp_updated':1626057643,'timestamp_available':0,'timestamp_available_end':0,'quantity':'1','internal_description':'FFpiggy','active':true,'community_item_data':{'item_name':'Mr. Fancy Pig','item_title':'Mr. Fancy Pig','item_description':"Hey, look! It's a plump piggy in a flat hat!",'item_image_small':'e331c234f9c241118eff464a4a575da99625af91.png','item_image_large':'f33d61a2ca4488fa7729c5a8c88421f8d0181288.png','animated':true},'usable_duration':0,'bundle_discount':0}],
                        total_count: 1,
                        count: 1,
                        next_cursor: 'Que?'
                    }
                }
            }).mockResolvedValue({
                data: {
                    response: {
                        total_count: 1,
                        count: 0
                    }
                }
            });

            const config = {
                'app': {}
            };

            processConfigDataRecursive(axios, {}, config, 'https://api.steampowered.com?', '').then(data => {
                expect(data).toEqual({
                    '1435780': {
                        'name': '1435780',
                        'pointsShopUrl': 'https://store.steampowered.com/points/shop/app/1435780',
                        'items': [
                            {
                                'name': 'Mr. Fancy Pig',
                                'itemType': 'Animated Sticker',
                                'cost': '1000',
                                'pointsShopUrl': 'https://store.steampowered.com/points/shop/app/1435780/cluster/6',
                                'imageUrl': 'https://cdn.akamai.steamstatic.com/steamcommunity/public/images/items/1435780/f33d61a2ca4488fa7729c5a8c88421f8d0181288.png'
                            }
                        ]
                    }
                });
            });
        });
    });
});