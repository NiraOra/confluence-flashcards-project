# Cardify.ai - A Forge Custom-UI Flashcard App

This project is a Forge app that allows users to make flashcards in a flash!

This Forge app consists of Four Modules that were implemented:

1. [Content Action Module](https://developer.atlassian.com/platform/forge/manifest-reference/modules/confluence-content-action/): When prompted, it opens up a modal that allows users to manually enter in flashcards.

2. [Context Menu Module](https://developer.atlassian.com/platform/forge/manifest-reference/modules/confluence-context-menu/): Allows users to select a bunch of text and then generate flashcards to save it.

3. [Content Byline Module](https://developer.atlassian.com/platform/forge/manifest-reference/modules/confluence-content-byline-item/): Allows users to use the entire page and generate flashcards (which is saved in a deck).

4. [Global Page Module](https://developer.atlassian.com/platform/forge/manifest-reference/modules/confluence-global-page/): Allows user to see all the flashcards and decks created (manually or AI-generated) and then also allows users to tag them and study them if desired.

For more information about functionality, jump to this section: [Functionality](#functionality).

## Project Directory Overview

``` (shell)
├── flashcards
│   ├── frontend
│   │   ├── build
│   │   │   ├── asset-manifest.json
│   │   │   └── index.html
│   │   ├── package-lock.json
│   │   ├── package.json
│   │   ├── public
│   │   │   └── index.html
│   │   └── src
│   │       ├── ContentActionModule.css
│   │       ├── ContentActionModule.js
│   │       ├── ContentBylineModule.css
│   │       ├── ContentBylineModule.js
│   │       ├── ContextMenuModule.css
│   │       ├── ContextMenuModule.js
│   │       ├── DeckDisplayAddFlashcards.css
│   │       ├── DeckDisplayAddFlashcards.js
│   │       ├── GlobalPageDeckCreate.css
│   │       ├── GlobalPageDeckCreate.js
│   │       ├── GlobalPageDeckEdit.js
│   │       ├── GlobalPageFlashcard.css
│   │       ├── GlobalPageFlashcardCreate.js
│   │       ├── GlobalPageFlashcardEdit.js
│   │       ├── GlobalPageModule.css
│   │       ├── GlobalPageModule.js
│   │       ├── GlobalPageTagCreate.css
│   │       ├── GlobalPageTagCreate.js
│   │       ├── GlobalPageTagEdit.js
│   │       ├── components
│   │       │   ├── CardSlider.css
│   │       │   ├── CardSlider.jsx
│   │       │   ├── DeckDisplay.css
│   │       │   ├── DeckDisplay.jsx
│   │       │   ├── DeckSlider.css
│   │       │   ├── DeckSlider.jsx
│   │       │   ├── DragNDrop.css
│   │       │   ├── DragNDrop.jsx
│   │       │   ├── QuizMode.css
│   │       │   ├── QuizMode.jsx
│   │       │   ├── QuizResults.css
│   │       │   ├── QuizResults.jsx
│   │       │   ├── StudyMode.css
│   │       │   └── StudyMode.jsx
│   │       └── index.js
│   ├── manifest.yml
│   ├── package-lock.json
│   ├── package.json
│   ├── src
│   │   ├── tests/
│   │   ├── ai_generation.py
│   │   ├── aiResolvers.ts
│   │   ├── cardResolvers.ts
│   │   ├── deckResolvers.ts
│   │   ├── helpers.ts
│   │   ├── index.ts
│   │   ├── requirements.txt
│   │   ├── sessions.ts
│   │   ├── tagResolvers.ts
│   │   ├── types.ts
│   │   └── userResolvers.ts
│   ├── start_uvicorn_ngrok.sh
│   └── tsconfig.json
└── README.md
```

Where the folders are as follows:

1. `flashcards`: Root directory of the code which also consists of:
   1. `tsconfing.json`,
   2. `start_uvicorn_ngrok.sh`: bash file required to run ngrok for ai generation,
   3. `manifest.yml`: used to package and deploy the app on the confluence website.
2. `flashcards/frontend`: Consists of:
   1. `package_lock.json` and `package.json` to help with `npm run build` (explained later) and,
   2. `src` which consists of frontend files.
3. `flashcards/src`: Consists of:
   1. backend files that help for card, deck and tag management and,
   2. A python file `ai_generation.py` which is used for the AI generation of flashcards and,
   3. `requirements.txt`: To install all dependencies for the ai generation.
4. `flashcards/frontend/src`: Consists of frontend files for the custom ui app
5. `flashcards/frontend/src/components`: Consists of slider files, deck display and study mode files for the custom ui app

## Requirements: Set up Forge and Ngrok

1. [Set up Forge](https://developer.atlassian.com/platform/forge/set-up-forge/) by creating a forge account, setting a sign in token and installing the latest `@forge/cli`.

2. Setting up [Ngrok](https://ngrok.com/) using a pre-made account:
    1. Download ngrok:
        - For Mac-OS users:

        ``` (shell)
        brew install ngrok
        ```

        - For windows users:

        ``` (shell)
        choco install ngrok 
        ```

        - For linux users:

        ``` (shell)
           curl -sSL https://ngrok-agent.s3.amazonaws.com/ngrok.asc \
           | sudo tee /etc/apt/trusted.gpg.d/ngrok.asc >/dev/null \
           && echo "deb https://ngrok-agent.s3.amazonaws.com buster main" \
           | sudo tee /etc/apt/sources.list.d/ngrok.list \
           && sudo apt update \
           && sudo apt install ngrok
        ```

    2. Run this anywhere in the terminal to add the Ngrok auth token (for access to the website):

        ``` (shell)
        ngrok config add-authtoken [GENERATED_AUTHTOKEN]
        ```

## Running the Code

If this is the first time you are running the code, follow these instructions:

1. Install top-level dependencies in `flashcards` directory:

``` (shell)
npm install
```

2. Install dependencies inside of the `flashcards/frontend` directory:

``` (shell)
npm install
```

3. Create a `.venv` folder/activate it and install python dependencies inside of the `flashcards/src` directory:

``` (shell)
python -m venv venv
pip install -r requirements.txt
```

4. Build the app inside of the `flashcards/frontend` directory:

``` (shell)
npm run build
```

5. Deploy app by running:

``` (shell)
forge deploy --environment development
```

6. Install app in a Confluence site by running:

``` (shell)
forge install 
```

7. Also remember to run the bash file in the `flashcards` directory to make sure the server is running (to test out the AI generation).

``` (shell)
./start_uvicorn_ngrok.sh
```

> <h2>Notes:</h2>
> 
> 1. Remember to choose `> Confluence` and then enter the base url of the Confluence site in the form of `https://[...].atlassian.net` when `forge install` prompts you with questions. <br>
> 2. You can install this app on multiple sites.
> <br><br>

If there are any changes made, follow these steps:

- First, `npm run build` (in the `flashcards/frontend` directory) and then `forge deploy --environment development` (in the `flashcards` directory) command when you want to persist code changes.
- You will not need to run `forge install` again as once the app is installed on the site you want to use it.

## Functionality

- **Flashcards** consist of front (question) and back (answer) pairs, with the optional functionality to add a hint or *lock* the card.
- **Decks** are groups of flashcards, which consists of a deck title and an optional deck description and also have the option to *lock* the deck.
- **Tags** are optional used to groups decks and flashcards if required; it consists of a tag title, options to choose the tag color and also options to *lock* the tag.
- Each deck consists of:
  - **Study Mode**: Users can study flashcards by flipping through them as many times as they want.
  - **Quiz Mode**: Similar to Study mode, the users can study flashcards but they are prompted to either click `correct`, `incorrect` or `skipped` based on whether they remember the content of the flashcards or not.
  - **Quiz Results**: Once the Quiz modes are done, they can view their individual past results.
- Users can filter content through:
  - **Tags**: Click on individual tags/multiple tags to toggle the decks and cards present within that tag (note with this: ai-generated content are automatically saved under the ``auto-generated`` tag).
  - **Personal/All** toggle: `Personal` displays flashcards and decks of the individual and `All` displays all the flashcards, decks and tags created within the space.
- Functionality to change the flashcard/deck/tag: Users can edit or delete them depending upon the permissions set by the user who created them (see notes for more information on **locked**).

> <h2>Notes:</h2>
> 
> 1. Quiz and Study mode dynamically updates based on an individual user's scores.
> 2. *Locked* means that no other user can edit the flashcard/deck/tag of the person that made the flashcard/deck/tag.

## Useful Guides

Here are some extra resources to help understand this app further:

- Custom-UI kit tools used from [Materials UI](https://mui.com) and [Atlastkit](https://atlaskit.atlassian.com).
- [Storage](https://developer.atlassian.com/platform/forge/storage/): This forge app used key-value pairs in `forge storage` to store our data.
- Page information and user information invoked through [Confluence Rest API v2](https://developer.atlassian.com/cloud/confluence/rest/v2/intro/#auth).
  - Note: these were invoked using [requestConfluence](https://developer.atlassian.com/platform/forge/apis-reference/fetch-api-product.requestconfluence/) and [getContext](https://developer.atlassian.com/platform/forge/apis-reference/ui-api-bridge/view/) from `@forge/bridge`.
- NLP Models (for AI generation) are taken from [HuggingFace](https://huggingface.co).
- AI generation was done by hosting code in the free tier for [ngrok](https://ngrok.com).

## Support

- See [Get help](https://developer.atlassian.com/platform/forge/get-help/) for how to get help for forge and provide feedback.
- See [developer.atlassian.com/platform/forge/](https://developer.atlassian.com/platform/forge) for documentation and tutorials explaining Forge.
