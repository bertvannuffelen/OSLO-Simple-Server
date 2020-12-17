const fallback =require( 'express-history-api-fallback')
const program = require('commander');
const express = require('express');
const path = require('path');
const chokidar = require('chokidar');
const exec = require('child_process');
const fs = require('fs-extra');
const tar = require('tar-fs');
const rimraf = require("rimraf");
const app = express();
const CronJob = require('cron').CronJob;

// Enable this when testing server locally
/*program
    .version('1.0.0')
    .usage('serves the content in the dist folder, detects changes and automatically shows the new content')
    .option('-p, --path <path>', 'path where the updated dist folder should be fetched periodically');

program.on('--help', () => {
    console.log('');
    console.log('This program is created for the Open Standards for Linked Organizations team.');
    console.log("It is used to provide an easy way to show a static folder, for example the dist folder after an npm build");
    console.log("The program can be executed as follows:");
    console.log("node index.js -p <path>");
});

program.parse(process.argv);

if(!program.path){
    console.log('Please provide a path, so this server can fetch updates');
    return;
}
const downloadURL = program.path;
 */

const PORT = process.env.ENV_PORT || 3000;
const DOWNLOAD_URL = process.env.ENV_FILE_URL || null;
const TARGET_DIR = 'dist';
const FILENAME = 'dist.tar';
const TMP_DIR = '../tmp';

const watcher = chokidar.watch(TARGET_DIR);
watcher.on('ready', function() {
    watcher.on('all', function() {
        console.log(`[Chokidar]: clearing cache from server, due to new content`);
        Object.keys(require.cache).forEach(function(id) {
            if (/[\/\\]app[\/\\]/.test(id)) delete require.cache[id]
        })
    })
});

if(!DOWNLOAD_URL){
    console.error('Please provide a URL to the updated content, so the server can fetch new updates');
    process.exit(1);
}

fetchContent(DOWNLOAD_URL, TMP_DIR);

//This job will fetch the directory every hour
const job = new CronJob('0 0 */1 * * *', function() {
    fetchContent(DOWNLOAD_URL, TMP_DIR);
});
job.start();

// Start server
app.use(express.static(TARGET_DIR));
app.use(fallback('index.html', { TARGET_DIR }))
console.log('Server running on port', PORT);
app.listen(PORT);



// function to fetch the folder where the updated content will be stored
function fetchContent(url, tmpDir){
    const { exec } = require('child_process');
    exec('wget ' + url + ' -P ' + tmpDir, (err) => {
        if (err) {
            console.log(`[Server]: an error occured while downloading ${url}.`);
            console.log(err);
            return;
        } else {
            console.log(`[Server]: done downloading.`);
            console.log(`[Server]: start extracting .tar folder to target directory: ${TARGET_DIR}`);
            fs.createReadStream(tmpDir + '/' + FILENAME).pipe(tar.extract(TARGET_DIR));
            //console.log('[Server]: done extracting. Copying content to target directory: ' + TARGET_DIR);

            console.log(`[Server]: removing tmp directory`);
            rimraf(TMP_DIR, () => {
                console.log(`[Server]: cleared tmp directory`);
            });
        }
    });
}

