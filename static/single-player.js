/***
 * Creates a script element for single-player.html allowing jquery reference in below functions ($ used)
 * @type {HTMLScriptElement}
 */
let script = document.createElement('script');
script.type = 'text/javascript';
script.src = 'https://code.jquery.com/jquery-3.7.0.js';
document.body.appendChild(script);

// CONSTS
const SONG_INPUT = document.getElementById("song-input");
const SONG_INPUT_BACKGROUND = document.getElementById("song-input-div");
const ARTIST_INPUT = document.getElementById("artist-input");
const ARTIST_INPUT_BACKGROUND = document.getElementById("artist-input-background");
const ARTIST_LOAD_ICON = document.getElementById("artist-loader");
const SONG_INPUT_AUTOCOMPLETE = document.getElementById("autocomplete-song-input");
const ARTIST_INPUT_AUTOCOMPLETE = document.getElementById("autocomplete-artist-input")
const COUNTDOWN = document.getElementById("countdown");
const SCORE = document.getElementById("score");
const RIGHT_ANSWER = document.getElementById("right-answer");
const RIGHT_DIV = document.getElementById("right-div");
const WRONG_ANSWER = document.getElementById("wrong-answer");
const WRONG_DIV = document.getElementById("wrong-div");
const ARTIST_PHOTO = document.getElementById("photo");
const PHOTO_CONTAINER = document.getElementById("photo-container")
const HIGHSCORE_TEXT = document.getElementById("highscore")
const ARTIST_WARNING = document.getElementById("warning-icon")

const queryParams = new URLSearchParams(window.location.search);

const orgPoint = 1000;
const streakMultiplier = 1.02;
const animationTime = 1500;


// Global Variables
let currentlyPlaying = false;
let allowInput = true;
let allowPlayMusic = false;
let currentSongs = [];
let backupCurrentSongs = [];
let recentSongs = []
let currentSongName = ""
let music = new Audio()
let countdownTimerInterval;
let time = 0;
let msTimerInterval;
let scoreResetAnimationInterval;
let streak = 0;
let score = 0;
let highScore = 0;
let artistPhoto = ""

// Acts like the main function
window.onload = (event) => {
    resetTokens();
};

function resetTokens(){
     if(queryParams.get("token") != null && queryParams.get("rtoken") != null && queryParams.has("refreshed") != null) {
        console.log("run")
        location.assign("http://127.0.0.1:8080/single-player");
        localStorage.setItem("token", queryParams.get("token"));
        localStorage.setItem("refreshToken", queryParams.get("rtoken"));
        localStorage.setItem("isRefreshed", queryParams.has("refreshed").toString());
        if(localStorage.getItem("isRefreshed") !== "false"){
            alert("Try again! We just refreshed our connection to your account")
        }
    }
}

function playMusic(){
    if(!currentlyPlaying && allowPlayMusic) {
        SONG_INPUT.removeAttribute('list');
        SONG_INPUT.value = "";
        try {
            if (music != null) {
                currentlyPlaying = true;
                music.play().then(function () {
                    if (msTimerInterval != null)
                        window.clearInterval(msTimerInterval);
                    time = 1000;
                    countdownTimerInterval = window.setInterval(countdown, 1000);
                    msTimerInterval = window.setInterval(calcMSTime, 10);
                    music.addEventListener("ended", function () {
                        music.currentTime = 0;
                        currentlyPlaying = false;
                    });
                })
            }
        }
        catch{
            alert("Looks like your songs haven't loaded yet! If you keep getting this error try restarting your computer")
        }
    }
}
function resetMusic(){
    music.pause()
    music = new Audio()
    music.currentTime = 0;
    currentlyPlaying = false;
}

/*
    function editArtist()
    Called upon when the user clicks the edit button under the artist input
    Un-blurs and enables input for the user (allows the user to change their artist)
 */
function editArtist(){
    if(allowInput) {
        ARTIST_WARNING.style.display = "none";
        PHOTO_CONTAINER.style.display = "none";
        allowPlayMusic = false;
        localStorage.setItem(ARTIST_INPUT.value.toLowerCase() + " high score", highScore);
        ARTIST_INPUT.value = "";
        ARTIST_INPUT_BACKGROUND.style.filter = "blur(0px)";
        ARTIST_INPUT.disabled = false;
        HIGHSCORE_TEXT.textContent = ""
        score = 0;
        highScore = 0;
        streak = 0;
        SCORE.textContent = ""
        COUNTDOWN.textContent = "10";
        if (countdownTimerInterval != null)
            window.clearInterval(countdownTimerInterval)
        if (msTimerInterval != null)
            window.clearInterval(msTimerInterval)
        time = 1000;
        resetMusic();
    }
}

ARTIST_INPUT.onfocusout = function(){
    if(allowInput){
        if(ARTIST_INPUT.value !== "")
        submitArtist();
    }
};

function disableUserInput(){
    allowInput = false;
    ARTIST_INPUT_BACKGROUND.style.filter = "blur(1px)";
    ARTIST_INPUT.disabled = true;
    SONG_INPUT.disabled = true;
    SONG_INPUT_BACKGROUND.style.filter = "blur(1px)";
}
function enableUserInput(){
    allowInput = true;
    ARTIST_INPUT_BACKGROUND.style.filter = "blur(0px)";
    ARTIST_INPUT.disabled = false;
    SONG_INPUT.disabled = false;
    SONG_INPUT_BACKGROUND.style.filter = "blur(0px)";
}

function retrieveLocalHighscores(){
    HIGHSCORE_TEXT.textContent = localStorage.getItem(ARTIST_INPUT.value.toLowerCase() + " high score") != null ? "HIGH SCORE: " + Math.round(localStorage.getItem(ARTIST_INPUT.value.toLowerCase() + " high score")): "HIGH SCORE: 0";
    highScore = localStorage.getItem(ARTIST_INPUT.value.toLowerCase() + " high score") != null ? localStorage.getItem(ARTIST_INPUT.value.toLowerCase() + " high score"): 0;
}
function setHighScore(){
    highScore = score;
    localStorage.setItem(ARTIST_INPUT.value.toLowerCase() + " high score", highScore);
    HIGHSCORE_TEXT.textContent = "HIGH SCORE: " + Math.round(score).toString();
}

/*
    function submitArtist()
    Called upon when the user submits an artist
    Blurs and disables input (doesn't allow the user to change their artist)
 */
function submitArtist(){
    if(allowInput) {
        if(localStorage.getItem("token") != null){
            getCustomSongs();
        }
        else{
            getDefaultSongs();
        }
    }
}

function getCustomSongs(){
    allowPlayMusic = false;
    ARTIST_LOAD_ICON.style.opacity = "1";
    disableUserInput();
    $.ajax({
        type: "POST",
        url: "/store_artist_check_custom",
        beforeSend: function (xhr) {
            xhr.overrideMimeType("text/plain")
        },
        data: {"input": ARTIST_INPUT.value, "token": localStorage.getItem("token"), "refreshToken": localStorage.getItem("refreshToken")},
    }).done(function (data) {
        cleanReturnedData(data);
    })
}
function getDefaultSongs(){
    allowPlayMusic = false;
    ARTIST_LOAD_ICON.style.opacity = "1";
    disableUserInput();
    $.ajax({
        type: "POST",
        url: "/store_artist_check",
        beforeSend: function (xhr) {
            xhr.overrideMimeType("text/plain")
        },
        data: {"input": ARTIST_INPUT.value},
    }).done(function (data) {
        cleanReturnedData(data);
    })
}

function cleanReturnedData(data){
    if(data.includes("?token=")){
        localStorage.setItem("token", data.split("?token=")[1]);
        data = data.split("?token=")[0]
    }
    if (data !== "Artist_has_no_url") {
            allowPlayMusic = true;
            data = decodeURIComponent(JSON.parse(data)); //allows for special unicode characters
            currentSongs = data.replace("[", "").replace("]", "").replace(/"/g, "").split(",");
            for(let i = 0; i < currentSongs.length; i++){
                currentSongs[i] = currentSongs[i].replace("{COMMA HERE}",",")
            }
            if(currentSongs[0] === "Limited Selection"){
                ARTIST_WARNING.style.display = "block";
            }
            artistPhoto = currentSongs[1];
            ARTIST_PHOTO.src = artistPhoto;
            if(artistPhoto !== "")
                PHOTO_CONTAINER.style.display = "block";
            retrieveLocalHighscores();
            currentSongs.splice(0, 2); //removes the artist url and "artist_has_no_url" from the array
            backupCurrentSongs = currentSongs.slice(0);
            selectSong();
            setSongAutocomplete();
            SCORE.innerText = "0"
        } else {
            alert("The artist you entered doesn't have preview URLs! Check your spelling or try another artist.");
            ARTIST_INPUT.value = ""
        }
        ARTIST_INPUT.blur("0px");
        ARTIST_LOAD_ICON.style.opacity = "0";
        enableUserInput();
}
function selectSong(){
    if(currentSongs.length > 0){
        let rand = getRandNumber()
        let musicStart = Math.floor(Math.random() * 20)
        music = new Audio(currentSongs[rand].split("|#&")[1] + "#t=" + musicStart.toString() + "," + (musicStart + 10).toString());
        currentSongName = currentSongs[rand].split("|#&")[0].trim();
        recentSongs.push(currentSongs[rand].split("|#&")[0].trim());
        currentSongs.splice(rand,1);
        if(backupCurrentSongs.length > 6 &&  recentSongs.length > 5)
            recentSongs.shift();
    }
    else{
        currentSongs = backupCurrentSongs.slice(0);
        selectSong();
    }
}

function getRandNumber(){
    let rand = 0;
    let hasRun = false
    while(!hasRun && !recentSongs.includes(currentSongs[rand].split("|#&")[0].trim)) {
        hasRun = true;
        rand = Math.floor(Math.random() * currentSongs.length)
    }
    return rand;
}


ARTIST_INPUT.addEventListener("keyup", function(event) {
    if (event.key === "Enter") {
        submitArtist();
    }
    else{
        $.ajax({
        type: "POST",
        url: "/artist_suggestions",
        beforeSend: function (xhr) {
            xhr.overrideMimeType("text/plain")
        },
        data: {"input": ARTIST_INPUT.value},
        }).done(function (data) {
            setArtistAutocomplete(JSON.parse(data))
        })
    }
});

function resetSongInput(){
    SONG_INPUT.value = ""
    SONG_INPUT.blur("0px");
    SONG_INPUT.focus();
}
function pointsAnimation(){
    RIGHT_ANSWER.textContent = "+" + Math.round(calculateScore(time, streak, score)[0]);
    RIGHT_DIV.style.display = "table";
}
function incorrectAnswerAnimation(){
    WRONG_ANSWER.textContent = currentSongName;
    WRONG_DIV.style.display = "table";
    scoreResetAnimationInterval = window.setInterval(scoreResetAnimation, (10), score/animationTime);
}

/* CHECKS IF CORRECT ANSWER */
function onSongInput(input) {
    if (input === "") {
        input = SONG_INPUT.value
    }
    if (SONG_INPUT.value === "") {
        SONG_INPUT.blur("0px")
        SONG_INPUT.focus()
    }
    if (cleanInput(currentSongName) === cleanInput(input) && currentlyPlaying) {
        resetSongInput();
        pointsAnimation();
        score = calculateScore(time, streak, score)[1];
        setTimeout(resetAnswerDivs, animationTime);
        SCORE.innerText = Math.round(score).toString();
        streak += 1;
        time = 1000;
        if (score > highScore) {
            setHighScore();
        }
        resetMusic();
        selectSong();
        resetCountdown();
        playMusic();
    }
}

function onArtistInput(){
    if (ARTIST_INPUT.value === "") {
        ARTIST_INPUT.blur("0px")
        ARTIST_INPUT.focus()
    }
}


SONG_INPUT.addEventListener("keyup", function(event) {
    if (event.key === "Enter") {
        if(SONG_INPUT.value.trim() !== '') {
            for(let i = 0; i < SONG_INPUT_AUTOCOMPLETE.children.length; i++){
                if(SONG_INPUT_AUTOCOMPLETE.children[i].value.toLowerCase().startsWith(SONG_INPUT.value.toLowerCase())){
                    onSongInput(SONG_INPUT_AUTOCOMPLETE.children[i].value);
                    SONG_INPUT.focus();
                    return;
                }
            }
            for(let i = 0; i < SONG_INPUT_AUTOCOMPLETE.children.length; i++){
                if(SONG_INPUT_AUTOCOMPLETE.children[i].value.toLowerCase().includes(SONG_INPUT.value.toLowerCase())){
                    onSongInput(SONG_INPUT_AUTOCOMPLETE.children[i].value);
                    SONG_INPUT.focus();
                    return;
                }
            }
        }
        else{
            playMusic();
            SONG_INPUT.focus();
        }
    }
});

function cleanInput(string){
    if(!string.startsWith("(") && !string.startsWith("-")){
        string = string.substring(0, string.indexOf("(") !== -1 ? string.indexOf("("): string.indexOf("-") !== -1 ? string.indexOf("-"): string.length)
    }
    let replace = ["?","!",",",".","_","(",")","-","[","]","{","}"]
    for(let i = 0; i < replace.length; i++){
        string = string.replace(i, "")
    }
    return string.toLowerCase().replace(/'/g,"").replace(/"/g,"").trim()
}
function setSongAutocomplete(){
    $(SONG_INPUT_AUTOCOMPLETE).empty();
    outerloop: for(let i = 0; i < backupCurrentSongs.length; i++){
        for(let x = 0; x < SONG_INPUT_AUTOCOMPLETE.children.length; x++){
            if(backupCurrentSongs[i].split("|#&")[0].trim() === SONG_INPUT_AUTOCOMPLETE.children[x].value)
                continue outerloop;
        }
        let option = document.createElement("option");
        option.value = backupCurrentSongs[i].split("|#&")[0].trim()
        SONG_INPUT_AUTOCOMPLETE.appendChild(option);
    }
}

function setArtistAutocomplete(data){
    outerloop: for(let i = 0; i < data.length; i++){
        for(let x = 0; x < ARTIST_INPUT_AUTOCOMPLETE.children.length; x++){
            if(data[i] === ARTIST_INPUT_AUTOCOMPLETE.children[x].value){
                continue outerloop;
            }
        }
        let option = document.createElement("option");
        option.value = data[i]
        ARTIST_INPUT_AUTOCOMPLETE.appendChild(option);
    }
}

function countdown(){
    if(COUNTDOWN.textContent !== "1")
        COUNTDOWN.textContent = (Number(COUNTDOWN.textContent) - 1).toString();
    else {
        resetSongInput();
        incorrectAnswerAnimation();
        setTimeout(resetAnswerDivs, animationTime + 300)
        COUNTDOWN.textContent = (Number(COUNTDOWN.textContent) - 1).toString();
        window.clearInterval(countdownTimerInterval)
        window.clearInterval(msTimerInterval)
        time = 1000;
        currentlyPlaying = false;
        if(score > highScore){
            setHighScore();
        }
        score = 0;
        streak = 0;
        resetMusic();
        selectSong();
        resetCountdown();
    }
}
function resetCountdown(){
    if(countdownTimerInterval != null){
        window.clearInterval(countdownTimerInterval)
    }
    COUNTDOWN.textContent = "10";
}

function calculateScore(guessTime, streak, previousScore) {
    let timePenalty = (1000 - guessTime) / 2;
    let point = (orgPoint - timePenalty) * Math.pow(streakMultiplier, streak);
    return [point, point + previousScore];
}

function calcMSTime(){
    time -= 1;
}

function resetAnswerDivs(){
    WRONG_DIV.style.display = "none";
    RIGHT_DIV.style.display = "none";
}

function scoreResetAnimation(lossAmount) {
    lossAmount = lossAmount * 100
    if(lossAmount > 1) {
        SCORE.innerText = (Math.round(parseInt(SCORE.innerText) - lossAmount + Math.random())).toString();
        if (parseInt(SCORE.innerText) <= 0 || currentlyPlaying) {
            window.clearInterval(scoreResetAnimationInterval);
            SCORE.innerText = "0";
        }
    }
}