# ac3prototype — Naraguta Sheet 168 lookup

Search for a place, click the map, or enter WGS84 latitude and longitude to retrieve the nearest cell from `Sheet168_Naraguta_K_Th_U_All_Data_FIXED.xlsx`.

## Data and matching

- 439 columns × 442 rows = 194,038 aligned cells for each of Potassium, Thorium, and Uranium.
- Grid coordinates use WGS84 / UTM zone 32N (EPSG:32632), spaced 125 metres apart.
- `proj4` converts the requested longitude/latitude into grid coordinates. The lookup rounds to the nearest cell centre, within half-cell coverage at the edges. Outside locations return HTTP 404.
- Values retain the workbook's full numeric precision and signs. The workbook specifies no data units; the app does not assign percent or ppm or infer tin grades from these raw values.
- Results identify the source workbook, Excel cell address (the same address in all three Grid tabs), selected coordinates, matched centre, and distance in metres.
- Searches use Nominatim's returned coordinates, not approximate local area midpoints. Place names require internet access; direct coordinate and map lookups use the bundled sheet data.
- The map displays at most 1,000 sample points for performance. Every lookup uses the full grid.
- Missing or corrupt data returns an error. No random, simulated online, or AI-generated mineral values are substituted. Legacy AI helper modules are not used by the lookup API.

## Run

```sh
npm ci
npm run dev
```

No API keys or environment variables are required for sheet lookups. Node.js 24 is pinned in `package.json`. Fonts use the system font stack, so builds do not download fonts.

## Deploy to Vercel

1. Commit and push the app changes, including `data/naraguta.bin`, `data/naraguta.json`, and `scripts/`. The runtime does not need the Excel file or Python.
2. Import the Git repository into Vercel and set **Root Directory** to **`arum-alpha`**.
3. Use the **Next.js** framework preset. Leave the output directory at its default. `vercel.json` sets the install command to `npm ci` and the build command to `npm run build`.
4. To enable AI summaries and recommendations, set **GROQ_API_KEY** to your private Groq key in Vercel. Optionally set **GROQ_MODEL** (default: `llama-3.3-70b-versatile`). Click **Deploy**. Without a working key, the app uses a labelled local summary.

AI interpretations use exact grid readings and surrounding averages; they never replace the measured grid values. An unavailable service or invalid AI response falls back to local analysis. Grade, risk, confidence, and model-performance sections show unavailable status until a validated prediction model is supplied. Raw-value ratios are provided separately.

The build checks the data checksum and verifies that both API function traces include the 4.4 MiB workbook export. Missing data stops deployment instead of producing incorrect results.

To verify locally before deployment:

```sh
npm ci
npm run lint
npm test
npm run build
npm run test:production
```

The production smoke test launches `next start` on a temporary port, checks the page, data API, workbook values, invalid input, and out-of-coverage behavior, then stops the server. Search and map tiles use external OpenStreetMap services at runtime; numeric sheet lookups do not depend on those services.

Vercel references: [Root Directory and build settings](https://vercel.com/docs/builds/configure-a-build#root-directory), [bundling files in Next.js functions](https://vercel.com/kb/guide/how-can-i-use-files-in-serverless-functions), [Node.js versions](https://vercel.com/docs/functions/runtimes/node-js/node-js-versions).

## Update the workbook data

The original workbook remains untouched. The runtime reads a validated binary export (three float64 values per cell, row-major, little-endian). The metadata records the workbook and export SHA-256 hashes. Both generated files must be included in deployment; Next.js file tracing explicitly includes the binary.

With Python and `openpyxl` installed, from this directory:

```sh
python scripts/import-naraguta.py ../Sheet168_Naraguta_K_Th_U_All_Data_FIXED.xlsx
python scripts/verify-naraguta.py ../Sheet168_Naraguta_K_Th_U_All_Data_FIXED.xlsx
npm test
```

Restart the server after replacing the export because data is cached per process. Verification compares all 582,114 values and the coordinate axes to Excel. The regression tests check every cell's coordinate round trip, coverage, exact API values, determinism, and invalid input.
