import { fireEvent, getByText } from '@testing-library/dom'; // Available matchers: https://testing-library.com/docs/react-testing-library/cheatsheet/
import '@testing-library/jest-dom/extend-expect'; // Available querying interfaces: https://github.com/testing-library/jest-dom#table-of-contents
import { JSDOM } from 'jsdom';
import fs from 'fs';
import path from 'path';

// This file is largely based on the experimental work done by Tyler Hawkins
// which attempts to unit test a static HTML file using modern testing mechanisms.
// See https://github.com/thawkin3/dom-testing-demo

const html = fs.readFileSync(path.resolve(__dirname, '../docs/index.html'), 'utf8');
let jsdom;
let container;

describe('Frontend tests', () => {
    beforeEach(() => {
        // Need to load the page 'dangerously' so that the JavaScript is loaded as well.
        // Since the page isn't loading any third party scripts and such, this should be negligible.
        jsdom = new JSDOM(html, { runScripts: 'dangerously' });
        container = jsdom.window.document.body;

        // App data has to be attached to the global scope of the mocked DOM so that the JavaScript can access it.
        // Using the Jest global variables means that the data is only available in the tests and not the page itself.
        jsdom.window.globalThis.APPDATA = {
            1435780: {
                name: 'Farm Frenzy Refreshed',
                pointsShopUrl: 'https://store.steampowered.com/points/shop/app/1435780',
                items: [
                    {
                        cost: '1000',
                        imageUrl: 'https://cdn.akamai.steamstatic.com/steamcommunity/public/images/items/1435780/e92b1d8a09cb52fbab6d51db5bea8ec3b8d5c251.png',
                        itemType: 'Animated Sticker',
                        name: 'Ducky Quack',
                        pointsShopUrl: 'https://store.steampowered.com/points/shop/app/1435780/cluster/6'
                    }
                ]
            },
            440: {
                name: 'Team Fortress 2',
                pointsShopUrl: 'https://store.steampowered.com/points/shop/app/440',
                items: [
                    {
                        cost: '100',
                        imageUrl: 'https://cdn.akamai.steamstatic.com/steamcommunity/public/images/items/440/0b10791bf70f6044627abea9e839ca65bed68bb3.png',
                        itemType: 'Emoticon',
                        name: ':sticky:',
                        pointsShopUrl: 'https://store.steampowered.com/points/shop/app/440/cluster/7'
                    }
                ]
            }
        };
    });

    function search(searchText: string) {
        container.querySelector('#searchInput').value = searchText;
        fireEvent.click(getByText(container, 'Search'));
    }

    test('should render key page components', () => {
       expect(container.querySelector('#searchInput')).not.toBeNull();
       expect(getByText(container, 'Search')).toBeInTheDocument();
       expect(container.querySelector('#searchMode')).not.toBeNull();
       expect(container.querySelector('#sortMode')).not.toBeNull();
    });

    describe('Valid search text', () => {
        test('should perform basic search', () => {
            search('quack');
            // Expect the header row with a single item match
            expect(container.querySelectorAll('tr').length).toBe(2);
            expect(getByText(container, 'Farm Frenzy Refreshed')).toBeInTheDocument();
        });

        test('should perform search with preserved padded whitespace', () => {
            search('cky ');
            // A valid use case is searching for an item where only one of the words in the name
            // is known. Thus, a user may want to search for said word followed by whitespace
            // to limit results to only items whose names are composed of multiple words.
            expect(container.querySelectorAll('tr').length).toBe(2);
            expect(getByText(container, 'Farm Frenzy Refreshed')).toBeInTheDocument();
        });

        test('should perform search with multiple matches', () => {
            search('ck');
            // Expect the header row with more item matches
            expect(container.querySelectorAll('tr').length).toBe(3);
            expect(getByText(container, 'Farm Frenzy Refreshed')).toBeInTheDocument();
            expect(getByText(container, 'Team Fortress 2')).toBeInTheDocument();
        });

        test('should perform search without results', () => {
            search('♠♦♥♣');
            // Expect the header row only, but not to be confused with an invalid search
            expect(container.querySelectorAll('tr').length).toBe(1);
            expect(container.querySelector('#searchValidationError')).not.toBeVisible();
        });
    });

    describe('Invalid search text', () => {
        function expectInvalidSearch() {
           expect(container.querySelector('#searchValidationError')).toBeVisible();
           expect(container.querySelectorAll('tr').length).toBe(1); 
        }

        test('should prevent empty search text', () => {
           search('');
           expectInvalidSearch();
        });

        test('should prevent whitespace-only search text', () => {
           search('   ');
           expectInvalidSearch();
        });

        test('should prevent unreasonably short search text', () => {
           search('o');
           expectInvalidSearch();
        });

        test('should prevent unreasonably long search text', () => {
           search('o'.repeat(256));
           expectInvalidSearch();
        });
    });

    describe('Search options', () => {
        function setSearchMode(sortMode: string) {
            container.querySelector('#searchMode').value = sortMode;
        }

        test('should perform search by item name', () => {
            setSearchMode('itemName');
            search('STICK');
            const rows = container.querySelectorAll('tr');
            expect(rows.length).toBe(2);
            expect(rows[1].cells[2].innerText).toEqual(':sticky:');
        });

        test('should perform search by app name', () => {
            setSearchMode('appName');
            search('Team');
            // Expect the header row with a single item match
            const rows = container.querySelectorAll('tr');
            expect(rows.length).toBe(2);
            expect(rows[1].cells[0]).toHaveTextContent('Team Fortress 2');
        });
    });

    describe('Sort options', () => {
        function setSortMode(sortMode: string) {
            container.querySelector('#sortMode').value = sortMode;
        }

        test('should sort results by cost', () => {
            setSortMode('itemCost');
            search('ck');
            const rows = container.querySelectorAll('tr');
            expect(rows.length).toBe(3);
            // Expect the cheapest items to be listed first
            expect(rows[1].cells[4].innerText).toEqual('100');
            expect(rows[2].cells[4].innerText).toEqual('1000');
        });

        test('should sort results by item type', () => {
            setSortMode('itemType');
            search('ck');
            const rows = container.querySelectorAll('tr');
            expect(rows.length).toBe(3);
            expect(rows[1].cells[3].innerText).toEqual('Animated Sticker');
            expect(rows[2].cells[3].innerText).toEqual('Emoticon');
        });

        test('should sort results by item name', () => {
            setSortMode('itemName');
            search('ck');
            const rows = container.querySelectorAll('tr');
            expect(rows.length).toBe(3);
            // Emoticons always start with a colon, so they should always appear first
            expect(rows[1].cells[2].innerText).toEqual(':sticky:');
            expect(rows[2].cells[2].innerText).toEqual('Ducky Quack');
        });

        test('should sort results by app name', () => {
            setSortMode('appName');
            search('ck');
            const rows = container.querySelectorAll('tr');
            expect(rows.length).toBe(3);
            expect(rows[1].cells[0]).toHaveTextContent('Farm Frenzy Refreshed');
            expect(rows[2].cells[0]).toHaveTextContent('Team Fortress 2');
        });
    });
});
