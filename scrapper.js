const http = require('http');
const fs = require('fs');
const cheerio = require('cheerio');
const json2csv = require('json2csv');
let path;

function scrapeUrl(url) {
    return new Promise((resolve) => {
        const request = http.get(url, res => {
            let body = '';
            res.on('data', data => body += data.toString());
            res.on('end', () => resolve(body));
        });
        request.on('error', () => console.log("There's been a 404 error. Cannot connect to the to http://shirts4mike.com."));
        request.once('response', res => path=request.path);
    });
}

function getLinks(body) {
    let links = [];
    let $ = cheerio.load(body);
    for (let i = 0; i < $('ul.products li a').length; i++) {
        links[i] = 'http://www.shirts4mike.com/' + $('ul.products li a ').eq(i).attr('href');
    }
    return links;
}

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

function getInfo(links) {
    let shirts = [];
    for (let i = 0; i < links.length; i++) {
        let shirtPromise = new Promise(resolve => resolve(scrapeUrl(links[i]).then(getShirtInfo)));
        shirts.push(shirtPromise);
    }
    Promise.all(shirts).then(print).catch(e => error(e));
}

function print(shirts) {
    let fields = ['title', 'price', 'imgUrl', 'url', 'date'];
    let csv = json2csv({ data: shirts, fields: fields });
    let fileName = new Date().toLocaleDateString().replace(/\//g, '-');
    fs.writeFile('./data/' + fileName + '.csv', csv, err => {
        if (err) throw err;
        console.log('file saved');
    });
}

function error(e) {
    console.log('There was an error please check scraper-error for more information');
    fs.appendFile('./scraper-error.log', new Date() + ' ' + e + '\n', (err) => {
        if (err) throw err;
    });
}

fs.stat("./data", err => err ? fs.mkdir("./data") : '');
scrapeUrl('http://www.shirts4mike.com/shirts.php')
    .then(getLinks)
    .then(getInfo)
    .catch(e => error(e));