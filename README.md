# datim-data-export-log
Data export log application for DATIM Node

## Install dependencies
```
npm install
```
After this installing the dependencies is completed you can start the development server.

## Run development server
```
npm start
```
This will start the development server on http://locahost:8081

> To make the development server work properly you will need to add the address of the development server to the CORS whitelist. You can do this in DHIS2 by going to the _System Settings_ app. From there go to the _Access_ tab and add `http://localhost:8081` to the _CORS Whitelist_ field.

## Build the production package
```
npm run build
```
This will build the production version of the app into the `/build` folder within the project folder.
You can zip up the files in the build folder e.g. (`zip -0r datim-data-export-log.zip *`)

The zip file can be packaged up and uploaded to a DHIS2 instance.
