var SpeechRecognition = SpeechRecognition || webkitSpeechRecognition
var SpeechGrammarList = SpeechGrammarList || webkitSpeechGrammarList
var SpeechRecognitionEvent = SpeechRecognitionEvent || webkitSpeechRecognitionEvent
var colors = ["red", "green", "blue", "yellow"];
var shapes = ["square", "circle", "triangle"];
var text = ["red", "green", "blue", "yellow", "square", "circle", "triangle"];


var grammar = '#JSGF V1.0; grammar text; public <text> = ' + text.join(' | ') + ' ;'

var recognition = new SpeechRecognition();

var speechRecognitionList = new SpeechGrammarList();
speechRecognitionList.addFromString(colors, 1);
speechRecognitionList.addFromString(shapes, 1);
speechRecognitionList.addFromString(text, 1);

recognition.grammars = speechRecognitionList;
recognition.continuous = true;
recognition.lang = 'en-US';
recognition.interimResults = true;
recognition.maxAlternatives = 0;

var timer = 0;
var timerLoop = null;
var lives = 3;
var score = 0;
var highestScore = 0;
var difficulty = 0;
var timerDone = 0;
var timerStart = -1;
var ticker = 0;
var lastTick = 0;
var lastSpawn = 0;
var limit = 4;
var activeWords = [];
var cnv = document.getElementById("Canvas");
var ctx;
var width, height, lMarg, rMarg, hheight, hwidth, diagLng;
var gameOver = true;
var overlay, endScreen;
var synth ;
  var voices ;
function init() {
  width = window.innerWidth || document.documentElement.clientWidth / 1 || document.body.clientWidth;
  height = window.innerHeight || document.documentElement.clientHeight / 1 || document.body.clientHeight / 1;
  lMarg = Math.floor(width * 0.1 / 2);
  rMarg = lMarg * 3;
  hheight = height / 2;
  hwidth = width / 2;

  diagLng = Math.sqrt(width * height);

  cnv.width = width;
  cnv.height = height;
  ctx = cnv.getContext("2d");
  try {
    highestScore = window.localStorage.getItem("SayItHighscore");
  } catch (e) {
    console.log("couldnt load a highscore");
  }
  synth = window.speechSynthesis;
  voices = [];
  voices = synth.getVoices()
  console.log(voices);
  console.log(synth);
  
  speak(0.5,1,"Welcome To the game, Player!" )
   
  showMenu();
}
window.onLoad = init();
function speak(pitch,rate,txt) {
  var utterThis = new SpeechSynthesisUtterance(txt);
  utterThis.voice = voices[1];
  utterThis.pitch = pitch;
  utterThis.rate = rate;
  synth.speak(utterThis);
}
function tick() {
  let now = window.performance.now();
  ticker += now - lastTick;
  lastTick = now;
  draw();
  while (ticker > 16) {
    ticker -= 16;
    step();
  }
  if (!gameOver) {
    window.requestAnimationFrame(tick);
  }


}

function step() {
  for (let i = activeWords.length - 1; i >= 0; i--) {
    if (!activeWords[i].dead) {
      activeWords[i].dur -= 0.01 / (7 / (difficulty + 1));
      if (activeWords[i].dur <= activeWords[i].xwd/width) {
        //activeWords.splice(i, 1);
        activeWords[i].dead = true;
        difficulty = 0;
        $("#live" + lives).fadeOut();
        sounds.dead.play(aCtx.currentTime, 1);
        lives--;

        if (lives <= 0) {
          loseGame();
        }
      }
    } else {
      activeWords[i].deadDur = Math.min(activeWords[i].deadDur * 0.99, activeWords[i].deadDur - 0.01);
      if (activeWords[i].deadDur <= 0.0005) {
        activeWords.splice(i, 1);
      }
    }
  }
  if (activeWords.length < limit) {
    if (lastTick - lastSpawn > 10000 * 1 / (limit * (difficulty + 1))) {
      lastSpawn = lastTick;
      spawnWord();
    }
  }
}

function showMenu() {
  if (!overlay) {
    overlay = createDiv("overlay", "overlay", {
      width: "100%",
      height: "100%",
      position: "absolute",
      left: "0px",
      top: "0%",
    }, {
      innerHTML: "<div class='title'></div> <div id='playBut' class='button' onclick='startGame()'> Start Game</div>",
    })
    document.body.appendChild(overlay)
  }
  $("#overlay").fadeIn();



}

function loseGame() {
  openEndScreen();
  recognition.stop();

 // sounds.gameOver.play(aCtx.currentTime, 1);
  gameOver = true;
};

function openEndScreen() {
  speak(0.5,1,"Game! Over!")
  if (!endScreen) {
    endScreen = createDiv("endScreen", "endScreen", {
      width: "80%",
      height: "80%",
      top: "100%",
      left: "10%",
      position: "absolute",
      zIndex: 1000,
    }, {
      innerHTML: "<h1>Game Over!</h1>"
    })
    let sc = createDiv("score", "line", {

    }, {
      innerHTML: "Final Score: " + nF(score),
    })

    let again = createDiv("again", "button", {

    }, {
      innerHTML: "Play Again",
    })
    again.addEventListener("click", function() {
      speak(0.5,1,"Play Again!")
      startGame()
    });

    let menu = createDiv("again", "button", {

    }, {
      innerHTML: "Main Menu",
    })
    menu.addEventListener("click", function() {
      speak(0.5,1,"Main Menu!")
      showMenu()
    });

    let hsc = createDiv("Highscore", "line", {
      fontSize: "1.5em",
      marginTop: "5%",
    }, {
      innerHTML: "HighScore: " + nF(highestScore),
    })

    endScreen.appendChild(sc);
    endScreen.appendChild(again);
    endScreen.appendChild(menu);
    endScreen.appendChild(hsc);
    document.body.appendChild(endScreen)

    $(endScreen).animate({
      top:"10%"
    })

  }
  $("#score").html("Final Score: " + nF(score));
  if (score > highestScore) {
    highestScore = score;
    try {
      window.localStorage.setItem("SayItHighscore", nF(highestScore));
    } catch (e) {
      console.log("Couldn't Save Highscore.")
    }
    $("#Highscore").html("HighScore: " + nF(highestScore));
  }
  $("#endScreen").fadeIn();

}


function getTextArray(tx) {
  let arr = tx.split(" ");
  return arr;
}

function startTimer() {
  timer = window.performance.now() - timerStart;
  /*timerEl.innerHTML = Math.floor(timer / 100) / 10;*/
  if (timerStart > 0) {
    timerLoop = window.requestAnimationFrame(startTimer);
  }
}
function nF(num,dig) {
  dig = dig || 0;
  let exp = Math.pow(10,dig);
  return Math.floor(exp * num)/exp
}
function stopTimer() {
  addHiscore("speeches", currentText.name, timer)
  timerStart = -1;
}

function dontstartGame() {
  console.log("Dont Click... Say It!")
}
function startGame() {
  speak(0.5,1,"Start Game!")
  if (gameOver) {
    recognition.start();
    timerStart = event.timeStamp;
    timerDone = 0;
    startTimer();
    $(".live").fadeIn();
    activeWords = [];
    $("#overlay").fadeOut();
    $("#endScreen").fadeOut();
    lives = 3;
    score = 0;
    difficulty = 0;
    gameOver = false;
    lastTick = window.performance.now();
    window.setTimeout(tick, 500);
    console.log('Ready to receive a command.');

  }
}

recognition.onspeechstart = function(event) {
  console.log('Speech has been detected');
}
var lastResultStr = "";
var lastResultTime = 0;
var lastRegistered = "";
recognition.onresult = function(event) {
  console.log(event);
  timer = event.timeStamp - timerStart;
  // timerEl.innerHTML = Math.floor(timer / 100) / 10;
  let finals = "";
  let interim = "";
  let last = event.results.length - 1;
  let last2 = event.results[last].length - 1;
  /*console.log(event);*/
  /*for (let j = 0;j<event.results.length;j++) {*/
  let trans = event.results[last][last2].transcript.split(" ");
  lastRegistered = event.results[last][last2].transcript;
  for (let k = trans.length - 1; k >= 0; k--) {
    let words = trans[k].split(" ");
    for (let i = words.length - 1; i >= 0; i--) {
      interim += words[i] + " ";
      //let i = words.length-1;
      if (event.timeStamp - lastResultTime < 1000 && lastResultStr == words[i].toLowerCase()) {
        continue;
      }

      for (let str = activeWords.length - 1; str >= 0; str--) {


        if (words[i].toLowerCase() == activeWords[str][activeWords[str].sign].toLowerCase()) {
          activeWords[str].dead = true;
          lastRegistered = words[i];
          lastResultStr = words[i].toLowerCase();
          lastResultTime = event.timeStamp;
          sounds.kill.play(aCtx.currentTime,1);
          score += 10 * (difficulty + 1);
          difficulty += (difficulty + 1) * 0.1;
          //activeWords.splice(str,1);
          recognition.stop();
          continue;
        }

      }
    }

  }

}
recognition.onend = function() {
  if (!gameOver) {
    recognition.start();

  }
}
recognition.onspeechend = function() {
  console.log("speech has ended");
}

recognition.onnomatch = function(event) {
  diagnostic.textContent = "I didn't recognise that color.";
}

recognition.onerror = function(event) {
  /*console.log('Error occurred in recognition: ' + event.error);*/
}
var fillColors = {
  green:"rgba(15,166,15,1)",
  blue:"rgba(15,58,155,1)",
  red:"rgba(155,18,15,1)",
  yellow:"rgba(155,158,15,1)"
}
function spawnWord() {

  let col = colors[Math.floor(Math.random() * colors.length)];
  let shape = shapes[Math.floor(Math.random() * shapes.length)];
  let txt = text[Math.floor(Math.random() * text.length)];
  let rnd = Math.random();
  let sig = "text";
  if (rnd < 1 / 3) {
    sig = "color";
  } else if (rnd < 2 / 3) {
    sig = "shape";
  }
  createWord(col, shape, txt, sig);
}

function createWord(col, shape, txt, sig) {
  let opts = {
    dead: false,
    dur: 1.1,
    deadDur: 1,
    color: col,
    shape: shape,
    text: txt,
    sign: sig
  }
  if (opts.sign == "shape") {
    opts.dur+=0.1

  } else if (opts.sign == "text") {
  } else if (opts.sign == "color") {
    opts.dur+=0.2
  }
  activeWords.push(new activeWord(opts))
}

function activeWord(opt) {
  for (let i in opt) {
    this[i] = opt[i];
  }
  this.img = document.createElement("canvas");
  let siz = height * 0.125;
  this.img.width = siz*1.5;
  this.img.height = siz*1.5;
  let c = this.img.getContext("2d");
  c.save();
    c.fillStyle = fillColors[this.color];
    c.strokeStyle="rgba(0,0,0,1)"
    c.lineWidth=5;

    let x = (1 - this.dur) * width * 0.9;
    let y = 0;
    let w,h;
    let tx = this.text;
    c.font = 0.2 * siz + "px Arial black";
    c.shadowColor="rgba(155,155,155,1)";
    c.shadowBlur = 5;
    let wd = c.measureText(tx).width;
    switch (this.shape) {
      case "triangle":
        c.textBaseline = "bottom"
        w = wd * 1.7;
        h = w * 0.75;
        y = siz*0.75+h/2;//height * 0.25 + height * 0.375
        this.xwd = 0.75*siz+w/2
        break;
      case "circle":
        w = wd * 0.6;
        h = wd * 0.6;
        this.xwd = 0.75*siz+w
        c.textBaseline = "middle"
        y = siz*0.75//height * 0.25 + height * 0.625
        break;
      case "square":
        w = wd * 1.2
        h = wd * 1.2
        this.xwd = 0.75*siz+w/2
        c.textBaseline = "middle"
        y = siz*0.75//height * 0.25 + height * 0.125
        break;
    }
    c.beginPath();
    if (this.shape == "triangle") {
      c.moveTo(0.75 * siz,       0.75*siz-h/2 );
      c.lineTo(0.75 * siz-w*0.5, 0.75*siz+h/2);
      c.lineTo(0.75 * siz+w*0.5, 0.75*siz+h/2);
      c.closePath();
    } else if (this.shape == "circle") {
      c.arc(0.75 * siz, 0.75*siz, w, 0, Math.PI * 2, 0);
    } else {
      c.rect(0.75*siz - w/2, 0.75 * siz - h/2, w, h);
    }
    c.stroke();
    c.fill();
    c.closePath();

    c.fillStyle = "black";
    
    
    c.fillText(tx,0.75 * siz - wd / 2, y);
    c.restore();

}

function draw() {
  ctx.clearRect(0,0, width, height);
  //ctx.clearRect(0, height*0.25+height*0.125, width, height*0.25);
  //ctx.clearRect(0, height*0.25+height*0.325, width, height*0.25);
  //ctx.clearRect(0, height*0.25+height*0.625, width, height*0.25);
  let siz = height * 0.125;
  for (let i = activeWords.length - 1; i >= 0; i--) {
    ctx.save();
    // ctx.fillStyle = activeWords[i].color;
    // if (activeWords[i].color == "blue") {
    //   ctx.fillStyle = "rgba(50,50,255,1)";
    // }
    
    let x = Math.max(activeWords[i].xwd*0.5,(1 - activeWords[i].dur) * width * 1);
    let y = 0;
    switch (activeWords[i].sign) {
      case "shape":
        y = height * 0.25 + height * 0.375
        break;
      case "text":
        y = height * 0.25 + height * 0.625
        break;
      case "color":
        y = height * 0.25 + height * 0.125
        break;
    }
    let scx = 1;
    if (activeWords[i].dur > 1) {
      y = y + (height - y) *  (activeWords[i].dur-1)/0.3
    }
    // if ((activeWords[i].dur)>0.95) {
    //   scx = 20*(Math.max(0.01,(activeWords[i].dur-0.95)/0.15 ));
    // }
    ctx.save();
    ctx.translate(x,y)
    if (activeWords[i].dead) {
      ctx.globalAlpha = activeWords[i].deadDur;
      ctx.rotate((1 - activeWords[i].deadDur) * 1 * Math.PI);
    }
    ctx.drawImage(activeWords[i].img,0,0-siz*0.75,siz*1.5*scx,siz*1.5)
    ctx.restore();
  }
  // ctx.strokeStyle = "rgba(255,0,0,0.5)";
  // ctx.lineWidth = 5;
  // ctx.beginPath();
  // ctx.moveTo(width * 1, height * 0.25);
  // ctx.lineTo(width * 1, height);
  // ctx.stroke();
  // ctx.closePath();
  ctx.fillStyle = "white";
  ctx.font = "25px Arial white";
  let tx = lastRegistered;
  let wd = ctx.measureText(tx).width;
  ctx.fillText(tx, width / 2 - wd / 2, height * 0.225);

  ctx.font = "25px Arial white";
  ctx.fillText(Math.floor(10 * score) / 10, width * 0.5 / 5, height * 0.1+ height*0.05);

  ctx.font = "14px Arial white";
  ctx.fillText("x" + Math.floor(10 * (difficulty + 1)) / 10, width * 0.5 / 5-5, height * 0.1+ height*0.05+27);


}



var aCtx = new(window.AudioContext || window.webkitAudioContext)();



function getPeriodicCoefficientArrays(type, length) {
  //b[n]=2nπ[1−(−1)n]
  let a = new Float32Array(length);
  let b = new Float32Array(length);
  for (let i = 1; i < length; i++) {
    if (type == "square") {
      a[i] = (0);
      b[i] = ((2 / i * Math.PI) * (1 - Math.pow(-1, i)));
    } else if (type == "sine") {
      if (i == 1) {
        a[i] = (0);
        b[i] = (1);
      }
    } else if (type == "sawtooth") {
      a[i] = (0);
      b[i] = (Math.pow(-1, i + 1) * (2 / (i * Math.PI)))
    } else if (type == "triangle") {
      a[i] = (0);
      b[i] = ((8 * Math.sin((i * Math.PI) / 2)) / Math.pow(Math.PI * i, 2))
    } else if (type == "custom") {
      a[i] = (0);
      b[i] = (customWaveFunction(i))
    }
  }

  return {
    a: a,
    b: b
  }
}


var sounds = {
  dead: {
    wave: null,
    play: function(cT, tT) {
      let o = aCtx.createOscillator();
      let g = aCtx.createGain();
      g.gain.setValueAtTime(0.0001, aCtx.currentTime);
      if (!this.wave) {
        this.load();
      }
      o.setPeriodicWave(this.wave);
      o.connect(g);
      g.connect(aCtx.destination);
      this.set(o, g, cT, tT);
      o.start(cT);
      o.stop(cT + tT);
      o.onend = function() {
        console.log("ended");
      }
    },
    load: function() {
      var perArr = getPeriodicCoefficientArrays('sawtooth', 100);
      this.wave = aCtx.createPeriodicWave(perArr.a, perArr.b, {
        disableNormalization: false
      });
      perArr = null;
    },

    set: function(o, g, cT, tT) {
      g.gain.setValueAtTime(0.0001, cT + tT * 0);
      g.gain.exponentialRampToValueAtTime(0.42965237636480413, cT + tT * 0.12903225806451613);
      g.gain.setValueAtTime(0.42965237636480413, cT + tT * 0.12903225806451613);
      g.gain.exponentialRampToValueAtTime(0.0001, cT + tT * 1);
      o.frequency.setValueAtTime(50, cT + tT * 0);
      o.frequency.exponentialRampToValueAtTime(250, cT + tT * 0.2);
      o.frequency.setValueAtTime(250, cT + tT * 0.2);
      o.frequency.exponentialRampToValueAtTime(120, cT + tT * 0.65);
      o.frequency.setValueAtTime(120, cT + tT * 0.65);
      o.frequency.exponentialRampToValueAtTime(10, cT + tT * 1);
    }
  },
  gameOver: {
    wave: null,
    play: function(cT, tT) {
      let o = aCtx.createOscillator();
      let g = aCtx.createGain();
      g.gain.setValueAtTime(0.0001, aCtx.currentTime);
      if (!this.wave) {
        this.load();
      }
      o.setPeriodicWave(this.wave);
      o.connect(g);
      g.connect(aCtx.destination);
      this.set(o, g, cT, tT);
      o.start(cT);
      o.stop(cT + tT);
      o.onend = function() {
        console.log("ended");
      }
    },
    load: function() {
      var perArr = getPeriodicCoefficientArrays('sawtooth', 100);
      this.wave = aCtx.createPeriodicWave(perArr.a, perArr.b, {
        disableNormalization: false
      });
      perArr = null;
    },

    set: function(o, g, cT, tT) {
      g.gain.setValueAtTime(0.0001, cT + tT * 0);
      g.gain.linearRampToValueAtTime(0.125, cT + tT * 0.20722891566265061);
      g.gain.setValueAtTime(0.125, cT + tT * 0.20722891566265061);
      g.gain.exponentialRampToValueAtTime(0.125, cT + tT * 0.7);
      g.gain.setValueAtTime(0.125, cT + tT * 0.7);
      g.gain.exponentialRampToValueAtTime(0.0001, cT + tT * 1);
      o.frequency.setValueAtTime(440, cT + tT * 0);
      o.frequency.exponentialRampToValueAtTime(440, cT + tT * 0.2);
      o.frequency.setValueAtTime(440, cT + tT * 0.2);
      o.frequency.exponentialRampToValueAtTime(330, cT + tT * 0.21000000000000002);
      o.frequency.setValueAtTime(330, cT + tT * 0.21000000000000002);
      o.frequency.linearRampToValueAtTime(330, cT + tT * 0.36265060240963853);
      o.frequency.setValueAtTime(330, cT + tT * 0.36265060240963853);
      o.frequency.exponentialRampToValueAtTime(220, cT + tT * 0.37265060240963854);
      o.frequency.setValueAtTime(220, cT + tT * 0.37265060240963854);
      o.frequency.exponentialRampToValueAtTime(220, cT + tT * 1);
    }
  },
  kill: {
    wave: null,
    play: function(cT, tT) {
      let o = aCtx.createOscillator();
      let g = aCtx.createGain();
      g.gain.setValueAtTime(0.0001, aCtx.currentTime);
      if (!this.wave) {
        this.load();
      }
      o.setPeriodicWave(this.wave);
      o.connect(g);
      g.connect(aCtx.destination);
      this.set(o, g, cT, tT);
      o.start(cT);
      o.stop(cT + tT);
      o.onend = function() {
        console.log("ended");
      }
    },
    load: function() {
      var perArr = getPeriodicCoefficientArrays('triangle', 100);
      this.wave = aCtx.createPeriodicWave(perArr.a, perArr.b, {
        disableNormalization: false
      });
      perArr = null;
    },

    set: function(o, g, cT, tT) {
       g.gain.setValueAtTime(0.0001, cT + tT * 0);
  g.gain.linearRampToValueAtTime(0.3, cT + tT * 0.04939759036144578);
  g.gain.setValueAtTime(0.3, cT + tT * 0.04939759036144578);
  g.gain.exponentialRampToValueAtTime(0.25, cT + tT * 0.5);
  g.gain.setValueAtTime(0.25, cT + tT * 0.5);
  g.gain.exponentialRampToValueAtTime(0.0001, cT + tT * 1);

  o.frequency.setValueAtTime(440, cT + tT * 0);
  o.frequency.exponentialRampToValueAtTime(880, cT + tT * 0.2);
  o.frequency.setValueAtTime(880, cT + tT * 0.2);
  o.frequency.exponentialRampToValueAtTime(0.0001, cT + tT * 0.4);
  o.frequency.setValueAtTime(0.0001, cT + tT * 0.4);
  o.frequency.linearRampToValueAtTime(0.0001, cT + tT * 1);
 
    }
  },

}

 

function createDiv(id, classNames, styles, props, attributes) {
  let div = document.createElement("div");
  div.id = id;
  div.className = classNames;
  for (let key in styles) {
    div.style[key] = styles[key];
  }
  for (let key in props) {
    div[key] = props[key];
  }
  for (let key in attributes) {
    div.setAttribute(key, attributes[key]);
  }
  return div;
}