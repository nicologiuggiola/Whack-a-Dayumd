let canvas = document.querySelector('canvas')
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

let c = canvas.getContext('2d')
let animate;
const maxTileW = 70
const maxTileH = 70

let useHammer = true;
let useShovel = false;
let usePowerup = false;
let isGameOver = false;

class Maptile {

    constructor(w, h, pos, color, types, img) {
        this.w = w;
        this.h = h;
        this.types = types
        this.hp = 2
        this.pos = pos
        this.color = color
        this.baseCol = color
        this.image = img
        this.setImg = []
    }

    draw() {
        //c.fillStyle = this.color
        //c.fillRect(this.pos.x, this.pos.y, this.w, this.h)
        // let x = this.pos.x;
        // let y = this.pos.y;
        // let img1 = new Image();

        // img1.onload = () => {
        //     console.log("ONLOAD");
        //     c.drawImage(img1, this.pos.x, this.pos.y, this.w, this.h)
        // }
        // img1.src = this.imageù
        let newImg = new Image()
        newImg.onload = () => {
            c.drawImage(newImg, 0, 0, 70, 70)
        }
        newImg.src = "images/broken_tomb.png"
    }
}

class NPC {

    constructor(pos, vel, w, h, dir, color) {
        this.pos = pos;
        this.vel = vel;
        this.w = w;
        this.h = h;
        this.detectedColl = []
        this.memoColl = []
        this.dirMap = ["bottom", "top", "right", "left"]
        this.dir = dir
        this.color = color;
    }

    draw() {
        c.fillStyle = this.color
        c.fillRect(this.pos.x, this.pos.y, this.w, this.h)
    }

    update() {
        this.draw();
        if (this.remember()) {
            let tempArray = [];
            this.dirMap.forEach(d => {
                let checked = false;
                this.detectedColl.forEach(c => {
                    if (d === c) {
                        checked = true;
                    }
                })
                if (!checked) {
                    tempArray.push(d)
                }
            })
            if (tempArray.length === 3) {
                let origin
                if (this.dir === "top") {
                    origin = "bottom"
                }
                if (this.dir === "bottom") {
                    origin = "top"
                }
                if (this.dir === "left") {
                    origin = "right"
                }
                if (this.dir === "right") {
                    origin = "left"
                }
                tempArray = tempArray.filter(c => c !== origin)
            }
            if (tempArray.length < 4) {
                this.dir = tempArray[Math.floor(Math.random() * tempArray.length)]
            }
        }

        if (this.dir === "bottom") {
            this.vel = { x: 0, y: 0.5 }
        }
        if (this.dir === "top") {
            this.vel = { x: 0, y: -0.5 }
        }
        if (this.dir === "right") {
            this.vel = { x: 0.5, y: 0 }
        }
        if (this.dir === "left") {
            this.vel = { x: -0.5, y: 0 }
        }

        this.pos.x += this.vel.x;
        this.pos.y += this.vel.y;
        this.memoColl = this.detectedColl
        this.detectedColl = []
    }

    remember() {
        let check = false;
        if (this.memoColl.length !== this.detectedColl.length) {
            check = true;
            return check
        } else {
            for (let i = 0; i < this.detectedColl.length; i++) {
                const elementI = this.detectedColl[i];
                for (let j = 0; j < this.memoColl.length; j++) {
                    const elementJ = this.memoColl[j];
                    if (elementI === elementJ) {
                        check = true;
                    }
                }
                if (!check) {
                    break;
                }
            }
            return check;
        }
    }
}

let matrixI = 0;
let levelMatrix;
let allLevel = []
const levelZeroMatrix = [
    ['x', 'x', 'x', 'x', 'x', 'x', 'x', 'x', 'x', 'x', 'x', 'x', 'x'],
    ['x', 'o', 'x', 'x', 'o', 'x', 'o', 'x', 'o', 'x', 'o', 'x', 'x'],
    ['x', 'so', '-', 'u', '-', '-', '-', '-', '-', '-', '-', 'ne', 'x'],
    ['x', 'x', 'x', 'v', 'x', 'x', 'x', 'x', 'x', 'x', 'x', 'v', 'x'],
    ['x', 'o', 'x', 'v', 'x', 'o', 'x', 'o', 'x', 'o', 'x', 'v', 'x'],
    ['x', 'so', '-', 'c', '-', '-', '-', '-', '-', '-', '-', 'r', 'x'],
    ['x', 'x', 'x', 'v', 'x', 'x', 'x', 'x', 'x', 'x', 'x', 'v', 'x'],
    ['x', 'x', 'x', 'v', 'x', 'o', 'x', 'o', 'x', 'o', 'x', 'v', 'x'],
    ['s', '-', '-', 'd', '-', '-', '-', '-', '-', '-', '-', 'se', 'x'],
    ['x', 'x', 'x', 'x', 'x', 'x', 'x', 'x', 'x', 'x', 'x', 'x', 'x']
]

const levelOneMatrix = [
    ['x', 'x', 'x', 'x', 'x', 'x', 'x', 'x', 'x', 'x', 'x', 'x', 'x'],
    ['x', 'o', 'x', 'x', 'o', 'x', 'o', 'x', 'o', 'x', 'o', 'x', 'x'],
    ['x', 'so', '-', 'u', '-', '-', '-', '-', '-', '-', '-', 'ne', 'x'],
    ['x', 'x', 'x', 'v', 'x', 'x', 'x', 'x', 'x', 'x', 'x', 'v', 'x'],
    ['x', 'o', 'x', 'v', 'x', 'o', 'x', 'o', 'x', 'o', 'x', 'v', 'x'],
    ['x', 'so', '-', 'c', '-', '-', '-', '-', '-', '-', '-', 'r', 'x'],
    ['x', 'x', 'x', 'v', 'x', 'x', 'x', 'x', 'x', 'x', 'x', 'v', 'x'],
    ['x', 'x', 'x', 'v', 'x', 'o', 'x', 'o', 'x', 'o', 'x', 'v', 'x'],
    ['s', '-', '-', 'd', '-', '-', '-', '-', '-', '-', '-', 'se', 'x'],
    ['x', 'x', 'x', 'x', 'x', 'x', 'x', 'x', 'x', 'x', 'x', 'x', 'x']
]

const levelTwoMatrix = [
    ['x', 'x', 'x', 'x', 'x', 'x', 'x', 'x', 'x', 'x', 'x', 'x', 'x'],
    ['x', 'o', 'x', 'x', 'o', 'x', 'o', 'x', 'o', 'x', 'o', 'x', 'x'],
    ['x', 'so', '-', 'u', '-', '-', '-', '-', '-', '-', '-', 'ne', 'x'],
    ['x', 'x', 'x', 'v', 'x', 'x', 'x', 'x', 'x', 'x', 'x', 'v', 'x'],
    ['x', 'o', 'x', 'v', 'x', 'o', 'x', 'o', 'x', 'o', 'x', 'v', 'x'],
    ['x', 'so', '-', 'd', 'x', 'so', '-', '-', '-', '-', '-', 'r', 'x'],
    ['x', 'x', 'x', 'x', 'x', 'x', 'x', 'x', 'x', 'x', 'x', 'v', 'x'],
    ['x', 'x', 'x', 'x', 'x', 'o', 'x', 'o', 'x', 'o', 'x', 'v', 'x'],
    ['s', '-', '-', '-', '-', '-', '-', '-', '-', '-', '-', 'se', 'x'],
    ['x', 'x', 'x', 'x', 'x', 'x', 'x', 'x', 'x', 'x', 'x', 'x', 'x']
]

const levelThreeMatrix = [
    ['x', 'x', 'x', 'x', 'x', 'x', 'x', 'x', 'x', 'x', 'x', 'x', 'x'],
    ['x', 'o', 'x', 'x', 'o', 'x', 'o', 'x', 'o', 'x', 'o', 'x', 'x'],
    ['x', 'so', '-', 'u', '-', '-', '-', '-', '-', '-', '-', 'ne', 'x'],
    ['x', 'x', 'x', 'v', 'x', 'x', 'x', 'x', 'x', 'x', 'x', 'x', 'x'],
    ['x', 'o', 'x', 'v', 'x', 'o', 'x', 'o', 'x', 'o', 'x', 'x', 'x'],
    ['x', 'so', '-', 'd', '-', 'so', '-', '-', '-', '-', '-', 'r', 'x'],
    ['x', 'x', 'x', 'x', 'x', 'x', 'x', 'x', 'x', 'x', 'x', 'v', 'x'],
    ['x', 'x', 'x', 'x', 'x', 'o', 'x', 'o', 'x', 'o', 'x', 'v', 'x'],
    ['s', '-', '-', '-', '-', '-', '-', '-', '-', '-', '-', 'se', 'x'],
    ['x', 'x', 'x', 'x', 'x', 'x', 'x', 'x', 'x', 'x', 'x', 'x', 'x']
]
allLevel = [levelZeroMatrix, levelOneMatrix, levelTwoMatrix, levelThreeMatrix];
let allTiles = [];
let tombspawnPos = [];
let allTombs = [];
let zombies = [];
let grievingOnes = [];
let tombsL = allTombs.length;
levelMatrix = allLevel[matrixI];

function buildLevel() {
    for (let i = 0; i < levelMatrix.length; i++) {
        for (let j = 0; j < levelMatrix[i].length; j++) {
            switch (levelMatrix[i][j]) {
                case "x":
                    let newTileG = new Maptile(maxTileW, maxTileH, { x: j * maxTileW, y: i * maxTileH }, 'green', ["wall"], "images/grass1.png");
                    newTileG.draw()
                    allTiles.push(newTileG);
                    break;
                case "o":
                    let newTileT = new Maptile(maxTileW, maxTileH, { x: j * maxTileW, y: i * maxTileH }, 'red', ["zSpawn", "path"], "images/tomb_1.png");
                    allTiles.push(newTileT);
                    tombspawnPos.push({ x: j * maxTileW, y: i * maxTileH });
                    allTombs.push(newTileT)
                    newTileT.draw()
                    break;
                case "s":
                    let newTileS = new Maptile(maxTileW, maxTileH, { x: j * maxTileW, y: i * maxTileH }, 'Orange', ["vPath", "wall"], "images/exit_tile.png");
                    allTiles.push(newTileS);
                    newTileS.draw()
                    break;
                case "-":
                    let newTileH = new Maptile(maxTileW, maxTileH, { x: j * maxTileW, y: i * maxTileH }, 'Orange', ["path"], "images/hor_path1_1.png");
                    allTiles.push(newTileH);
                    break;
                case "c":
                    let newTileC = new Maptile(maxTileW, maxTileH, { x: j * maxTileW, y: i * maxTileH }, 'Orange', ["path"], "images/cross_path1_1.png");
                    allTiles.push(newTileC);
                    break;
                case "v":
                    let newTileV = new Maptile(maxTileW, maxTileH, { x: j * maxTileW, y: i * maxTileH }, 'Orange', ["path"], "images/vert_path1_1.png");
                    allTiles.push(newTileV);
                    break;
                case "u":
                    let newTileU = new Maptile(maxTileW, maxTileH, { x: j * maxTileW, y: i * maxTileH }, 'Orange', ["path"], "images/lat_path1_1.png");
                    allTiles.push(newTileU);
                    break;
                case "r":
                    let newTileR = new Maptile(maxTileW, maxTileH, { x: j * maxTileW, y: i * maxTileH }, 'Orange', ["path"], "images/lat_path1_1r.png");
                    allTiles.push(newTileR);
                    break;
                case "d":
                    let newTileD = new Maptile(maxTileW, maxTileH, { x: j * maxTileW, y: i * maxTileH }, 'Orange', ["path"], "images/lat_path1_1d.png");
                    allTiles.push(newTileD);
                    break;
                case "l":
                    let newTileL = new Maptile(maxTileW, maxTileH, { x: j * maxTileW, y: i * maxTileH }, 'Orange', ["path"], "images/lat_path1_1l.png");
                    allTiles.push(newTileL);
                    break;
                case "no":
                    let newTileNO = new Maptile(maxTileW, maxTileH, { x: j * maxTileW, y: i * maxTileH }, 'Orange', ["path"], "images/cor_path1_1_no.png");
                    allTiles.push(newTileNO);
                    break;
                case "ne":
                    let newTileNe = new Maptile(maxTileW, maxTileH, { x: j * maxTileW, y: i * maxTileH }, 'Orange', ["path"], "images/cor_path1_1_ne.png");
                    allTiles.push(newTileNe);
                    break;
                case "se":
                    let newTileSe = new Maptile(maxTileW, maxTileH, { x: j * maxTileW, y: i * maxTileH }, 'Orange', ["path"], "images/cor_path1_1_se.png");
                    allTiles.push(newTileSe);
                    break;
                case "so":
                    let newTileSo = new Maptile(maxTileW, maxTileH, { x: j * maxTileW, y: i * maxTileH }, 'Orange', ["path"], "images/cor_path1_1_so.png");
                    allTiles.push(newTileSo);
                    break;
                default:
                    break;
            }
            if (matrixI >= 2) {
                if ((i === 2 && j === 8) || (i === 5 && j === 3) || (i === 5 && j === 8)) {
                    let grieving = new NPC({ x: j * maxTileW, y: i * maxTileH }, { x: 0, y: 0.5 }, maxTileW, maxTileH, "right", "pink");
                    grievingOnes.push(grieving)
                    grieving.draw();
                }
            }

        }
    }
}

function checkNPCCollision(npc, wall) {
    return npc.pos.x + npc.w + npc.vel.x > wall.pos.x &&
        npc.pos.x + npc.vel.x < wall.pos.x + wall.w &&
        npc.pos.y + npc.h + npc.vel.y > wall.pos.y &&
        npc.pos.y + npc.vel.y < wall.pos.y + wall.h
}

let shovelCD = 0;
let powerupCD = 0;
let killcount = 0;

canvas.addEventListener('click', function (event) {
    if (useHammer) {
        zombies.forEach((z, i) => {
            if (z.pos.x + z.w > event.clientX && z.pos.x < event.clientX && z.pos.y + z.h > event.clientY && z.pos.y < event.clientY) {
                zombies.splice(i, 1);
                killcount++
                if (matrixI === 0 && killcount >= 5) {
                    prgPerc = 100
                } else {
                    prgPerc++;
                }
                progress.style.height = prgPerc + "%";
            }
        })
    } else if (useShovel && shovelCD === 0) {
        allTombs.forEach((t, i) => {
            if (t.pos.x + t.w > event.clientX && t.pos.x < event.clientX && t.pos.y + t.h > event.clientY && t.pos.y < event.clientY) {
                if (t.color === "black" && t.hp === 0) {
                    t.color = "purple"
                    t.hp = 1;
                }
                else if (t.color === "purple" && t.hp === 1) {
                    t.color = "red"
                    t.hp = 2;
                }
                prgPerc += 2;
                progress.style.height = prgPerc + "%";
                shovelCD = 200;
            }
        })
    } else if(usePowerup && powerupCD === 0){
        allTombs.forEach((t, i) => {
            if (t.pos.x + t.w > event.clientX && t.pos.x < event.clientX && t.pos.y + t.h > event.clientY && t.pos.y < event.clientY) {
                t.color = "gold"
                t.hp = 3;
                prgPerc += 2;
                progress.style.height = prgPerc + "%";
                powerupCD = 400;
            }
        })
    }
});

let hammerB = document.getElementById('hammer');
let shovelB = document.getElementById('shovel');
let powerupB = document.getElementById('powerup');
let mainM = document.getElementById('mainmenu');
let startB = document.getElementById('start');
let gOB = document.getElementById('gameover');
let gOP = document.getElementById('gameoverPanel');
let retryB = document.getElementById("retry")
let winP = document.getElementById("win");
let nextB = document.getElementById("next")
let finalWinP = document.getElementById("victoryPanel")

hammerB.addEventListener('click', function (event) {
    useHammer = true;
    useShovel = false;
    usePowerup = false;
    hammerB.style.color = 'red';
    shovelB.style.color = 'black';
    powerupB.style.color = "black";
});
shovelB.addEventListener('click', function (event) {
    useHammer = false;
    useShovel = true;
    usePowerup = false;
    hammerB.style.color = 'black';
    shovelB.style.color = 'red';
    powerupB.style.color = "black";
});

powerupB.addEventListener('click', function (event) {
    useHammer = false;
    useShovel = false;
    usePowerup = true;
    hammerB.style.color = 'black';
    shovelB.style.color = 'black';
    powerupB.style.color = "red";
});

let progress = document.getElementById('prgbar');
let pBar = document.getElementById('pointbar');

let spn = 0;
let prgPerc = 2;
let firstLevel = true;


function animation() {

    animate = requestAnimationFrame(animation);
    tombsL = allTombs.length;
    if (shovelCD > 0) {
        shovelCD--
    }
    if (powerupCD > 0) {
        powerupCD--
    }
    c.clearRect(0, 0, canvas.width, canvas.height)
    allTiles.forEach(tile => {
        tile.draw();
        if (tile.types[0] !== "zSpawn" && !tile.types.includes("path")) {
            zombies.forEach(zombie => {
                if (checkNPCCollision({ ...zombie, vel: { x: 0, y: 0.1 } }, tile)) {
                    if (tile.pos.x === zombie.pos.x) {
                        zombie.detectedColl.push("bottom");
                    }
                }
                if (checkNPCCollision({ ...zombie, vel: { x: 0, y: -0.1 } }, tile)) {
                    if (tile.pos.x === zombie.pos.x) {
                        zombie.detectedColl.push("top")
                    }
                }
                if (checkNPCCollision({ ...zombie, vel: { x: 0.1, y: 0 } }, tile)) {
                    if (tile.pos.y === zombie.pos.y) {
                        zombie.detectedColl.push("right")
                    }
                }
                if (checkNPCCollision({ ...zombie, vel: { x: -0.1, y: 0 } }, tile)) {
                    if (tile.pos.y === zombie.pos.y) {
                        zombie.detectedColl.push("left")
                    }
                }
            })
            grievingOnes.forEach(zombie => {
                if (checkNPCCollision({ ...zombie, vel: { x: 0, y: 0.1 } }, tile)) {
                    if (tile.pos.x === zombie.pos.x) {
                        zombie.detectedColl.push("bottom");
                    }
                }
                if (checkNPCCollision({ ...zombie, vel: { x: 0, y: -0.1 } }, tile)) {
                    if (tile.pos.x === zombie.pos.x) {
                        zombie.detectedColl.push("top")
                    }
                }
                if (checkNPCCollision({ ...zombie, vel: { x: 0.1, y: 0 } }, tile)) {
                    if (tile.pos.y === zombie.pos.y) {
                        zombie.detectedColl.push("right")
                    }
                }
                if (checkNPCCollision({ ...zombie, vel: { x: -0.1, y: 0 } }, tile)) {
                    if (tile.pos.y === zombie.pos.y) {
                        zombie.detectedColl.push("left")
                    }
                }
            })
        } else {
            zombies.forEach(zombie => {
                if (checkNPCCollision({ ...zombie, vel: { x: 0, y: 0.1 } }, { ...tile, h: maxTileH - 20, w: maxTileW - 20 })||
                checkNPCCollision({ ...zombie, vel: { x: 0, y: -0.1 } }, { ...tile, h: maxTileH - 20, w: maxTileW - 20 }) ||
                checkNPCCollision({ ...zombie, vel: { x: 0.1, y: 0 } }, { ...tile, h: maxTileH - 20, w: maxTileW - 20 }) ||
                checkNPCCollision({ ...zombie, vel: { x: -0.1, y: 0 } }, { ...tile, h: maxTileH - 20, w: maxTileW - 20 })) {
                    if (tile.color === "gold" && tile.hp === 3) {
                        tile.color = "red"
                        tile.hp = 2
                        prgPerc--;
                        progress.style.height = prgPerc + "%";
                    }
                    if (tile.color === "red" && tile.hp === 2) {
                        tile.color = "purple"
                        tile.hp = 1
                        prgPerc--;
                        progress.style.height = prgPerc + "%";
                    }
                    else if (tile.color === "purple" && tile.hp === 1) {
                        tile.color = "black"
                        tile.hp = 0
                        prgPerc--;
                        progress.style.height = prgPerc + "%";
                    }
                }
            })
        }
    })


    if (matrixI !== 0) {
        spn++
        if (spn === 100) {
            let tomb = allTombs[Math.floor(Math.random() * allTombs.length)]
            let posN = { x: tomb.pos.x, y: tomb.pos.y }
            if (tomb.color === "gold" && tomb.hp === 3) {
                tomb.color = "red"
                tomb.hp = 2

            }
            else if (tomb.color === 'red' && tomb.hp === 2) {
                tomb.color = 'purple';
                tomb.hp = 1
            }
            else if ((tomb.color === 'purple' && tomb.hp === 1) || (tomb.color === 'black' && tomb.hp === 0)) {
                tomb.color = "black";
                tomb.hp = 0;
                let zombie = new NPC(posN, { x: 0, y: 0.5 }, maxTileW, maxTileH, "bottom", "yellow")
                zombie.draw()
                zombies.push(zombie)
                prgPerc--;
                progress.style.height = prgPerc + "%";
            }
            spn = 0
        }
    } else if (firstLevel) {
        for (let i = 0; i < 5; i++) {
            let tomb = allTombs[Math.floor(Math.random() * allTombs.length)]
            let posN = { x: tomb.pos.x, y: tomb.pos.y }
            let zombie = new NPC(posN, { x: 0, y: 0.5 }, maxTileW, maxTileH, "bottom")
            zombie.draw()
            zombies.push(zombie)
        }
        firstLevel = false;
    }

    if (prgPerc <= 0) {
        gOP.style.display = "block"
        cancelAnimationFrame(animate);
        hammerB.style.display = "none";
        shovelB.style.display = "none";
        powerupB.style.display = "none"
        pBar.style.display = "none";
    }
    if (prgPerc >= 100) {
        if (matrixI !== 4) {
            winP.style.display = "block";
            cancelAnimationFrame(animate);
        } else {
            finalWinP.style.display = "block";
            cancelAnimationFrame(animate);
        }
    } else if (matrixI === 0 && prgPerc >= 100) {
        winP.style.display = "block";
        cancelAnimationFrame(animate);
    }

    zombies.forEach(zombie => {
        zombie.update();
    })

    grievingOnes.forEach((grieving, i) => {
        grieving.update();
        zombies.forEach(zombie => {
            if (checkNPCCollision({ ...zombie, vel: { x: 0, y: 0.1 } }, { ...grieving, h: maxTileH - 20, w: maxTileW - 20 }) ||
            checkNPCCollision({ ...zombie, vel: { x: 0, y: -0.1 } }, { ...grieving, h: maxTileH - 20, w: maxTileW - 20 }) ||
            checkNPCCollision({ ...zombie, vel: { x: 0.1, y: 0 } }, { ...grieving, h: maxTileH - 20, w: maxTileW - 20 }) ||
            checkNPCCollision({ ...zombie, vel: { x: -0.1, y: 0 } }, { ...grieving, h: maxTileH - 20, w: maxTileW - 20 })) {
                grievingOnes.splice(i, 1);
                prgPerc -= 50;
                progress.style.height = prgPerc + "%";
            }
        })
    })
}

function resetParams() {
    levelMatrix = allLevel[matrixI];
    zombies = [];
    grievingOnes = [];
    allTiles = []
    tombspawnPos = []
    allTombs = []
    prgPerc = 50;
    progress.style.height = prgPerc + "%";
    c.clearRect(0, 0, canvas.width, canvas.height);
}

function unlockLevelUI() {
    hammerB.style.display = "block";
    shovelB.style.display = "block";
    pBar.style.display = "block";
    if (matrixI === 3) {
        powerupB.style.display = "block"
    }
}

startB.addEventListener('click', function (event) {
    matrixI = 3;
    resetParams();
    mainM.style.display = "none"
    unlockLevelUI();
    buildLevel();
    animation();
});
gOB.addEventListener('click', function (event) {
    matrixI = 0;
    gOP.style.display = "none"
    mainM.style.display = "block"
});
retryB.addEventListener('click', function (event) {
    resetParams();
    if (matrixI === 0) {
        firstLevel = true
    }
    gOP.style.display = "none"
    unlockLevelUI();
    buildLevel();
    animation();
});
nextB.addEventListener('click', function (event) {
    matrixI++
    resetParams();
    winP.style.display = "none";
    buildLevel();
    animation();
});