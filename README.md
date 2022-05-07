# Steam Points Shop Search

Makeshift search function for the Steam Points Shop, localised entirely within your web browser.
**Check it out here: https://daniel-tran.github.io/steam-points-shop-search/**

You can also read the technical notes about how this search functionality has been implemented here: https://github.com/daniel-tran/steam-points-shop-search/wiki

# How to run locally

## Setup

1. Node 16.13.2 or higher
2. Npm 8.1.2 or higher (should already be included with the standard Node installer)

## Generating search data

After cloning or downloading a copy of this repository:

1. Open a Command Prompt and navigate to the folder containing this code base.
2. Execute `npm run install` - This install the various module dependencies utilised by the underlying code.
3. Execute `npm run start` - This starts the process for generating a set of search data. You can expect this to take a couple of minutes to complete, depending on your computer.

_Note that this process has only been tested on Windows._

Afterwards, you can load "index.html" into your browser and start using your freshly generated search data.

# FAQ

## Why I can't find a particular item?

This can be due to, but not strictly limited to:

1. The item has been removed from the Points Shop.
2. The item is only available through the Steam Community Market. For example, the [Holiday Sale 2015 cookie emoticon](https://steamcommunity.com/market/listings/753/425280-%3A2015cookie%3A).
3. The data file in this repository has not been updated.
4. Something is wrong with your search text.

## Why aren't the cost of Item Bundles shown properly?

For some unknown reason, the Steam API data sets the cost of item bundles to 0, and it's generally easier to have the user find the item bundle's price on the specific app's Points Shop page rather than manually calculating the cost through data aggregation.

## Steam does has an official search function for the Points Shop. Why would I want to use this search tool?

The in-built Points Shop search function provided by Valve might be all you need but it is particularly limiting, given that it will only search based on games that you currently own. Also, you need to be logged into Steam in order to use the in-built search function.

This tool aims to provide a more robust searching capability, particularly around finding individual items, with some basic sorting criteria.

If the in-built search mechanism for the Points Shop is improved such that it matches or supercedes what this tool has to offer, then this repository will mostly likely be archived and cease being hosted via GitHub Pages.

# Disclaimer

This open source project is not endorsed by nor affiliated with Valve or Steam.
