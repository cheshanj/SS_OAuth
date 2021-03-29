const express = require('express');
const app = express();

var cookieParser = require('cookie-parser')

const { OAuth2Client } = require('google-auth-library');
const CLIENT_ID = '555382673677-6t26jc8ug2lrrsofa80bmkrv3uo7ujgu.apps.googleusercontent.com';
const client = new OAuth2Client(CLIENT_ID);

//view engine middleware
app.set('view engine', 'ejs');
app.use(express.json());
app.use(cookieParser());

app.use('/assets', express.static('assets'));

app.get('/', (req, res) => {

    res.render('login');
});

app.get('/home', checkAuthenticated, (req, res) => {
    let user = req.user;
    res.render('index', { user });

});

app.get('*', (req,res)=>{

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
    res.redirect('/');
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