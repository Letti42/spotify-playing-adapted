const TextToSVG = require('text-to-svg');
const fs = require("fs");
const he = require('he');

async function createSvg(host){
    let track = JSON.parse(fs.readFileSync("track.json", "utf-8"))
    let img = track.item.album.images[1].url;
    let title = track.item.name;
    let artists = filterArtists(track);
    let duration = track.item.duration_ms / 1000; //in seconds;
    let offset = track.progress_ms / 1000; //in seconds;
    let isPlaying = track.is_playing ? "" : "1";
    let ratio = offset / duration;
    let isShuffled = track.shuffle_state;
    let repeat = track.repeat_state;
    let redirectSvg = fs.readFileSync("web/redirect.svg", "utf-8");


    let time = constructTime(track);


    let style = `
    <style>

        .startMoving{
            animation-name:move;
            animation-duration: ${duration}s;
            animation-iteration-count: 1;
            animation-timing-function: linear;
            animation-fill-mode: forwards;
            animation-delay: -${offset}s;
        }

        .startWidth{
            animation-name:addWidth;
            animation-duration: ${duration}s;
            animation-iteration-count: 1;
            animation-timing-function: linear;
            animation-fill-mode: forwards;
            animation-delay: -${offset}s;
        }


    </style>
    ${isPlaying.length ? time.prog: time.style}
    `




    let svg = `
    <image href="${img}" height="230" width="230" x="40" y="40" />
    <rect x="30" y="300" width="250" height="3" rx="2" fill="#696969" />
    <rect x="30" y="300" width="${ratio*250}" height="3" rx="2" fill="#495151" class="startWidth${isPlaying}"/>
    <circle r="5" cx="${isPlaying.length ? (ratio*250+30) : 30}" cy="301" fill="#969696" class="startMoving${isPlaying}"></circle>
    <text class="time" y="320" x="270">${time.end}</text>
    ${time.playing}
    <svg role="img" height="16" width="16" y="315" x="100" aria-hidden="true" viewBox="0 0 16 16" fill="${isShuffled ? "#21ca1e" : "#696969"}" data-encore-id="icon"><path d="M13.151.922a.75.75 0 1 0-1.06 1.06L13.109 3H11.16a3.75 3.75 0 0 0-2.873 1.34l-6.173 7.356A2.25 2.25 0 0 1 .39 12.5H0V14h.391a3.75 3.75 0 0 0 2.873-1.34l6.173-7.356a2.25 2.25 0 0 1 1.724-.804h1.947l-1.017 1.018a.75.75 0 0 0 1.06 1.06L15.98 3.75 13.15.922zM.391 3.5H0V2h.391c1.109 0 2.16.49 2.873 1.34L4.89 5.277l-.979 1.167-1.796-2.14A2.25 2.25 0 0 0 .39 3.5z"></path><path d="m7.5 10.723.98-1.167.957 1.14a2.25 2.25 0 0 0 1.724.804h1.947l-1.017-1.018a.75.75 0 1 1 1.06-1.06l2.829 2.828-2.829 2.828a.75.75 0 1 1-1.06-1.06L13.109 13H11.16a3.75 3.75 0 0 1-2.873-1.34l-.787-.938z"></path></svg>
    <svg role="img" height="16" width="16" y="316" x="196" aria-hidden="true" viewBox="0 0 16 16" fill="${repeat == "off" ? "#696969" : "#21ca1e"}" data-encore-id="icon"><path d="M0 4.75A3.75 3.75 0 0 1 3.75 1h8.5A3.75 3.75 0 0 1 16 4.75v5a3.75 3.75 0 0 1-3.75 3.75H9.81l1.018 1.018a.75.75 0 1 1-1.06 1.06L6.939 12.75l2.829-2.828a.75.75 0 1 1 1.06 1.06L9.811 12h2.439a2.25 2.25 0 0 0 2.25-2.25v-5a2.25 2.25 0 0 0-2.25-2.25h-8.5A2.25 2.25 0 0 0 1.5 4.75v5A2.25 2.25 0 0 0 3.75 12H5v1.5H3.75A3.75 3.75 0 0 1 0 9.75v-5z"></path></svg>
    <text class="one" y="325" x="202" style="opacity:${repeat == "track" ? "1" : "0"}">1</text>
    ${redirectSvg}
    ${time.dur}
</svg>
`;

    let temp = fs.readFileSync("web/temp.svg", "utf-8");
    fs.writeFileSync("web/player.svg", temp+style+svg);

    let titleSvg = createSvgText(title, "#a9fef7", 20);
    let artistSvg = createSvgText(artists, "#d83b7d", 18);
    fs.writeFileSync("web/title.svg", titleSvg);
    fs.writeFileSync("web/artist.svg", artistSvg);

}


function constructTime(track){
    let d = track.item.duration_ms / 1000;
    let m_end = Math.floor(d / 60);
    let s_end = Math.floor(d % 60);
    let endTime = `${m_end}:${s_end < 10 ? "0" : ""}${s_end}`;
    
    let dur = initTimeElements();
    let style = initTransitionStyles(track.progress_ms / 1000); // in seconds
    let prog = getCurrentTime(track.progress_ms / 1000);
    let play = initPlayingIcon(track.is_playing);

    return {end:endTime, dur:dur, style:style, prog:prog, playing:play};


}

function initTimeElements(){
    return(
   `<text y="320" x="17" class="min time m0">0:</text>
    <text y="320" x="17" class="min time m1">1:</text>
    <text y="320" x="17" class="min time m2">2:</text>
    <text y="320" x="17" class="min time m3">3:</text>
    <text y="320" x="17" class="min time m4">4:</text>
    <text y="320" x="17" class="min time m5">5:</text>
    <text y="320" x="17" class="min time m6">6:</text>
    <text y="320" x="17" class="min time m7">7:</text>
    <text y="320" x="17" class="min time m8">8:</text>
    <text y="320" x="17" class="min time m9">9:</text>
    
    <text y="320" x="27" class="sec_ten time st0">0</text>
    <text y="320" x="27" class="sec_ten time st1">1</text>
    <text y="320" x="27" class="sec_ten time st2">2</text>
    <text y="320" x="27" class="sec_ten time st3">3</text>
    <text y="320" x="27" class="sec_ten time st4">4</text>
    <text y="320" x="27" class="sec_ten time st5">5</text>

    <text y="320" x="34" class="sec_one time so0">0</text>
    <text y="320" x="34" class="sec_one time so1">1</text>
    <text y="320" x="34" class="sec_one time so2">2</text>
    <text y="320" x="34" class="sec_one time so3">3</text>
    <text y="320" x="34" class="sec_one time so4">4</text>
    <text y="320" x="34" class="sec_one time so5">5</text>
    <text y="320" x="34" class="sec_one time so6">6</text>
    <text y="320" x="34" class="sec_one time so7">7</text>
    <text y="320" x="34" class="sec_one time so8">8</text>
    <text y="320" x="34" class="sec_one time so9">9</text>`);
}

function initTransitionStyles(prog){ //in seconds
    let style = "<style>";

    for(let i =0; i < 10; i++){
        style+=`.so${i}{
            animation-delay:-${(10-i)+prog}s;
            animation-name:seconds_one;
        }
        `
    }

    for(let i =0; i < 6; i++){
        style+=`.st${i}{
            animation-delay:-${((6-i)*10)+prog}s;
            animation-name:seconds_ten;
        }
        `
    }

    for(let i =0; i < 10; i++){
        style+=`.m${i}{
            animation-delay:-${((10-i)*60)+prog}s;
            animation-name:minutes;
        }
        `
    }

    style+="</style>"
    return style;
}

function getCurrentTime(prog){
    let m_end = Math.floor(prog/60);
    let seconds = prog%60;
    let s_ten = Math.floor(seconds/10);
    let s_one = Math.floor(seconds % 10);

    let style = 
    `<style>
        .m${m_end}{
            opacity:1;
        }
        .st${s_ten}{
            opacity:1;
        }
        .so${s_one}{
            opacity:1;
        }
    </style>`;

    return style;

}

function initPlayingIcon(p){
    return p ? `<rect height="16" width="4" y="315" x="150" stroke="#21ca1e" fill="#1bde18"></rect> <rect height="16" width="4" y="345" x="160" stroke="#21ca1e" fill="#1bde18"></rect>` :
    `<polygon points="150,314 150,332 165,323" style="fill:#696969;" />`
}

function filterArtists(track){
    let artists = Array();
    track.item.artists.filter((a)=>{artists.push(a.name)});
    if(artists.length >= 2)artists[artists.length -1] = ` and ${artists[artists.length-1]}`;
    if(artists.length >= 3)artists = artists.join(", ");
    else artists = artists.join(" ");
    artists = artists.replace(/\s\s+/g, " ");
    return artists;
}

function createSvgText(text, color, size) {
    const textToSVG = TextToSVG.loadSync(__dirname + "/web/Roboto-Bold.ttf");
    const attributes = { fill: color };
    const options = { x: 0, y: 0, fontSize: size, anchor: 'top', attributes: attributes };
    const svg = textToSVG.getSVG(text, options);
    
    return svg;
}

module.exports = {createSvg};


createSvg();