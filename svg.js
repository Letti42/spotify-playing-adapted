const TextToSVG = require('text-to-svg');
const fetch = require('cross-fetch');
const fs = require("fs");
const he = require('he');
const { create } = require('domain');

async function createSvg(host) {
    let track = JSON.parse(fs.readFileSync("track.json", "utf-8"))
    //if img was already downloaded, use that b64 data; otherwise download and save new image
    let img = checkImg(track.item.album.images[1].url) ? fs.readFileSync("b64", "utf-8") : await downloadAlbumImage(track.item.album.images[1].url);
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
    ${isPlaying.length ? time.prog : time.style}
    `




    let svg = `
    <image href="${img}" height="230" width="230" x="40" y="40" />
    <rect x="30" y="300" width="250" height="3" rx="2" fill="#696969" />
    <rect x="30" y="300" width="${ratio * 250}" height="3" rx="2" fill="#495151" class="startWidth${isPlaying}"/>
    <circle r="5" cx="${isPlaying.length ? (ratio * 250 + 30) : 30}" cy="301" fill="#969696" class="startMoving${isPlaying}"></circle>
    <text class="time" y="320" x="270">${time.end}</text>
    ${time.playing}
    <svg role="img" height="16" width="16" y="315" x="100" aria-hidden="true" viewBox="0 0 16 16" fill="${isShuffled ? "#21ca1e" : "#696969"}" data-encore-id="icon"><path d="M13.151.922a.75.75 0 1 0-1.06 1.06L13.109 3H11.16a3.75 3.75 0 0 0-2.873 1.34l-6.173 7.356A2.25 2.25 0 0 1 .39 12.5H0V14h.391a3.75 3.75 0 0 0 2.873-1.34l6.173-7.356a2.25 2.25 0 0 1 1.724-.804h1.947l-1.017 1.018a.75.75 0 0 0 1.06 1.06L15.98 3.75 13.15.922zM.391 3.5H0V2h.391c1.109 0 2.16.49 2.873 1.34L4.89 5.277l-.979 1.167-1.796-2.14A2.25 2.25 0 0 0 .39 3.5z"></path><path d="m7.5 10.723.98-1.167.957 1.14a2.25 2.25 0 0 0 1.724.804h1.947l-1.017-1.018a.75.75 0 1 1 1.06-1.06l2.829 2.828-2.829 2.828a.75.75 0 1 1-1.06-1.06L13.109 13H11.16a3.75 3.75 0 0 1-2.873-1.34l-.787-.938z"></path></svg>
    <svg role="img" height="16" width="16" y="316" x="196" aria-hidden="true" viewBox="0 0 16 16" fill="${repeat == "off" ? "#696969" : "#21ca1e"}" data-encore-id="icon"><path d="M0 4.75A3.75 3.75 0 0 1 3.75 1h8.5A3.75 3.75 0 0 1 16 4.75v5a3.75 3.75 0 0 1-3.75 3.75H9.81l1.018 1.018a.75.75 0 1 1-1.06 1.06L6.939 12.75l2.829-2.828a.75.75 0 1 1 1.06 1.06L9.811 12h2.439a2.25 2.25 0 0 0 2.25-2.25v-5a2.25 2.25 0 0 0-2.25-2.25h-8.5A2.25 2.25 0 0 0 1.5 4.75v5A2.25 2.25 0 0 0 3.75 12H5v1.5H3.75A3.75 3.75 0 0 1 0 9.75v-5z"></path></svg>
    <text class="one" y="325" x="202" style="opacity:${repeat == "track" ? "1" : "0"}">1</text>
    ${redirectSvg}
    ${time.dur}
    ${track.is_playing ? time.overlay : ""}
</svg>
`;

    let temp = fs.readFileSync("web/temp.svg", "utf-8");
    fs.writeFileSync("web/player.svg", temp + style + svg);

    let titleSvg = createSvgText(title, "#a9fef7", 20);
    let artistSvg = createSvgText(artists, "#d83b7d", 18);
    fs.writeFileSync("web/title.svg", titleSvg);
    fs.writeFileSync("web/artist.svg", artistSvg);

}


function constructTime(track) {
    let d = track.item.duration_ms / 1000;
    let m_end = Math.floor(d / 60);
    let s_end = Math.floor(d % 60);
    let endTime = `${m_end}:${s_end < 10 ? "0" : ""}${s_end}`;

    let dur = initTimeElements();
    let style = initTransitionStyles(track.progress_ms / 1000, d); // in seconds
    let prog = getCurrentTime(track.progress_ms / 1000); //in seconds
    let overlay = timeOverlay(m_end, s_end);
    let play = initPlayingIcon(track.is_playing);

    return { end: endTime, dur: dur, style: style, prog: prog, playing: play, overlay:overlay };


}

function initTimeElements() {
    return (
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

function initTransitionStyles(prog, dur) { //in seconds
    let style = "<style>";

    let counts = getIterationCounts(dur);
    let restore = animationRestoreDelay(prog, dur, counts.last);

    for (let i = 0; i < 10; i++) {
        style += `.so${i}{
            animation-delay:-${(10 - i) + prog}s;
            animation-name:seconds_one;
            animation-iteration-count: ${counts.so[i]};
        }
        `
    }

    for (let i = 0; i < 6; i++) {
        style += `.st${i}{
            animation-delay:-${((6 - i) * 10) + prog}s;
            animation-name:seconds_ten;
            animation-iteration-count: ${counts.st[i]};
        }
        `
    }

    for (let i = 0; i < 10; i++) {
        style += `.m${i}{
            animation-delay:-${((10 - i) * 60) + prog}s;
            animation-name:minutes;
            animation-iteration-count: ${counts.m[i]};
        }
        `
    }

    style+=`
    .overlay{
        visibility:hidden;
        animation-name:restore;
        animation-delay:-${dur - prog}s;
        animation-duration:${dur - prog}s;
        animation-iteration-count: 2;
        animation-timing-function: step-end;
        animation-fill-mode: forwards;
    }`
    style += "</style>"
    //style += restore;
    return style;
}

function getCurrentTime(prog) {
    let m_end = Math.floor(prog / 60);
    let seconds = prog % 60;
    let s_ten = Math.floor(seconds / 10);
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

function getIterationCounts(dur) {
    let counts = { so: [], st: [], m: [], last:{} };

    for (let i = 0; i < 10; i++) {
        let c = Math.floor(dur / 10);
        if ((dur/10) % 1 > i / 10) c += 1, counts.last.so = i;
        counts.so.push(c+1);
    }

    dur = dur / 10;
    for (let i = 0; i < 6; i++) {
        let c = Math.floor(dur / 6);
        if ((dur/6) % 1 > i / 6) c += 1, counts.last.st = i;
        counts.st.push(c+1);
    }

    dur = dur / 6;
    for (let i = 0; i < 10; i++) {
        let c = 1;
        if(i < dur)c+=1, counts.last.m = i;
        counts.m.push(c+1);
    }

    //counts = {so:[4, 3, 3, 3, 3, 3, 3, 3, 3, 3], st:[2,2,2,1,1,1], m:[2,1,1,1,1,1,1,1,1,1]};

    return counts;


}

function animationRestoreDelay(prog, dur, final){
    let left = dur - prog; // in seconds
    let style = 
    `<style>
        /*.so${final.so}{
            animation-name:restore;
            animation-delay:-${left}s;
            animation-iteration-count: 1;
            animation-duration:1s;
            animation-timing-function: step-end;
            animation-fill-mode: forwards;
        }
        .st${final.st}{
            animation-name:restore;
            animation-delay:-${left}s;
            animation-iteration-count: 1;
            animation-duration:1s;
            animation-timing-function: step-end;
            animation-fill-mode: forwards;
        }
        .m${final.m}{
            animation-name:restore;
            animation-delay:-${left}s;
            animation-iteration-count: 1;
            animation-duration:1s;
            animation-timing-function: step-end;
            animation-fill-mode: forwards;
        }*/
        .overlay{
            animation-name:restore;
            animation-delay:-${left}s;
            animation-duration:0.1s;
            animation-iteration-count: 1;
            animation-timing-function: step-end;
            animation-fill-mode: forwards;
        }
    </style>`;
    
    return style;    
}

function initPlayingIcon(p) {
    return p ? `<rect height="16" width="4" y="315" x="150" stroke="#21ca1e" fill="#1bde18"></rect> <rect height="16" width="4" y="315" x="160" stroke="#21ca1e" fill="#1bde18"></rect>` :
        `<polygon points="150,314 150,332 165,323" style="fill:#696969;" />`
}

function filterArtists(track) {
    let artists = Array();
    track.item.artists.filter((a) => { artists.push(a.name) });
    if (artists.length >= 2) artists[artists.length - 1] = ` and ${artists[artists.length - 1]}`;
    if (artists.length >= 3) artists = artists.join(", ");
    else artists = artists.join(" ");
    artists = artists.replace(/\s\s+/g, " ");
    return artists;
}

function checkImg(url) {
    let lastURL = fs.readFileSync("image", "utf-8");
    return lastURL === url;
}

async function downloadAlbumImage(url) {
    let response = await fetch(url);
    let buf = await response.arrayBuffer();
    let b64 = Buffer.from(buf).toString("base64");
    b64 = `data:image/jpeg;base64,${b64}`;
    fs.writeFileSync("image", url);
    fs.writeFileSync("b64", b64);
    return b64;
}

function createSvgText(text, color, size) {
    const textToSVG = TextToSVG.loadSync(__dirname + "/web/Roboto-Bold.ttf");
    const attributes = { fill: color };
    const options = { x: 0, y: 0, fontSize: size, anchor: 'top', attributes: attributes };
    const svg = textToSVG.getSVG(text, options);

    return svg;
}

function timeOverlay(m_end, s_end){
    return(`<rect fill="#202020" width="40" height="20" x="10" y="305" class="overlay"></rect>
    <text y="320" x="17" class="time overlay">${m_end}:</text>
    <text y="320" x="27" class="time overlay">${Math.floor(s_end/10)}</text>
    <text y="320" x="34" class="time overlay">${s_end%10}</text>`);
}

module.exports = { createSvg };

createSvg();