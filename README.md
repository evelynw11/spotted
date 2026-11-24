# Spotted

Spotted analyzes an image you upload and searches a local collection of clothing photos for visually similar garments. It does not ship with fictional product listings, brands, prices, material claims, or outfit suggestions.

## Requirements

- macOS 14 or later with Apple Command Line Tools
- Python 3.11 or later
- Node.js 16.9 or later
- Kaggle account and official Kaggle CLI authentication
- AWS CLI v2 configured with a profile that can invoke Amazon Bedrock

## Set up the full-resolution Kaggle dataset

The app uses the full-resolution [Kaggle Clothing Dataset](https://www.kaggle.com/datasets/agrigorev/clothing-dataset-full), released under CC0. It is about 7 GB; allow roughly 14 GB of free disk space while downloading and importing it.

```bash
python3 -m venv .venv
source .venv/bin/activate
python -m pip install -r requirements.txt
kaggle auth login
python scripts/prepare-dataset.py
```

`kaggle auth login` opens Kaggle's authentication flow. Alternatively, configure a Kaggle API token outside this repository. Never commit Kaggle credentials. To use a ZIP you downloaded yourself, pass `--zip /path/to/clothing-dataset-full.zip` to the preparation script.

The script imports the full-resolution `images/` files, creates a category-only catalog, and builds the local Apple Vision index. The dataset and generated index are kept in the ignored `reference-data/` directory. On successful indexing, old image files not in the Kaggle catalog are removed. Image matching runs locally; uploaded images are sent to Bedrock only when you search.

## Run Spotted

Set `your-profile` to an AWS CLI profile with `bedrock:InvokeModel` access:

```bash
BEDROCK_VISION=1 AWS_PROFILE=your-profile AWS_REGION=us-east-1 node server.js
```

Open [http://127.0.0.1:4173](http://127.0.0.1:4173). Upload an image and select **Find similar items**. Press **Ctrl+C** in the terminal to stop the server.

If the setup is incomplete, the app explains that visual search is unavailable instead of substituting sample results.

`BEDROCK_MODEL_ID` can override the default `us.amazon.nova-lite-v1:0` model. `REFERENCE_MAX_DISTANCE` changes the visual similarity cutoff (default `0.8`; higher values allow more, potentially less similar, matches; lower values require closer matches).

## Data limitations

Search results are reference photos and dataset categories, not current product listings. The dataset does not provide verified brands, prices, materials, condition, or sustainability information, so Spotted does not invent or display those fields. Connecting a real shopping source would be needed to provide product brands, costs, and listing details.

## Project structure

```text
index.html
styles.css
app.js
server.js
requirements.txt
scripts/prepare-dataset.py
scripts/reference-search.m
reference-data/    Generated locally; ignored by Git
```

## Dataset attribution

The local reference images are from Alexey Grigorev's [CC0 Clothing Dataset on Kaggle](https://www.kaggle.com/datasets/agrigorev/clothing-dataset-full).
