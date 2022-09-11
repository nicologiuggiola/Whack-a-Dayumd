let canvas = document.querySelector('canvas')
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;
let c = canvas.getContext('2d')
let animate;

// base map & ui variables
const maxTileW = 70
const maxTileH = 70
let useHammer = true;
let useShovel = false;
let usePowerUp = false;

// classes. Grieving Visitors and Zombies share the NPC class.
// this.img = new Image ()
// this.allImg contains all altered status for maptiles and animation frames for npcs.
// this.memo and remember() function save and check past collisions. Needed for the npc decision making
// when reaching new crossroads.
class Tile {
    constructor(w, h, pos, types, img, url, allImgs, deg) {
        this.w = w;
        this.h = h;
        this.types = types
        this.hp = 2
        this.pos = pos
        this.img = img
        this.imgUrl = url
        this.allImgs = allImgs
        this.deg = deg
    }

    draw() {
        if (this.deg > 0) {
            c.translate(this.pos.x + this.w/ 2, this.pos.y + this.h / 2);
            c.rotate(this.deg * Math.PI / 180);
            c.drawImage(this.img, 0, 0, 70, 70,-this.w / 2, -this.h / 2, maxTileW, maxTileH)
            c.rotate(-this.deg * Math.PI / 180);
            c.translate(-this.pos.x - this.w/ 2, -this.pos.y - this.h / 2);
        } else {
            c.drawImage(this.img, 0, 0, 70, 70, this.pos.x, this.pos.y, maxTileW, maxTileH)
        }
        if (this.allImgs.length === 0) {
            this.img.src = this.imgUrl
        } else {
            switch (this.hp) {
                case 0:
                    this.img.src = this.allImgs[2]
                    break;
                case 1:
                    this.img.src = this.allImgs[1]
                    break;
                case 2:
                    this.img.src = this.allImgs[0]
                    break;
                case 3:
                    this.img.src = this.allImgs[3]
                    break;
                default:
                    break;
            }
        }
    }
}

class NPC {
    constructor(pos, vel, w, h, dir, img, allimgs) {
        this.pos = pos;
        this.vel = vel;
        this.w = w;
        this.h = h;
        this.coll = []
        this.memo = []
        this.dirMap = ["b", "t", "r", "l"]
        this.dir = dir
        this.img = img;
        this.allImgs = allimgs;
        this.atkCD = 0;
    }
    draw(f) {
        if (this.dir === "l") {
            c.translate(this.pos.x + this.w, this.pos.y);
            c.scale(-1, 1);
            c.drawImage(this.img, 0, 0);
            c.setTransform(1, 0, 0, 1, 0, 0);
        } else {
            c.drawImage(this.img, 0, 0, 70, 70, this.pos.x, this.pos.y, maxTileW, maxTileH)
        }
        this.img.src = f === 0 ? this.allImgs[0] : f === 10 ? this.allImgs[1] : f === 20 ? this.allImgs[2] : f === 30 ? this.allImgs[3] : this.img.src;
    }
    update(f) {
        this.draw(f);
        if (this.remember()) {
            let tArray = [];
            this.dirMap.forEach(d => {
                let checked = false;
                this.coll.forEach(c => {
                    if (d === c) {
                        checked = true;
                    }
                })
                if (!checked) {
                    tArray.push(d)
                }
            })
            if (tArray.length === 3 || tArray.length === 2) {
                let origin = this.dir === "t" ? "b" : this.dir === "b" ? "t" : this.dir === "l" ? "r" : this.dir === "r" ? "l" : null;
                tArray = tArray.filter(c => c !== origin)
            }
            if (tArray.length < 4) {
                this.dir = tArray[Math.floor(Math.random() * tArray.length)]
            }
        }
        this.vel = this.dir === "t" ? { x: 0, y: -0.5 } : this.dir === "b" ? { x: 0, y: 0.5 } : this.dir === "l" ? { x: -0.5, y: 0 } : this.dir === "r" ? { x: 0.5, y: 0 } : null;
        this.pos.x += this.vel.x;
        this.pos.y += this.vel.y;
        this.memo = this.coll
        this.coll = []
        if (this.atkCD > 0) {
            this.atkCD--;
        }
    }
    remember() {
        let check = false;
        if (this.memo.length !== this.coll.length) {
            return true
        } else {
            for (let i = 0; i < this.coll.length; i++) {
                for (let j = 0; j < this.memo.length; j++) {
                    if (this.coll[i] === this.memo[j]) {
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

// level matrix and tile building
let matrixI = 0;
let levelMatrix;
let allLevel = [];
const lv0M = [
    ['x', 'x', 'x', 'x', 'x', 'x', 'x', 'x', 'x', 'x', 'x', 'x', 'x'],
    ['x', 'o', 'x', 'x', 'o', 'x', 'o', 'x', 'o', 'x', 'o', 'x', 'x'],
    ['x', 'b', '-', 'u', '-', '-', '-', '-', '-', '-', '-', 'ne', 'x'],
    ['x', 'x', 'x', 'v', 'x', 'x', 'x', 'x', 'x', 'x', 'x', 'v', 'x'],
    ['x', 'o', 'x', 'v', 'x', 'o', 'x', 'o', 'x', 'o', 'x', 'v', 'x'],
    ['x', 'b', '-', 'c', '-', '-', '-', '-', '-', '-', '-', 'r', 'x'],
    ['x', 'x', 'x', 'v', 'x', 'x', 'x', 'x', 'x', 'x', 'x', 'v', 'x'],
    ['x', 'x', 'x', 'v', 'x', 'o', 'x', 'o', 'x', 'o', 'x', 'v', 'x'],
    ['s', '-', '-', 'd', '-', '-', '-', '-', '-', '-', '-', 'se', 'x'],
    ['x', 'x', 'x', 'x', 'x', 'x', 'x', 'x', 'x', 'x', 'x', 'x', 'x']
]
const lv1M = [
    ['x', 'x', 'x', 'x', 'x', 'x', 'x', 'x', 'x', 'x', 'x', 'x', 'x'],
    ['x', 'o', 'x', 'x', 'o', 'x', 'o', 'x', 'o', 'x', 'o', 'x', 'x'],
    ['x', 'b', '-', 'u', '-', '-', '-', '-', '-', '-', '-', 'ne', 'x'],
    ['x', 'x', 'x', 'v', 'x', 'x', 'x', 'x', 'x', 'x', 'x', 'v', 'x'],
    ['x', 'o', 'x', 'v', 'x', 'o', 'x', 'o', 'x', 'o', 'x', 'v', 'x'],
    ['x', 'b', '-', 'c', '-', '-', '-', '-', '-', '-', '-', 'r', 'x'],
    ['x', 'x', 'x', 'v', 'x', 'x', 'x', 'x', 'x', 'x', 'x', 'v', 'x'],
    ['x', 'x', 'x', 'v', 'x', 'o', 'x', 'o', 'x', 'o', 'x', 'v', 'x'],
    ['s', '-', '-', 'd', '-', '-', '-', '-', '-', '-', '-', 'se', 'x'],
    ['x', 'x', 'x', 'x', 'x', 'x', 'x', 'x', 'x', 'x', 'x', 'x', 'x']
]
const lv2M = [
    ['x', 'x', 'x', 'x', 'x', 'x', 'x', 'x', 'x', 'x', 'x', 'x', 'x'],
    ['x', 'o', 'x', 'x', 'o', 'x', 'o', 'x', 'o', 'x', 'o', 'x', 'x'],
    ['x', 'b', '-', 'u', '-', '-', '-', '-', '-', '-', '-', 'ne', 'x'],
    ['x', 'x', 'x', 'v', 'x', 'x', 'x', 'x', 'x', 'x', 'x', 'v', 'x'],
    ['x', 'o', 'x', 'v', 'x', 'o', 'x', 'o', 'x', 'o', 'x', 'v', 'x'],
    ['x', 'b', '-', 'd', 'x', 'b', '-', '-', '-', '-', '-', 'r', 'x'],
    ['x', 'x', 'x', 'x', 'x', 'x', 'x', 'x', 'x', 'x', 'x', 'v', 'x'],
    ['x', 'x', 'x', 'x', 'x', 'o', 'x', 'o', 'x', 'o', 'x', 'v', 'x'],
    ['s', '-', '-', '-', '-', '-', '-', '-', '-', '-', '-', 'se', 'x'],
    ['x', 'x', 'x', 'x', 'x', 'x', 'x', 'x', 'x', 'x', 'x', 'x', 'x']
]
const lv3M = [
    ['x', 'x', 'x', 'x', 'x', 'x', 'x', 'x', 'x', 'x', 'x', 'x', 'x'],
    ['x', 'o', 'x', 'x', 'o', 'x', 'o', 'x', 'o', 'x', 'o', 'x', 'x'],
    ['x', 'b', '-', 'u', '-', '-', '-', '-', '-', '-', '-', 'b2', 'x'],
    ['x', 'x', 'x', 'v', 'x', 'x', 'x', 'x', 'x', 'x', 'x', 'x', 'x'],
    ['x', 'o', 'x', 'v', 'x', 'o', 'x', 'o', 'x', 'o', 'x', 'x', 'x'],
    ['x', 'b', '-', 'd', '-', '-', '-', '-', '-', '-', '-', 'ne', 'x'],
    ['x', 'x', 'x', 'x', 'x', 'x', 'x', 'x', 'x', 'x', 'x', 'v', 'x'],
    ['x', 'x', 'x', 'x', 'x', 'o', 'x', 'o', 'x', 'o', 'x', 'v', 'x'],
    ['s', '-', '-', '-', '-', '-', '-', '-', '-', '-', '-', 'se', 'x'],
    ['x', 'x', 'x', 'x', 'x', 'x', 'x', 'x', 'x', 'x', 'x', 'x', 'x']
]

// here the new level is drawn and prepared for animation. the level receives its quest
// all the tombs, the zombies spawn points, the exit gate and the visitors NPC are collected in separate arrays
// these specific arrays will be used to control spawn events, collision and player interactions
allLevel = [lv0M, lv1M, lv2M, lv3M];
let allTiles = [];
let tombSpawn = [];
let allTombs= [];
let zombies= [];
let grievingVisitors = [];
let exit;
let tombsL = allTombs.length;
levelMatrix = allLevel[matrixI];
let allQ = [
    "Use the hammer, click on all the hordes on the map and don't let them reach the exit gate.",
    "Use the shovel to repair the tombs. Keep the zombies in check with your hammer.",
    "Grieving families are here to pay tribute! Defend them...or else!",
    "Fortify the tombs. Stone tombs can resist one additional attack. "
]
function buildLevel() {
    for (let i = 0; i < levelMatrix.length; i++) {
        for (let j = 0; j < levelMatrix[i].length; j++) {
            const mapSwitch = levelMatrix[i][j]
            let deg = 0
            let img = new Image()
            let t;
            if (mapSwitch === "x") {
                t = new Tile(maxTileW, maxTileH, { x: j * maxTileW, y: i * maxTileH }, ["w"], img, "img/grass.png", [], deg);
            }
            if (mapSwitch === "o") {
                t = new Tile(maxTileW, maxTileH, { x: j * maxTileW, y: i * maxTileH }, ["zSpawn", "p"], img, "img/t_1.png", ["img/t_1.png", "img/d_t.png", "img/b_t.png", "img/t_s.png"], 0);
                tombSpawn.push({ x: j * maxTileW, y: i * maxTileH });
                allTombs.push(t)
            }
            if (mapSwitch === "s") {
                t = new Tile(maxTileW, maxTileH, { x: j * maxTileW, y: i * maxTileH }, ["vP", "w"], img, "img/hor.png", [], deg);
                exit = t
            }
            if (mapSwitch === "-" || mapSwitch === "v") {
                deg = mapSwitch === "-" ? 0 : 90
                t = new Tile(maxTileW, maxTileH, { x: j * maxTileW, y: i * maxTileH }, ["p"], img, "img/hor.png", [], deg);
            }
            if (mapSwitch === "c") {
                t = new Tile(maxTileW, maxTileH, { x: j * maxTileW, y: i * maxTileH }, ["p"], img, "img/cross.png", [], deg);
            }
            if (mapSwitch === "u" || mapSwitch === "r" || mapSwitch === "d") {
                deg = mapSwitch === "r" ? 0 : mapSwitch === "u" ? 270 : 90
                t = new Tile(maxTileW, maxTileH, { x: j * maxTileW, y: i * maxTileH }, ["p"], img, "img/lat_pR.png", [], deg);
            }
            if (mapSwitch === "ne" || mapSwitch === "se") {
                deg = mapSwitch === "ne" ? 0 : 90
                t = new Tile(maxTileW, maxTileH, { x: j * maxTileW, y: i * maxTileH }, ["p"], img, "img/cor_ne.png", [], deg);
            }
            if (mapSwitch === "b" || mapSwitch === "b2") {
                deg = mapSwitch === "b" ? 0 :180
                t = new Tile(maxTileW, maxTileH, { x: j * maxTileW, y: i * maxTileH }, ["p"], img, "img/end.png", [], deg);
            }
            allTiles.push(t);
            if (matrixI >= 2) {
                if ((i === 2 && j === 2) || (i === 5 && j === 3) || (i === 2 && j === 8)) {
                    let nIGriev = new Image()
                    let gr = new NPC({ x: j * maxTileW, y: i * maxTileH }, { x: 0, y: 0.5 }, maxTileW, maxTileH, "r", nIGriev, ["img/gr_1.png", "img/gr_2.png", "img/gr_1.png", "img/gr_3.png",]);
                    grievingVisitors.push(gr)
                    gr.draw(0);
                }
            }

        }
    }
}

// npcColl calculate collision between an npc and a tile or another hostile npc
function npcColl(n, t) {
    return n.pos.x + n.w + n.vel.x > t.pos.x &&
        n.pos.x + n.vel.x < t.pos.x + t.w &&
        n.pos.y + n.h + n.vel.y > t.pos.y &&
        n.pos.y + n.vel.y < t.pos.y + t.h
}

// player interactions set up and player tools cooldowns
let shovelCooldown = 0;
let powerUpCooldown = 0;
let levelOneKillcount = 0;
canvas.addEventListener('click', (e) => {
    if (useHammer) {
        zombies.forEach((z, i) => {
            if (z.pos.x + z.w > e.clientX && z.pos.x < e.clientX && z.pos.y + z.h > e.clientY && z.pos.y < e.clientY) {
                zombies.splice(i, 1);
                levelOneKillcount++
                if (matrixI === 0 && levelOneKillcount >= 5) {
                    holinessPoints = 100
                } else {
                    holinessPoints++;
                }
                progressBar.style.height = holinessPoints + "%";
                zzfx(...[1.06,,176,.01,.09,.11,2,2,5.8,,,.01,,1.4,,.3,,.91,.07,.27]);
            }
        })
    } else if (useShovel && shovelCooldown === 0) {
        allTombs.forEach((t) => {
            if (t.pos.x + t.w > e.clientX && t.pos.x < e.clientX && t.pos.y + t.h > e.clientY && t.pos.y < e.clientY) {
                if (t.hp < 2) {
                    holinessPoints += 2;
                    progressBar.style.height = holinessPoints + "%";
                    shovelCooldown = 200;
                    if (t.hp === 0) {
                        t.hp = 1;
                    }
                    else if (t.hp === 1) {
                        t.hp = 2;
                    }
                    zzfx(...[1.73,,455,.03,.01,.09,,.72,13,-0.1,-100,.01,.01,1.3,,,.07,.59,.05,.01]);
                }
            }
        })
    } else if (usePowerUp && powerUpCooldown === 0) {
        allTombs.forEach((t) => {
            if (t.pos.x + t.w > e.clientX && t.pos.x < e.clientX && t.pos.y + t.h > e.clientY && t.pos.y < e.clientY) {
                t.hp = 3;
                holinessPoints += 2;
                progressBar.style.height = holinessPoints + "%";
                powerUpCooldown = 1000;
                zzfx(...[1.77,,1707,.02,.03,.18,,.15,.4,1,,,.14,,,.1,.1,.98,.02,.04]);
            }
        })
    }
});

// ui set up
let hammerButton = document.getElementById('hammer');
let shovelButton = document.getElementById('shovel');
let shovelCDDiv = document.getElementById('shovelCooldown');
let powerUpCDDiv = document.getElementById('powerCD')
let powerUpButton = document.getElementById('powerup');
let tryAgainButton = document.getElementById('try')
let questLog = document.getElementById('quest')
let questText = document.getElementById('q-text');
let mainMenu = document.getElementById('main');
let startButton = document.getElementById('start');
let backButtons = document.getElementsByClassName('back')
let gameOverPanel = document.getElementById('goPanel');
let retryB = document.getElementById("retry")
let winPanel = document.getElementById("win");
let nextLevelButton = document.getElementById("next")
let finalWinPanel = document.getElementById("winPanel");
function aHammer() {
    useHammer = true;
    useShovel = false;
    usePowerUp = false;
    hammerButton.style.color = 'red';
    shovelButton.style.color = 'black';
    powerUpButton.style.color = "black";
}
function aShovel() {
    useHammer = false;
    useShovel = true;
    usePowerUp = false;
    hammerButton.style.color = 'black';
    shovelButton.style.color = 'red';
    powerUpButton.style.color = "black";
}
function aPower() {
    useHammer = false;
    useShovel = false;
    usePowerUp = true;
    hammerButton.style.color = 'black';
    shovelButton.style.color = 'black';
    powerUpButton.style.color = "red";
}
hammerButton.addEventListener('click', () => {
    aHammer();
});
shovelButton.addEventListener('click', () => {
    aShovel();
});
powerUpButton.addEventListener('click', () => {
    aPower();
});
document.addEventListener("keypress", (e) => {
    if (e.key === "a") {
        aHammer();
    }
    if (e.key === "s" && shovelButton.style.display !== "none") {
        aShovel();
    }
    if (e.key === "d" && powerUpButton.style.display !== "none") {
        aPower();
    }
    if (e.key === "v") {
        startLevel();
        if (matrixI === 0) {
            firstlv = true
        }
        gameOverPanel.style.display = "none"
    }
});
// progress bar set up and miscellaneous (zombie spawn timer, first level condition for its unique mechanic and npc frames set up)
let progressBar = document.getElementById('prgbar');
let progressBorder = document.getElementById('pointbar');
let spawnTimer = 0;
let holinessPoints = 2;
let firstlv = true;
let frames = 0;
function lockUI() {
    hammerButton.style.display = "none";
    shovelButton.style.display = "none";
    powerUpButton.style.display = "none"
    progressBorder.style.display = "none";
    questLog.style.display = "none";
    tryAgainButton.style.display = "none"
}

// animation function
function animation() {
    animate = requestAnimationFrame(animation);
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    tombsL = allTombs.length;
    // tool cooldown reset
    if (shovelCooldown > 0) {
        shovelCooldown--
        shovelCDDiv.style.width = (shovelCooldown / 2) + "%"
    }
    if (powerUpCooldown > 0) {
        powerUpCooldown--
        powerUpCDDiv.style.width = (powerUpCooldown / 10) + "%"
    }
    c.clearRect(0, 0, canvas.width, canvas.height)
    // collision mechanics
    // in this section zombies and visitors collision are calculated
    // this is specific for maptile interactions and here the zombies are set up to attack graves
    allTiles.forEach(t => {
        t.draw();
        if (t.types[0] !== "zSpawn" && !t.types.includes("p") && !t.types.includes("vP")) {
            zombies.forEach(z=> {
                if ((npcColl({ ...z, vel: { x: 0, y: 0.1 } }, t)) && t.pos.x === z.pos.x) {
                    z.coll.push("b");
                }
                if ((npcColl({ ...z, vel: { x: 0, y: -0.1 } }, t)) && t.pos.x === z.pos.x) {
                    z.coll.push("t")
                }
                if ((npcColl({ ...z, vel: { x: 0.1, y: 0 } }, t)) && t.pos.y === z.pos.y) {
                    z.coll.push("r")
                }
                if ((npcColl({ ...z, vel: { x: -0.1, y: 0 } }, t)) && t.pos.y === z.pos.y) {
                    z.coll.push("l")
                }
            })
        } else {
            zombies.forEach(z=> {
                if (npcColl({ ...z, vel: { x: 0, y: 0.1 } }, { ...t, h: maxTileH - 20, w: maxTileW - 20 }) ||
                    npcColl({ ...z, vel: { x: 0, y: -0.1 } }, { ...t, h: maxTileH - 20, w: maxTileW - 20 }) ||
                    npcColl({ ...z, vel: { x: 0.1, y: 0 } }, { ...t, h: maxTileH - 20, w: maxTileW - 20 }) ||
                    npcColl({ ...z, vel: { x: -0.1, y: 0 } }, { ...t, h: maxTileH - 20, w: maxTileW - 20 })) {
                    if (z.atkCD === 0 && t.types[0] === "zSpawn") {
                        if (t.hp === 3) {
                            t.hp = 2
                        }
                        else if (t.hp <= 2 && t.hp > 0) {
                            t.hp = 0
                            holinessPoints -= 2;
                            progressBar.style.height = holinessPoints + "%";
                        }
                        z.atkCD = 400;
                        zzfx(...[2.34,,218,.01,.09,.05,4,2.42,,,,,.04,.3,,.3,.18,.86,.01,.17]);
                    }
                }
            })
        }
        if (!t.types.includes("p") && !t.types.includes("vP") || t.types[0] === "zSpawn") {
            grievingVisitors.forEach(gr=> {
                if ((npcColl({ ...gr, vel: { x: 0, y: 0.1 } }, t)) && t.pos.x === gr.pos.x) {
                        gr.coll.push("b");
                }
                if ((npcColl({ ...gr, vel: { x: 0, y: -0.1 } }, t)) && t.pos.x === gr.pos.x) {
                        gr.coll.push("t")
                }
                if ((npcColl({ ...gr, vel: { x: 0.1, y: 0 } }, t)) && t.pos.y === gr.pos.y) {
                        gr.coll.push("r")
                }
                if ((npcColl({ ...gr, vel: { x: -0.1, y: 0 } }, t)) && t.pos.y === gr.pos.y) {
                        gr.coll.push("l")
                }
            })
        }
    })
    if (matrixI !== 0) {
        // during level 1, which is the zombie kill tutorial, the spawn timer is deactivated
        // outside level 1, the spawn mechanic select a random tomb
        // if the tomb has 0 life points, a zombie will spawn on its position
        // if the tomb has not been destroyed before, the spawn won't occur and the tomb will be damaged instead
        spawnTimer++
        if (spawnTimer >= Math.floor(Math.random() * 100) + 50) {
            let tomb = allTombs[Math.floor(Math.random() * allTombs.length)]
            let posN = { x: tomb.pos.x, y: tomb.pos.y }
            if (tomb.hp !== 2) {
                zzfx(...[2.34,,218,.01,.09,.05,4,2.42,,,,,.04,.3,,.3,.18,.86,.01,.17]);
            }
            if (tomb.hp === 3) {
                tomb.hp = 2
            }
            else if (tomb.hp === 2) {
                tomb.hp = 1
            }
            else if (tomb.hp === 1 || tomb.hp === 0) {
                tomb.hp = 0;
                let nIZ = new Image()
                let z= new NPC(posN, { x: 0, y: 0.5 }, maxTileW, maxTileH, "b", nIZ, ["img/z_1.png", "img/z_2.png", "img/z_1.png", "img/z_4.png"])
                z.draw(0)
                zombies.push(z)
                holinessPoints--;
                progressBar.style.height = holinessPoints + "%";
            }
            spawnTimer = 0
            
        }
    } else if (firstlv) {
        // during level 1, 5 zombies will be prespawned from the start
        for (let i = 0; i < 5; i++) {
            let tomb = allTombs[Math.floor(Math.random() * allTombs.length)]
            let posN = { x: tomb.pos.x, y: tomb.pos.y }
            let nIZ = new Image()
            let z= new NPC(posN, { x: 0, y: 0.5 }, maxTileW, maxTileH, "b", nIZ, ["img/z_1.png", "img/z_2.png", "img/z_1.png", "img/z_4.png"])
            z.draw(0)
            zombies.push(z)
        }
        firstlv = false;
    }
    // here the progress bar is checked.
    // if it reaches 0% progress, the game over panel will appear
    // if the player reaches 100% progress at the end of a level, that is not the final level, 
    //a card will appear asking if the player wants to play the next level or return in the main menu
    // at the end of the final level, with a 100% progress, the victory panel will display
    if (holinessPoints <= 0) {
        gameOverPanel.style.display = "block"
        cancelAnimationFrame(animate);
        lockUI();
    }
    if (holinessPoints >= 100) {
        if (matrixI !== 3) {
            winPanel.style.display = "block";
            cancelAnimationFrame(animate);
        } else {
            finalWinPanel.style.display = "block";
            lockUI();
            cancelAnimationFrame(animate);
        }
    } else if (matrixI === 0 && holinessPoints >= 100) {
        winPanel.style.display = "block";
        cancelAnimationFrame(animate);
    }
    // in this section, the player receive and lose points.
    // a zombie that reaches the exit gate will cause game over on level 1 and will reduce the progress by 2 during other levels
    // the visitors will take 50 points from the player if killed by a zombie
    // the player get 25 progress points for each visitor escaped from the exit gate
    frames++
    zombies.forEach((z, i) => {
        z.update(frames);
        if (npcColl({ ...z, vel: { x: -0.1, y: 0 } }, { ...exit, w: 0 })) {
            zombies.splice(i, 1);
            if (matrixI === 0) {
                holinessPoints = 0;
            } else {
                holinessPoints -= 2;
            }
            progressBar.style.height = holinessPoints + "%";
        }
    })
    grievingVisitors.forEach((gr, i) => {
        gr.update(frames);
        zombies.forEach(z=> {
            if ((npcColl({ ...z, vel: { x: 0, y: 0.1 } }, { ...gr, pos: { x: gr.pos.x + 40, y: gr.pos.y + 40 } }) && z.dir === "b") ||
                (npcColl({ ...z, vel: { x: 0, y: -0.1 } }, { ...gr, h: maxTileH - 40, w: maxTileW - 40 }) && z.dir === "t") ||
                (npcColl({ ...z, vel: { x: 0.1, y: 0 } }, { ...gr, pos: { x: gr.pos.x + 40, y: gr.pos.y + 40 } }) && z.dir === "r") ||
                (npcColl({ ...z, vel: { x: -0.1, y: 0 } }, { ...gr, h: maxTileH - 40, w: maxTileW - 40 }) && z.dir === "l")) {
                grievingVisitors.splice(i, 1);
                holinessPoints -= 50;
                progressBar.style.height = holinessPoints + "%";
                if (holinessPoints > 0) {
                    zzfx(...[1.06,,176,.01,.1,.12,3,1.9,5.8,,-50,,,1.4,1,.2,,.91,.08,.27]);
                }
            }
        })
        if (npcColl({ ...gr, vel: { x: -0.1, y: 0 } }, { ...exit, w: 0 })) {
            grievingVisitors.splice(i, 1);
            holinessPoints += 25;
            progressBar.style.height = holinessPoints + "%";
        }
    })
    if (frames === 30) {
        frames = 0;
    }
}

// main menu, game over panel, victory panel and level win card interactions
function resetParams() {
    levelMatrix = allLevel[matrixI];
    zombies= [];
    grievingVisitors = [];
    allTiles = []
    tombSpawn = []
    allTombs= []
    levelOneKillcount = 0;
    holinessPoints = 50;
    progressBar.style.height = holinessPoints + "%";
    c.clearRect(0, 0, canvas.width, canvas.height);
    powerUpCooldown = 0;
    powerUpCDDiv.style.width = "0%"
    shovelCooldown = 0;
    shovelCDDiv.style.width = "0%"
}
function addQuest() {
    for (let i = 0; i < allQ.length; i++) {
        if (i === matrixI) {
            questText.innerHTML = allQ[i];
        }
    }
}
function unlockLevelUI() {
    hammerButton.style.display = "block";
    if (matrixI >= 1) {
        shovelButton.style.display = "block";
    }
    progressBorder.style.display = "block";
    if (matrixI === 3) {
        powerUpButton.style.display = "block"
    }
    questLog.style.display = "block"
    tryAgainButton.style.display = "block"
}
function startLevel() {
    resetParams();
    unlockLevelUI();
    buildLevel();
    animation();
    addQuest();
}
startButton.addEventListener('click', () => {
    matrixI = 0;
    startLevel();
    mainMenu.style.display = "none"
});
for (let i = 0; i < backButtons.length; i++) {
    backButtons[i].addEventListener('click', () => {
        matrixI = 0;
        winPanel.style.display = "none"
        mainMenu.style.display = "block"
        finalWinPanel.style.display = "none"
        lockUI();
        firstlv = true
        gameOverPanel.style.display = "none"
    })
}
retryB.addEventListener('click', () => {
    if (matrixI === 0) {
        firstlv = true
    }
    startLevel();
    gameOverPanel.style.display = "none"
});
tryAgainButton.addEventListener('click', () => {
    if (matrixI === 0) {
        firstlv = true
    }
    gameOverPanel.style.display = "none"
    startLevel();
})
nextLevelButton.addEventListener('click', () => {
    matrixI++
    startLevel();
    winPanel.style.display = "none";
});