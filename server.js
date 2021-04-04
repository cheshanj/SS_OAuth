const express = require('express');
const app = express();
const multer = require('multer');
const fs = require("fs");
const Oauth2Data = require("./credentials.json");
var XMLHttpRequest = require("xmlhttprequest").XMLHttpRequest;

var cookieParser = require('cookie-parser')
var authed = false;

const { OAuth2Client } = require('google-auth-library');
const { google } = require('googleapis');
const { response } = require('express');
const CLIENT_ID = Oauth2Data.web.client_id;
const CLIENT_SECRET = Oauth2Data.web.client_secret
const REDIRECT_URL = Oauth2Data.web.redirect_uris[0];
const client = new google.auth.OAuth2(

    CLIENT_ID, CLIENT_SECRET, REDIRECT_URL
);

const SCOPES =
    "https://www.googleapis.com/auth/drive.file https://www.googleapis.com/auth/userinfo.profile";

var Storage = multer.diskStorage({

    destination: function (req, res, callback) {
        callback(null, "./images");
        console.log("log 1");
    },
    filename: function (req, file, callback) {
        callback(null, file.fieldname + "_" + Date.now() + "_" + file.originalname);
        console.log("log 1");
    },

});

var upload = multer({
    storage: Storage,
}).single("file");


//view engine middleware
app.set('view engine', 'ejs');
app.use(express.json());
app.use(cookieParser());

app.use('/assets', express.static('assets'));

app.get('/', (req, res) => {

    if (!authed) {

        var url = client.generateAuthUrl({

            access_type: 'offline',
            scope: SCOPES,
        });
        console.log(url);
        console.log("log 2 not");
        res.render('login', { url: url });
    } else {

        var oauth2 = google.oauth2({
            auth: client,
            version: "v2"
        });

        oauth2.userinfo.get(function (err, response) {
            if (err) {
                console.log(err);
            } else {
                console.log(response.data);
                name = response.data.name
                pic = response.data.picture
                res.render("posts", {
                    name: response.data.name,
                    pic: response.data.picture,
                    success: false
                });
            }
        });
        console.log("log 2 authed load post");
    }

    console.log("log 2 tot");
});

app.get('/home', checkAuthenticated, (req, res) => {
    let user = req.user;
    res.render('index', { user });
    console.log("log 7");

});

app.get('/posts', checkAuthenticated, (req, res) => {
    let user = req.user;
    res.render('posts', { user });
    console.log("log 6");

});

app.post("/upload", (req, res) => {
    upload(req, res, function (err) {
        if (err) {
            console.log(err);
            return res.end("File not uploaded. Please try again.");
        } else {
            console.log(req.file.path);
            const drive = google.drive({ version: "v3", auth: client });
            const fileMetadata = {
                name: req.file.filename,
            };
            const media = {
                mimeType: req.file.mimetype,
                body: fs.createReadStream(req.file.path),
            };
            drive.files.create(
                {
                    resource: fileMetadata,
                    media: media,
                    fields: "id",
                },
                (err, file) => {
                    if (err) {
                        // Handle error
                        console.error(err);
                    } else {
                        fs.unlinkSync(req.file.path)
                        res.render("posts", { name: name, pic: pic, success: true })
                    }

                }
            );
        }
    });
    console.log("log 5");
});

app.get("/google/callback", function (req, res) {
    const code = req.query.code;
    if (code) {
        // Get an access token based on our OAuth code
        client.getToken(code, function (err, tokens) {
            if (err) {
                console.log("Error authenticating");
                console.log(err);
                console.log("log 4 err");
            } else {
                console.log("Successfully authenticated");
                console.log(tokens)
                client.setCredentials(tokens);

                function onSignIn(client) {
                    var tokens = client.getAuthResponse().id_token;
                    console.log("User token is: " + tokens);
                }

                var xhr = new XMLHttpRequest();
                xhr.open('POST', 'https://localhost:4800/tokensignin');
                xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
                xhr.onload = function () {
                    console.log('Signed in as: ' + xhr.responseText);
                };
                xhr.send('token=' + tokens);

              


                authed = true;
                res.redirect("/posts");
                console.log("log 4 suc load posts");
                console.log("Current Full url is: " + req.protocol + '://' + req.get('host') + req.originalUrl);
            }
        });
    }
    console.log("log 4 tot");
});

app.get('*', (req, res) => {

    res.render('404');
    console.log("log 3");
});

app.post('/login', (req, res) => {

    function onSignIn(googleUser) {
        var token = googleUser.getAuthResponse().id_token;
        console.log("User token is: " + token);
    }

    // let token = req.body.token;
    // console.log("User token is: " + token);

    async function verify() {
        const ticket = await client.verifyIdToken({
            idToken: token,
            audience: CLIENT_ID,  // Specify the CLIENT_ID of the app that accesses the backend
            // Or, if multiple clients access the backend:
            //[CLIENT_ID_1, CLIENT_ID_2, CLIENT_ID_3]
        });
        const payload = ticket.getPayload();
        const userid = payload['sub'];
        console.log(payload);
        // If request specified a G Suite domain:
        // const domain = payload['hd'];
    }
    verify()
        .then(() => {

            res.cookie('session-token', token);
            res.send('success');

        }).catch(console.error);

    console.log("log 8");
});

app.get('/logout', (req, res) => {

    res.clearCookie('session-token');
    res.redirect('/login');
    console.log("log 9");
});

function checkAuthenticated(req, res, next) {

    let token = req.cookies['session-token'];

    let user = {};
    async function verify() {
        const ticket = await client.verifyIdToken({
            idToken: token,
            audience: CLIENT_ID,  // Specify the CLIENT_ID of the app that accesses the backend
        });
        const payload = ticket.getPayload();
        user.name = payload.name;
        user.email = payload.email;
        user.picture = payload.picture;
    }
    verify()
        .then(() => {
            req.user = user;
            next();
            console.log("log 10 verified");

        })
        .catch(err => {
            res.redirect('/')
            console.log("log 10 verification err");
            console.log("error:: " + err);

        })
    console.log("log 10 tot");

}










app.listen(process.env.PORT || 4800, () => console.log("Server started and running!!"));