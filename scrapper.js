//modules and variables
const http = require('http');
const fs = require('fs');
const cheerio = require('cheerio');
const json2csv = require('json2csv');
let path;

//scraper for any access pt
//creates a get request upon successful request
    //sends the body of the response back as JSON
    //once the response has been sent, sends this link
    //if any errors send back an error/log that error
function scrapeUrl(url) {
    return new Promise((resolve) => {
        const request = http.get(url, res => {
            let body = '';
            res.on('data', data => body += data.toString());
            res.on('end', () => resolve(body));
        });
        request.on('error', err => {
            console.log("There's been a 404 error. Cannot connect to the to http://shirts4mike.com.")
            error(err);
        });
        request.once('response', res => path=request.path);
    });
}


//function to scrape main page to get all its individual shirts
function getLinks(body) {
    let links = [];
    let $ = cheerio.load(body);
    for (let i = 0; i < $('ul.products li a').length; i++) {
        links[i] = 'http://www.shirts4mike.com/' + $('ul.products li a ').eq(i).attr('href');
    }
    return links;
}


//function to scrape each indiviudal shirt for the required information
function getShirtInfo(body) {
    let $ = cheerio.load(body);
    let shirt = {};
    shirt.title = $('.shirt-details h1').text().slice(4);
    shirt.price = $('.price').text();
    shirt.imgUrl = 'http://www.shirts4mike.com/' + $('.shirt-picture span img').attr('src');
    shirt.url = 'http://www.shirts4mike.com' + path;
    shirt.date = new Date().toLocaleString();
    return shirt;
}


//create promises for each scrape link
//each promise returns after getting that shirt's information
// if any shirt has an issue reject the all shirts
function getInfo(links) {
    let shirts = [];
    for (let i = 0; i < links.length; i++) {
        let shirtPromise = new Promise(resolve => resolve(scrapeUrl(links[i]).then(getShirtInfo)));
        shirts.push(shirtPromise);
    }
    Promise.all(shirts).then(print).catch(e => error(e));
}



//write the information stored in the shirt data object to a csv file
//define the fields and the order they are
//create the file's name print a success file or throw error to be picked up by err function
function print(shirts) {
    let fields = ['title', 'price', 'imgUrl', 'url', 'date'];
    let csv = json2csv({ data: shirts, fields: fields });
    let fileName = new Date().toLocaleDateString().replace(/\//g, '-');
    fileName = fileName.slice(6, 10) + '-' + fileName.slice(0, 5);
    fs.writeFile('./data/' + fileName + '.csv', csv, err => {
        if (err) throw err;
        console.log('file saved');
    });
}


//If any error's occur print a friendly message to the console.
//append this information to a scrapper-error log.
//if this file doesnt exist create it otherwise rewrite it
function error(e) {
    console.log('There was an error please check scraper-error for more information');
    fs.appendFile('./scraper-error.log', new Date() + ' ' + e + '\n', (err) => {
        if (err) throw err;
    });
}



//if data does not exist in the the current working directory create it
//otherwise nothing
fs.stat("./data", err => err ? fs.mkdir("./data") : '');



//Scrape the main/catalog page
//get all the shirt links
//get the information for each link
//print the information to a csv file named YYYY-MM-DD
scrapeUrl('http://www.shirts4mike.com/shirts.php')
    .then(getLinks)
    .then(getInfo)
    .catch(e => error(e));