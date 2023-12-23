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
    // split queries into multiple function calls
    try {
        const memberUrls = await fetchMemberUrls(group_url);
        const movieUrls = await fetchMovieUrls(memberUrls);
        const movieDetails = await fetchMovieDetails(movieUrls);

        // display each movie of the reurted list
        for (const details of movieDetails) {
            await io.emit('update', { 'message': details });
        }

    } catch (error) {
        console.error("Error in handle_group_query:", error);
    }
}

async function fetchMemberUrls(group_url) {
    let member_urls = [];

    try {
        const bindingsStream = await engine.queryBindings('SELECT DISTINCT ?member WHERE { <' + group_url + '> <http://xmlns.com/foaf/0.1/member> ?member. }', {
            sources: [group_url],
        });

        // new promise, to wait for the stream to end before returning
        await new Promise((resolve, reject) => {
            bindingsStream.on('data', (data) => {
                // modifying the url to get the movie url
                let modifiedUrl = data.get('member').value.replace('/profile/card#me', '/movies/');
                // adding modified url to the list
                member_urls.push(modifiedUrl);
            });

            bindingsStream.on('end', resolve);
        });

        //console.log("Member URLs:", member_urls);
        return member_urls;

    } catch (error) {
        console.error("Error fetching member URLs:", error);
        throw error;
    }
}



async function fetchMovieUrls(member_urls) {
    let movie_urls = [];

    try {
        for (const url of member_urls) {
            const bindingsStream = await engine.queryBindings('SELECT DISTINCT ?v WHERE { ?container <http://www.w3.org/ns/ldp#contains> ?v . }', {
                sources: [url],
            });

            // new promise, to wait for the stream to end before returning
            await new Promise((resolve, reject) => {
                bindingsStream.on('data', function (data) {
                    movie_urls.push(data.get('v').value);
                });
                bindingsStream.on('end', resolve);
            });
        }
    } catch (error) {
        console.error("Error fetching movie URLs:", error);
        throw error;
    }
   // console.log("Movie URLs:", movie_urls);
    return movie_urls;
}


async function fetchMovieDetails(movie_urls) {
    let movie_details = [];
    try {
        for (const url of movie_urls) {
           // console.log("URL: ", url)
            const bindingsStream = await engine.queryBindings('SELECT DISTINCT ?name ?image WHERE { ?movie <https://schema.org/name> ?name. ?movie <https://schema.org/image> ?image.}', {
                sources: [url],
            });

            // new promise, to wait for the stream to end before returning
            await new Promise((resolve, reject) => {
                bindingsStream.on('data', function (data) {
                    //console.log("movie name: ", data.get('name').value)

                    // adding details to list in the right format
                    movie_details.push({
                        "name": data.get('name').value,
                        "image": data.get('image').value
                    });
                });
                bindingsStream.on('end', resolve);
            });
        }
    } catch (error) {
        console.error("Error fetching movie Details:", error);
        throw error;
    }
    //console.log("Movie Details:", movie_details);
    return movie_details;
}


httpServer.listen(port),
    () => console.log("Server is running... on " + port);