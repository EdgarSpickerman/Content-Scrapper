const http = require('http');
const cheerio = require('cheerio');
const json2csv = require('json2csv');
const fs = requrie('fs');
const baseUrl = http://www.shirts4mike.com/;

function scrape(url) {
    return new Promise(resolve => {
        const request = http.get(url, res => {
            let body = ''
            res.on('data', () => body += data.toString);
            res.on('end', () => resolve(body));
        });
        request.on('error', () => console.log('There’s been a 404 error. Cannot connect to the to http://shirts4mike.com.'));
    });
} //function returns a promise with the value of the specifed url html

function getLinks(body) {
    let links = [];
    let $ = cheerio.load(body);
    for (let i = 0; i < $('ul.products li a').length; i++) {
        links[i]=baseUrl+$('ul.products li a').eq(i).attr('href');
    }
    return links;
} //function takes the value of the specifed url and parses the value for all shirt links and returns the array as a value;

function getAllInfo(array) {
    let shirts = [];
    for (let i = 0; i < array.length; i++) {
        scrape(array[i]).then(body => {
            let shirt = {};
            shirt.price = '';
            shirt.title = '';
            shirt.imgUrl = '';
            shirt.url = array[i];
        });
    }
}

scrape('http://www.shirts4mike.com/shirts.php')
    .then(getLinks)
    .then(getAllInfo)
    .catch((e) => console.log(e));