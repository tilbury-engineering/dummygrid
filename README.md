# KARTGRID

Working prototype for a locale-aware karting platform covering news, marketplace/classifieds, driver profiles, karting classes, community content and advertising.

## Run locally

1. npm install
2. npm run dev

## Build

1. npm install
2. npm run build
3. Publish the `dist` directory

## Render

A `render.yaml` Blueprint is included.

The private GitHub repository must be authorised in the Tilbury Engineering Render workspace before Render can fetch it.

Build command:

`npm install && npm run build`

Publish directory:

`dist`

## Prototype persistence

User-created listings, saved listings, driver profile data, locale selection and community posts are stored in the browser with localStorage for this prototype.
