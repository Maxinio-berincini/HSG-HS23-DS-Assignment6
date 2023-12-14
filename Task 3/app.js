const express = require("express");
const cors = require('cors');
const app = express();
const http = require('http');
const path = require('path');
const httpServer = http.Server(app);
const {Server} = require("socket.io");
const io = new Server(httpServer);

const QueryEngine = require('@comunica/query-sparql').QueryEngine;

const engine = new QueryEngine();

const port = 5000;

app.use(cors())

app.use(express.json())

app.use(express.static('public'))


app.get('/', (req, res) => {
    res.statusCode = 200;
    res.setHeader("Content-Type", "text/html");
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.get('/style.css', (req, res) => {
    res.sendFile(path.join(__dirname, 'style.css'));
});


app.get('/movies', (req, res) => {
    let input_url = req.query.url
    console.log("input url: ", input_url)
    res.statusCode = 200
    res.setHeader("Content-Type", "text/html");
    res.sendFile(path.join(__dirname, 'index.html'));
    handle_query(input_url)
});

async function handle_query(input_url) {
    movie_urls = [] //List of movies in the pod
    engine.queryBindings('SELECT ?v WHERE { ?container <http://www.w3.org/ns/ldp#contains> ?v . }', {
        sources: [input_url],
    }).then(function (bindingsStream) {
        bindingsStream.on('data', function (data) {
            movie_urls.push(data.get('v').value)
        });
        engine.queryBindings('SELECT ?name ?image WHERE { ?movie <https://schema.org/name> ?name. ?movie <https://schema.org/image> ?image.}', {
            sources: movie_urls,
        }).then(function (bindingsStream) {
            console.log("Movie urls: ", movie_urls)
            bindingsStream.on('data', function (data) {
                obj = {
                    "name": data.get('name').value,
                    "image": data.get('image').value
                };
                io.emit('update', {'message': obj})
            });
        });
    });
}


// Get movies of Group
app.get('/group-movies', (req, res) => {
    let group_url = "https://solid.interactions.ics.unisg.ch/MaBer/bcs-ds-2023-DefinitelyNotAVirus-group"
    res.statusCode = 200
    res.setHeader("Content-Type", "text/html");
    res.sendFile(path.join(__dirname, 'index.html'));
    handle_group_query(group_url)
});

async function handle_group_query(group_url) {
    let member_urls = []; // List of members in the group
    let movie_urls = []; // List of movies in the pod

    // Fetch member URLs from the group and modify them
    await engine.queryBindings('SELECT DISTINCT ?member WHERE { <https://solid.interactions.ics.unisg.ch/MaBer/bcs-ds-2023-DefinitelyNotAVirus-group> <http://xmlns.com/foaf/0.1/member> ?member. }', {
        sources: [group_url],
    }).then(function (bindingsStream) {
        bindingsStream.on('data', function (data) {
            let modifiedUrl = data.get('member').value.replace('/profile/card#me', '/movies/');
            member_urls.push(modifiedUrl);
        });
        bindingsStream.on('end', async function () {
            // Once all member URLs are modified, proceed to fetch movies
            for (const url of member_urls) {
                await engine.queryBindings('SELECT DISTINCT ?v WHERE { ?container <http://www.w3.org/ns/ldp#contains> ?v . }', {
                    sources: [url],
                }).then(async function (bindingsStream) {
                    bindingsStream.on('data', function (data) {
                        movie_urls.push(data.get('v').value);
                    });
                    await engine.queryBindings('SELECT DISTINCT ?name ?image WHERE { ?movie <https://schema.org/name> ?name. ?movie <https://schema.org/image> ?image.}', {
                        sources: movie_urls,
                    }).then(function (bindingsStream) {
                        console.log("Movie urls: ", movie_urls)
                        bindingsStream.on('data', async function (data) {
                            obj = {
                                "name": data.get('name').value,

                                "image": data.get('image').value
                            };
                            console.log(obj)
                            await io.emit('update', {'message': obj})
                        });
                    });
                });
            }
        });
    });
}


httpServer.listen(port),
    () => console.log("Server is running... on " + port);