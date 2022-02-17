import { getConfigData, processConfigData } from './utils';
import axios from 'axios';

jest.mock('axios');

describe('Utils unit tests', () => {
    describe('Configuration construction', () => {
        test('should generate normal config', () => {
           //
        });

        test("should disperse apps into multiple URL's", () => {
           //
        });

        test("should handle empty page data", () => {
           //
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
});
