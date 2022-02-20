# Steam Points Shop Search

Makeshift search function for the Steam Points Shop, localised entirely within your web browser.
**Check it out here: https://daniel-tran.github.io/steam-points-shop-search/**

You can also read the technical notes about how this search functionality has been implemented here: https://github.com/daniel-tran/steam-points-shop-search/wiki

# FAQ

## Why I can't find a particular item?

This can be due to, but not strictly limited to:

1. The item has been removed from the Points Shop.
2. The item is only available through the Steam Community Market. For example, the [Holiday Sale 2015 cookie emoticon](https://steamcommunity.com/market/listings/753/425280-%3A2015cookie%3A).
3. The data file in this repository has not been updated.
4. Something is wrong with your search text.

## Why aren't the cost of Item Bundles shown properly?

For some unknown reason, the Steam API data sets the cost of item bundles to 0, and it's generally easier to have the user find the item bundle's price on the specific app's Points Shop page rather than manually calculating the cost through data aggregation.

## What will happen once Steam introduces an official search function for the Points Shop?

If that ever happens, then this repository will mostly likely be archived and cease being hosted via GitHub Pages.
