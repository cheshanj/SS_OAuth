const express = require('express');
const app = express();
const multer = require('multer');
const fs = require("fs");
const Oauth2Data = require("./credentials.json");

var cookieParser = require('cookie-parser')
var authed = false;

const { OAuth2Client } = require('google-auth-library');
const { google } = require('googleapis');
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
    },
    filename: function (req, file, callback) {
        callback(null, file.fieldname + "_" + Date.now() + "_" + file.originalname);
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
    }


});

app.get('/home', checkAuthenticated, (req, res) => {
    let user = req.user;
    res.render('index', { user });

});

app.get('/posts', checkAuthenticated, (req, res) => {
    let user = req.user;
    res.render('posts', { user });

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
});

app.get("/google/callback", function (req, res) {
    const code = req.query.code;
    if (code) {
        // Get an access token based on our OAuth code
        client.getToken(code, function (err, tokens) {
            if (err) {
                console.log("Error authenticating");
                console.log(err);
            } else {
                console.log("Successfully authenticated");
                console.log(tokens)
                client.setCredentials(tokens);


                authed = true;
                res.redirect("/");
            }
        });
    }
});

app.get('*', (req, res) => {

    res.render('404');
});

app.post('/login', (req, res) => {

    let token = req.body.token;
    console.log("User token is: " + token);

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
});

app.get('/logout', (req, res) => {

    res.clearCookie('session-token');
    res.redirect('/login');
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
        })
        .catch(err => {
            res.redirect('/')
        })

}










app.listen(process.env.PORT || 4800, () => console.log("Server started and running!!"));