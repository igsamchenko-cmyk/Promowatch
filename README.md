# PromoWatch UA

Dashboard for comparing current promotional prices in Ukrainian supermarkets, focused on Lviv.

Live site after GitHub Pages is enabled:

`https://igsamchenko-cmyk.github.io/Promowatch/`

## Publish

1. Upload all files from this folder to the root of the `igsamchenko-cmyk/Promowatch` repository.
2. Open repository settings: `Settings -> Pages`.
3. Set `Source` to `Deploy from a branch`.
4. Select branch `main` and folder `/root`.
5. Save and wait for GitHub Pages to publish the site.

## Auto Update

The workflow in `.github/workflows/update-promos.yml` can refresh `data/deals.json` every day and can also be run manually from the repository's `Actions` tab.

The dashboard is static, so visitors only need the public GitHub Pages link. They do not need to download files.
