const http = require('http');
const fs = require('fs');
const cheerio = require('cheerio');
const json2csv = require('json2csv');
fs.stat("./data", err => err ? fs.mkdir("./data") : '');

function scrapeUrl(url) {
    return new Promise((resolve, reject) => {
        const request = http.get(url, res => {
            let body = '';
            res.on('data', data => body += data.toString());
            res.on('end', () => resolve(body));
        });
        request.on('error', () => console.log("There's been a 404 error. Cannot connect to the to http://shirts4mike.com."));
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

function getInfo(links) {
    let shirts = [];
    for (let i = 0; i < links.length; i++) {
        scrapeUrl(links[i]).then(body => {
            let $ = cheerio.load(body);
            let shirt = {};
            shirt.title = $('.shirt-details h1').text().slice(4);
            shirt.price = $('.price').text();
            shirt.imgUrl = 'http://www.shirts4mike.com/' + $('.shirt-picture span img').attr('src');
            shirt.url = links[i];
            shirt.date = new Date().toLocaleString();
            shirts.push(shirt);
            return shirts;
        }).then(print);
    }
}

function print(shirts) {
    let fields = ['title', 'price', 'imgUrl', 'url', 'date'];
    let csv = json2csv({ data: shirts, fields: fields });
    if (shirts.length >= 8) {
        let fileName = new Date().toLocaleDateString().replace(/\//g, '-');
        fs.writeFile('./data/' + fileName + '.csv', csv, (err) => {
            if (err) throw err;
            console.log('file saved');
        });
    }
}
function error(e) {
    fs.appendFile('./scraper-error.log', new Date()+' '+e, (err) => {
        if (err) throw err;
    });
}
scrapeUrl('http://www.shirts4mike.com/shirts.php')
    .then(getLinks)
    .then(getInfo)
    .catch((e) => error(e));