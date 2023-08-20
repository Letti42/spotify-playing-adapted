const querystring = require('node:querystring');
const request = require('request');
const cors = require('cors');
const fs = require('fs');
const svg = require('./svg');
require('./track');
require('dotenv').config()
const express = require('express');
const app = express();
app.use(cors());
app.listen(5000);

const client_id = process.env.CLIENT_ID;
const secret = process.env.SECRET;
const host = "https://spotify-playing-letti42.onrender.com";

var access_token;
var refreshToken;
var userFound = false;


app.get('/login', function (req, res) {

    var state = '123456789042s'
    var scope = 'user-read-currently-playing user-read-email user-read-playback-state';

    res.redirect('https://accounts.spotify.com/authorize?' +
        querystring.stringify({
            response_type: 'code',
            client_id: client_id,
            scope: scope,
            redirect_uri: host + '/callback',
            state: state
        })
    );
});

app.get('/callback', (req, res) => {
    if (!req.query.redir1) res.redirect('/callback1?' + querystring.stringify(req.query));
    else console.log('hi!!');
})

app.get('/callback1', async (req, res) => {

    let code = req.query.code || null;
    let state = req.query.state || null;

    if (state === null) return res.redirect('/#' + querystring.stringify({ error: 'state_mismatch' }));
    else {
        var authOptions = {
            url: 'https://accounts.spotify.com/api/token',
            form: {
                code: code,
                redirect_uri: host + '/callback',
                grant_type: 'authorization_code'
            },
            headers: {
                'Authorization': 'Basic ' + (new Buffer(client_id + ':' + secret).toString('base64'))
            },
            json: true
        };
        request.post(authOptions, async(err, response, body) => {
            if (!body.access_token) return;
            let check = await isMyUser(body.access_token);
            if (check) {
                access_token = body.access_token;
                refreshToken = body.refresh_token;
                userFound = true;
                console.log(`Refreshing in 10 minutes.. ⭐`);
            }
        })
    }
    res.redirect("/done")
});

app.get('/done', (req, res) => {
    res.send('Done! THanks for doing this hah ai  have all ur info');
})


app.use("/", express.static("web"));
app.get("/player.svg", (req,res)=>{
  res.set("Content-Type", "image/svg+xml");
  res.sendFile(__dirname+"/web/player.svg");
})


app.get('/', (req,res)=>{
    res.send("hello!");
})

setInterval(()=>{
    fetch(host);
  }, (1000 * 60)) // request page to stay up every minute

async function coolRefresh() {
    var authOptions = {
        url: 'https://accounts.spotify.com/api/token',
        headers: { 'Authorization': 'Basic ' + (new Buffer(client_id + ':' + secret).toString('base64')) },
        form: {
            grant_type: 'refresh_token',
            refresh_token: refreshToken
        },
        json: true
    };

    request.post(authOptions, function (error, response, body) {
        if (!error && response.statusCode === 200) {
            access_token = body.access_token;
            console.log('Refreshed! 🎁');
        }
    });
}



setInterval(() => {
    if(access_token)coolRefresh();
}, (10 * 60 * 1000)) //10 minutes refresh token


setInterval(async()=>{
    if(!userFound)return;
    let t = await getPlayingTrack(access_token);
    if(t == null)return pauseTrack();
    if(t?.item == null)return pauseTrack();
    setLink(t);
    fs.writeFileSync("track.json", JSON.stringify(t));
    svg.createSvg(host);
}, (1000*10)); // 10 seconds get the playing track


async function isMyUser(ac) {
    let user = await getUser(ac);
    if (!user) return !1;
    return user?.email === process.env.EMAIL;
}

function setLink(t){
    app.get("/link/player", (req,res)=>{
      res.redirect(t?.item?.external_urls?.spotify);
    })
  }

function pauseTrack(){
    let json = JSON.parse(fs.readFileSync("track.json", "utf-8"));
    json.is_playing = false;
    fs.writeFileSync("track.json", JSON.stringify(json));
    svg.createSvg();
}