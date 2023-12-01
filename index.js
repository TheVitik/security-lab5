const axios = require('axios');
const express = require('express');
const { auth } = require('express-oauth2-jwt-bearer');
const bodyParser = require('body-parser');
const port = 3000;
const fs = require('fs');

const app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));

const CONFIG = {
    DOMAIN: 'dev-no8qsf3jervv1qib.us.auth0.com',
    CLIENT_ID: 'pBe62VmgJNSRSwoe91Qg8X3gZmcO6YQ7',
    CLIENT_SECRET: 'Xcx-U93dckVsoJB7ibUURFsr0nmPh4aDNTSW7uqn-Zu20qZ_8g_cZXv2x0Ejw2b8',
    AUDIENCE: 'https://dev-no8qsf3jervv1qib.us.auth0.com/api/v2/',
};

const checkJwt = auth({
    audience: CONFIG.AUDIENCE,
    issuerBaseURL: `https://${CONFIG.DOMAIN}/`,
});

app.get('/', async (req, res) => {
    const token = req.get('Authorization');

    if (!token) {
        return res.status(401).send('Unauthorized');
    }

    try {
        const response = await axios.get(`https://${CONFIG.DOMAIN}/userinfo`, {
            headers: {
                Authorization: token,
            },
        });
        res.send(response.data);
    } catch (error) {
        console.error(error);
        res.status(401).send('Token is invalid');
    }
});

app.get('/public', function (req, res) {
    res.send('Access to public provided');
});

app.get('/private', checkJwt, function (req, res) {
    res.send('Access to private provided');
});

app.post('/api/login', async (req, res) => {
    const {login, password} = req.body;

    if (!login) {
        return res.status(422).send('Missing parameter login');
    }
    if (!password) {
        return res.status(422).send('Missing parameter password');
    }

    try {
        const response = await axios.post(`https://${CONFIG.DOMAIN}/oauth/token`, {
            client_id: CONFIG.CLIENT_ID,
            client_secret: CONFIG.CLIENT_SECRET,
            audience: CONFIG.AUDIENCE,
            grant_type: 'password',
            username: login,
            password: password,
            scope: "openid"
        });

        const accessToken = response.data.access_token;

        res.json({
            token: accessToken,
            type: 'Bearer'
        });
    } catch (err) {
        console.error(err);
        res.status(401).send('Wrong login or password');
    }
});

app.use((err, req, res, next) => {
    res.status(err.status || 500);
    res.json({
        message: err.message
    });
});

app.listen(port, () => {
    console.log(`Auth0 app listening on port ${port}`)
})
