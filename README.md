# Spotted

Spotted analyzes an image you upload and searches a local collection of real second-hand clothing for visually similar pieces. Each result shows the brand, size, material, colors, and suggested price band recorded by professional second-hand sorters. The AI never fills in those fields.

## Quick start (no typing)

1. Install these if you don't have them (one time):
   - [Node.js](https://nodejs.org) (LTS version)
   - [Python 3](https://www.python.org/downloads/)
   - [AWS CLI](https://aws.amazon.com/cli/)
2. Download Spotted: on GitHub, select **Code → Download ZIP**, then double-click the ZIP to unzip it.
3. Double-click **Start Spotted.command** in the Spotted folder.
   - If macOS says it can't verify the file, open **System Settings → Privacy & Security**, scroll down, and select **Open Anyway** next to "Start Spotted.command". You only need to do this once.
4. Follow the prompts in the window that opens:
   - **First run only:** it offers to download the clothing dataset (about 2.3 GB) and sets it up. This takes a few minutes.
   - **AWS sign-in:** enter the name of your AWS profile (or press Return to use `spotted`). If you're not signed in, a browser window opens so you can sign in with your AWS account.
5. Spotted opens in your browser. Keep the Terminal window open while you use it; close the window to quit.

Next time, just double-click **Start Spotted.command** again. You need an AWS account with access to Amazon Bedrock in `us-east-1`. To switch AWS profiles, delete the hidden `.spotted-aws-profile` file in the Spotted folder.

The sections below describe the same setup step by step, for developers.

## Requirements

- macOS 14 or later with Apple Command Line Tools
- Python 3.11 or later
- Node.js 16.9 or later
- AWS CLI v2 configured with a profile that can invoke Amazon Bedrock

## Set up the dataset

The app uses version 1 of the [Clothing Dataset for Second-Hand Fashion](https://zenodo.org/records/8386668) from Wargön Innovation AB and RISE Research Institutes of Sweden, released under CC BY 4.0. The download is about 2.3 GB; allow roughly 5 GB of free disk space while importing it.

```bash
python3 scripts/prepare-dataset.py
```

The script downloads the archive from Zenodo, keeps each item's labels and front photo, resizes the photos to at most 800 pixels, rotates them upright (the dataset's flat-lays show each garment sideways with the collar on the right), writes `catalog.json`, and builds the local Apple Vision index. Before comparing, Spotted uses macOS subject lifting to cut the garment out of each photo, both the dataset photos and yours, so backgrounds don't affect the match. Each photo is also indexed turned a quarter turn each way, and a search uses the best of the three, which covers any garment that was laid out differently. Running it again replaces the existing dataset. Everything is kept in the ignored `reference-data/` directory. To use an archive you already downloaded, pass `--archive /path/to/circular_fashion_v1.tar.gz`. No Python packages are needed.

Image matching runs locally. Your photo is sent to Bedrock only when you search, with faces blurred first (see [Privacy](#privacy)).

## Run Spotted

Set `your-profile` to an AWS CLI profile with `bedrock:InvokeModel` access:

```bash
BEDROCK_VISION=1 AWS_PROFILE=your-profile AWS_REGION=us-east-1 node server.js
```

Open [http://127.0.0.1:4173](http://127.0.0.1:4173). Upload an image and select **Find similar items**. Press **Ctrl+C** in the terminal to stop the server.

If you pull changes to `scripts/reference-search.m`, rebuild the Vision helper with `python3 scripts/prepare-dataset.py --compile` (the launcher does this for you).

If the setup is incomplete, the app explains that visual search is unavailable instead of substituting sample results.

`BEDROCK_MODEL_ID` can override the default `us.amazon.nova-lite-v1:0` model. `REFERENCE_MAX_DISTANCE` changes the visual similarity cutoff (default `0.78`; higher values allow more, potentially less similar, matches; lower values require closer matches). If nothing is within the cutoff, Spotted shows the four nearest items under the heading **Nearest items** instead of an empty result.

## How it works

1. Upload a photo. Amazon Bedrock names the garment category, how confident it is, and up to four visible details.
2. **Check what the AI sees.** If the category is wrong, pick the right one and select **Search again**. The earlier analysis is cached, so re-searching does not call Bedrock again.
3. Browse similar second-hand pieces, most similar first, with brand, size, material, colors, and suggested price. Each one has a **Why this match?** explanation.
4. Read AI styling ideas based on the visible details. These are suggestions, not product picks.

## Privacy

- **Faces are blurred on your Mac.** Before a photo goes anywhere, Spotted finds faces with Apple's Vision framework and blurs them. If blurring fails, the photo is not sent. The garment is left untouched, and the status line says how many faces were blurred.
- **Hidden details are removed.** The browser re-draws the photo before uploading, which drops metadata such as GPS location and camera model.
- **One cloud call, in your own account.** The blurred photo is sent once to Amazon Bedrock in your AWS account to identify the garment. AWS states that Bedrock does not use inputs to train models or share them with model providers, and does not store them unless the account owner turns on request logging.
- **The AI describes clothes, not people.** The prompt tells the model never to mention or guess the wearer's body, size, age, gender, race, skin, hair, or face, or what is flattering for a body type.
- **Nothing is saved.** The photo is written to a private temporary file during a search and deleted afterwards. Only the AI's text description is cached, in memory, until Spotted closes. Logs record error messages only.
- **Testing on someone else's Mac:** their AWS account is used, so testers should know whose account their photos go through.

## Human-AI interaction guidelines applied

Spotted follows five of the [Guidelines for Human-AI Interaction](https://www.microsoft.com/en-us/research/publication/guidelines-for-human-ai-interaction/) (Amershi et al., CHI 2019):

| Guideline | How Spotted applies it |
| --- | --- |
| **G1. Make clear what the system can do** | Before upload, the page lists what Spotted can do (identify a garment, find similar second-hand pieces with their dataset details, suggest outfits) and what it cannot (find the exact item, show live prices, search the live web or link to a store). |
| **G2. Make clear how well the system can do what it can do** | The AI reports its confidence in the category, and a low-confidence result is highlighted for the user to check. Each match's “Why this match?” note says how similar it is, and when nothing is close the results are titled “Nearest items”. |
| **G6. Mitigate social biases** | The AI is told to describe only the garment and never comment on the wearer's body, age, gender, race, or appearance, so styling ideas don't make assumptions about who is wearing the clothes. |
| **G9. Support efficient correction** | Users can change the detected category from a dropdown and search again without re-uploading, or undo their change and return to the AI's category. |
| **G11. Make clear why the system did what it did** | The "What the AI sees" panel shows the visible details the AI used. Each result explains why it was included: same category, or visual similarity alone for uncategorized dataset photos. |

## Data limitations

Search results are items from the dataset, not current product listings, and cannot be bought through Spotted. Prices are suggested price bands from the dataset annotators; the dataset notes that its partner does not set prices in practice, and it does not state a currency. Some fields are missing for some items. Connecting a live shopping source would be needed for real prices and links to buy.

## Project structure

```text
Start Spotted.command   Double-click launcher
index.html
styles.css
app.js
server.js
scripts/prepare-dataset.py
scripts/reference-search.m
reference-data/    Generated locally; ignored by Git
```

## Dataset attribution

Item photos and labels are from the [Clothing Dataset for Second-Hand Fashion](https://zenodo.org/records/8386668) (version 1) by Wargön Innovation AB and RISE Research Institutes of Sweden AB, licensed under [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/). Photos were resized for the app.
