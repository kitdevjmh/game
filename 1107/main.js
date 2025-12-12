/* =========================================================
   DUNGEON OF DICE - MAIN SCRIPT (All-in-One, cleaned)
   - 인트로 로딩(주사위/용암 게이지)
   - 게이트 전환 & 로비
   - 오버레이 로딩 (로비→게임 진입)
   - 사운드 매니저
   - 게임 코어 (탐험/전투/상점/인벤토리/스테이지 진행)
   ========================================================= */

/* ========================
   [A] 인트로: 로딩 → 준비완료 → 클릭 진입
   =========================*/
// --- DOM 참조 (인트로)
const fill   = document.getElementById('fill');
const statusEl = document.getElementById('status');
const token  = document.getElementById('token');
const die    = token.querySelector('.die');
const shadow = document.getElementById('shadow');
const logo   = document.getElementById('logo');
const diceBar= document.getElementById('diceBar');
const veil   = document.getElementById('veil');
const gate   = document.getElementById('gate');
const intro  = document.getElementById('intro');
const bubbles= document.getElementById('lavaBubbles');

// --- LOBBY DOM 참조
const lobbyEl = document.getElementById('lobby');
const btnStart= document.getElementById('btnStart');
const btnInv  = document.getElementById('btnInventory');
const btnMy   = document.getElementById('btnMyChar');

// ===== Adventure Screen 연결 =====
const $advEl  = document.getElementById('adventure-screen'); // id 정확히 맞춤
const $btnExplore = document.getElementById('btn-explore');
const $btnBag     = document.getElementById('btn-inventory');

// 주사위 눈 표시
function setFace(n){
  die.querySelectorAll('.pip').forEach(el=>{
    el.style.display = el.classList.contains('f'+n) ? 'block' : 'none';
  });
}

// 토큰(주사위) 위치/흔들림 업데이트
function updateTokenPosition(percentage){
  const bw  = diceBar.clientWidth;
  const tw  = token.offsetWidth || 44;
  const minCenter = tw / 2;
  const maxCenter = bw - tw / 2;
  const centerX = minCenter + (maxCenter - minCenter) * (percentage / 100);

  token.style.left = centerX + 'px';
  token.style.transform = `translate(-50%, -50%) rotate(${percentage*3}deg)`;

  const bob = Math.sin(percentage/100 * Math.PI * 2) * 6;
  token.style.transform += ` translateY(${-Math.abs(bob)}px)`;

  const baseShadowW = Math.max(8, Math.round(tw));
  shadow.style.width  = (baseShadowW - Math.abs(bob)*0.9) + 'px';
  shadow.style.height = Math.max(8, Math.round(tw * 0.16)) + 'px';
  shadow.style.opacity = 1 - Math.abs(bob)/18;
}

// 용암 버블 생성
let bubbleTimer = null;
function spawnBubble(){
  const b = document.createElement('span');
  b.className = 'bubble';
  const x = Math.random()*100;
  const s = 6 + Math.random()*10;
  b.style.left = x + '%';
  b.style.width = s + 'px';
  b.style.height = s + 'px';
  const dur = 1000 + Math.random()*1400;
  bubbles.appendChild(b);
  b.animate([
    { transform:'translate(-50%, 6px) scale(.8)', opacity:.0 },
    { transform:'translate(-50%, -26px) scale(1)', opacity:.9, offset:.2 },
    { transform:'translate(-50%, -58px) scale(.9)', opacity:0 }
  ], { duration: dur, easing:'cubic-bezier(.3,.8,.2,1)'} );
  setTimeout(()=> b.remove(), dur+30);
}

/* ========================
   [B] 사운드 매니저
   =========================*/
const AudioMgr = (() => {
  let ctx = null, gain = null, enabled = true;
  function ensure() {
    if (!ctx) {
      ctx = new (window.AudioContext || window.webkitAudioContext)();
      gain = ctx.createGain();
      gain.gain.value = 0.7;
      gain.connect(ctx.destination);
    }
  }
  async function resume() {
    if (ctx && ctx.state === "suspended") await ctx.resume();
  }
  function beep(freq = 880, dur = 0.06) {
    if (!enabled) return;
    ensure();
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.type = "sine";
    o.frequency.value = freq;
    o.connect(g);
    g.connect(gain);
    g.gain.setValueAtTime(0.0001, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.28, ctx.currentTime + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + dur);
    o.start();
    o.stop(ctx.currentTime + dur);
  }
  function fire() {
    if (!enabled) return;
    ensure();
    for (let i = 0; i < 5; i++) beep(300 + Math.random() * 200, 0.08);
  }
  return { beep, fire, resume };
})();

/* ========================
   [C] 인트로 자동 로딩 시뮬레이션
   =========================*/
let load=0, ready=false, rollIndex=1; setFace(1);
const rollTimer = setInterval(()=>{ rollIndex = (rollIndex%6)+1; setFace(rollIndex); }, 120);

const timer = setInterval(()=>{
  load = Math.min(100, load + (load<75? Math.random()*8 : Math.random()*3 + 1));
  fill.style.width = load + '%';
  updateTokenPosition(load);

  if(!bubbleTimer){ bubbleTimer = setInterval(spawnBubble, 180); }

  if(load>35 && load<70) statusEl.textContent='주사위를 굴리는 중…';
  if(load>=70 && load<100) statusEl.textContent='던전 문을 여는 중…';

  if(load>=100){
    clearInterval(timer); clearInterval(rollTimer); clearInterval(bubbleTimer);
    setFace(6); updateTokenPosition(100);
    AudioMgr.fire();
    diceBar.classList.add('hidden');
    requestAnimationFrame(()=>{ logo.classList.add('show'); });
    statusEl.textContent='로딩 완료! 터치 해서 접속하세요!';
    statusEl.classList.add('ready');
    veil.classList.add('on');
    ready = true;
  }
}, 95);

/* ========================
   [D] 인트로 → 게이트 오픈 → 로비 표시
   =========================*/
function openGateAndEnter() {
  veil.classList.remove("on");
  intro.style.visibility = "hidden";
  intro.style.opacity = "0";
  gate.classList.add("open");

  setTimeout(() => {
    intro.style.display = 'none';
    initializeDOMElements();
    // 로비 보이기, 게임 컨테이너 숨김
    if (gameContainerEl) gameContainerEl.style.display = 'none';
    if (lobbyEl) {
      lobbyEl.style.display = 'grid';
      requestAnimationFrame(() => lobbyEl.classList.add('on'));
    }
  }, 720);
}

async function tryEnter(){ 
  if(!ready) return; 
  await AudioMgr.resume(); 
  AudioMgr.beep(1200,.12); 
  openGateAndEnter(); 
}
veil.addEventListener('click', tryEnter);
intro.addEventListener('click', tryEnter);
document.addEventListener('keydown', (e)=>{ if(ready && (e.key==='Enter' || e.key===' ')) tryEnter(); });

/* ========================
   [E] 로비 버튼 SFX (hover/click)
   =========================*/
function playClickSound() { AudioMgr.resume(); AudioMgr.beep(700, 0.08); }
function playHoverSound() { AudioMgr.resume(); AudioMgr.beep(850 + Math.random()*150, 0.05); }

document.querySelectorAll('.img-btn').forEach(btn => {
  btn.addEventListener('click', playClickSound);
  btn.addEventListener('mouseenter', playHoverSound);
});
document.getElementById('btnMyChar')?.addEventListener('click', () => AudioMgr.beep(600, 0.08));
document.getElementById('btnStart')?.addEventListener('click', () => AudioMgr.beep(900, 0.1));
document.getElementById('btnInventory')?.addEventListener('click', () => AudioMgr.beep(750, 0.08));

/* =========================
   [사운드: 탐험 버튼 효과음]
   ========================= */
function addAdventureButtonSFX() {
  const btnExplore = document.getElementById('btn-explore');
  const btnInventory = document.getElementById('btn-inventory');
  const btnAttack = document.getElementById('btn-attack');
  const btnDefense = document.getElementById('btn-defense');

  if (btnExplore) {
    btnExplore.addEventListener('mouseenter', () => AudioMgr.beep(850 + Math.random()*150, 0.05));
    btnExplore.addEventListener('click', () => AudioMgr.beep(700, 0.08));
  }

  if (btnInventory) {
    btnInventory.addEventListener('mouseenter', () => AudioMgr.beep(850 + Math.random()*150, 0.05));
    btnInventory.addEventListener('click', () => AudioMgr.beep(750, 0.08));
  }

  if (btnAttack) {
    btnAttack.addEventListener('mouseenter', () => AudioMgr.beep(850 + Math.random() * 150, 0.05));
    btnAttack.addEventListener('click', () => AudioMgr.beep(700, 0.08));
  }

  if (btnDefense) {
    btnDefense.addEventListener('mouseenter', () => AudioMgr.beep(850 + Math.random() * 150, 0.05));
    btnDefense.addEventListener('click', () => AudioMgr.beep(750, 0.08));
  }
}

// 전투 화면이 표시될 때 한 번만 연결
requestAnimationFrame(() => addBattleDiceButtonSFX());



// 탐험 화면이 표시될 때 한 번만 연결
requestAnimationFrame(() => addAdventureButtonSFX());


/* ========================
   [F] 로비 → 오버레이 로딩 → 게임 시작
   =========================*/
(function(){
  const btnStart   = document.getElementById('btnStart');
  const lobbyEl    = document.getElementById('lobby');
  const gameEl     = document.getElementById('gameContainer');

  // 오버레이 요소
  const overlay      = document.getElementById('lavaLoading');
  const statusEl     = document.getElementById('loadingStatus');
  const diceBar      = document.getElementById('loadingDiceBar');
  const fillEl       = document.getElementById('loadingFill');
  const tokenEl      = document.getElementById('loadingToken');
  const shadowEl     = document.getElementById('loadingShadow');
  const bubblesEl    = document.getElementById('overlayLavaBubbles');
  const dieSvg       = tokenEl ? tokenEl.querySelector('.die') : null;

  function setFaceOverlay(n){
    if(!dieSvg) return;
    dieSvg.querySelectorAll('.pip').forEach(el=>{
      el.style.display = el.classList.contains('f'+n) ? 'block' : 'none';
    });
  }

  function updateTokenPositionOverlay(pct){
    if(!diceBar) return;
    const bw = diceBar.clientWidth;
    const tw = tokenEl.offsetWidth || 64;
    const minCenter = tw/2;
    const maxCenter = bw - tw/2;
    const centerX = minCenter + (maxCenter - minCenter) * (pct/100);
    tokenEl.style.left = centerX + 'px';
    tokenEl.style.transform = `translate(-50%,-50%) rotate(${pct*3}deg)`;

    const bob = Math.sin(pct/100*Math.PI*2) * 6;
    tokenEl.style.transform += ` translateY(${-Math.abs(bob)}px)`;
    shadowEl.style.width  = Math.max(10, Math.round(tw - Math.abs(bob)*0.9)) + 'px';
    shadowEl.style.height = Math.max(8, Math.round(tw * 0.16)) + 'px';
    shadowEl.style.opacity = 1 - Math.abs(bob)/18;
  }

  let bubbleTimer = null;
  function spawnBubbleOverlay(){
    const s = 6 + Math.random()*10;
    const b = document.createElement('span');
    b.className='bubble';
    b.style.left = (Math.random()*100) + '%';
    b.style.width = s + 'px';
    b.style.height = s + 'px';
    const dur = 1000 + Math.random()*1400;
    bubblesEl.appendChild(b);
    b.animate([
      { transform:'translate(-50%, 6px) scale(.8)',  opacity:.0 },
      { transform:'translate(-50%,-26px) scale(1)',  opacity:.9, offset:.2 },
      { transform:'translate(-50%,-58px) scale(.9)', opacity:0 }
    ], { duration: dur, easing:'cubic-bezier(.3,.8,.2,1)' });
    setTimeout(()=> b.remove(), dur+50);
  }

  function startLavaLoadingOverlay(totalMs=2400){
    lobbyEl && (lobbyEl.style.display='none');
    overlay.style.display = 'flex';

    let load = 0, face = 1;
    setFaceOverlay(face);
    const rollTimer  = setInterval(()=>{ face = (face%6)+1; setFaceOverlay(face); }, 120);
    if(!bubbleTimer) bubbleTimer = setInterval(spawnBubbleOverlay, 180);

    const start = performance.now();
    function tick(now){
      const t = Math.min(1, (now-start)/totalMs);
      load = Math.round(t*100);
      fillEl.style.width = load + '%';
      updateTokenPositionOverlay(load);
      if(load>35 && load<70) statusEl.textContent='주사위를 굴리는 중…';
      else if(load>=70 && load<100) statusEl.textContent='던전 문을 여는 중…';
      if(load < 100){ requestAnimationFrame(tick); return; }

      clearInterval(rollTimer);
      clearInterval(bubbleTimer); bubbleTimer=null;
      setFaceOverlay(6); updateTokenPositionOverlay(100);
      overlay.style.display = 'none';
      if(gameEl) gameEl.style.display = 'block';
    }
    requestAnimationFrame(tick);
  }

  if(btnStart){
    btnStart.addEventListener('click', ()=>{
      startLavaLoadingOverlay(2400);
      setTimeout(() => {
        ensureGameDOM();
        startGame();
      }, 2500);
    });
  }
})();

/* ========================
   [G] 게임 데이터 (이벤트/스테이지/아이템)
   =========================*/
const ALL_EVENTS = [
  { id: "mystery_merchant", name: "수상한 상인",
    itemIds: [{ itemID:"medium_potion", weight:70 },
              { itemID:"large_potion",  weight:20 },
              { itemID:"str_potion",    weight:10 }]},
  { id: "shop", name: "상점", itemIds: ["small_potion","medium_potion","large_potion","str_potion"]},
  { id: "example", name:"예시",
    baseStats:{ baseHp:100, baseAttack:100, baseDefense:100 },
    reward:{ goldRange:{min:1,max:1000},
      itemIds:[ {itemID:"small_potion", weight:40},
                {itemID:"medium_potion",weight:25},
                {itemID:"large_potion", weight:10},
                {itemID:"str_potion",   weight:25} ]}},
  { id:"spider", name:"거미",
    baseStats:{ baseHp:10, baseAttack:2, baseDefense:4 },
    reward:{ goldRange:{min:1,max:5},
      itemIds:[ {itemID:"small_potion",weight:45},
                {itemID:"str_potion",  weight:5},
                {itemID:null,          weight:50} ]}},
  { id:"wolf", name:"늑대",
    baseStats:{ baseHp:10, baseAttack:4, baseDefense:2 },
    reward:{ goldRange:{min:1,max:5},
      itemIds:[ {itemID:"small_potion",weight:45},
                {itemID:"str_potion",  weight:5},
                {itemID:null,          weight:50} ]}},
  { id:"bear", name:"곰",
    baseStats:{ baseHp:50, baseAttack:7, baseDefense:9 },
    reward:{ goldRange:{min:10,max:20},
      itemIds:[ {itemID:"medium_potion",weight:40},
                {itemID:"str_potion",   weight:20},
                {itemID:null,           weight:40} ]}},
  { id:"head_wolf", name:"우두머리 늑대",
    baseStats:{ baseHp:40, baseAttack:10, baseDefense:5 },
    reward:{ goldRange:{min:10,max:20},
      itemIds:[ {itemID:"medium_potion",weight:40},
                {itemID:"str_potion",   weight:20},
                {itemID:null,           weight:40} ]}},
  { id:"goblin", name:"고블린",
    baseStats:{ baseHp:10, baseAttack:3, baseDefense:3 },
    reward:{ goldRange:{min:1,max:5},
      itemIds:[ {itemID:"small_potion",weight:45},
                {itemID:"str_potion",  weight:5},
                {itemID:null,          weight:50} ]}},
  { id:"ork", name:"오크",
    baseStats:{ baseHp:50, baseAttack:8, baseDefense:8 },
    reward:{ goldRange:{min:10,max:20},
      itemIds:[ {itemID:"medium_potion",weight:40},
                {itemID:"str_potion",   weight:30},
                {itemID:null,           weight:30} ]}},
];

const ALL_STAGES = [
  { id:"forest_enter", name:"숲 초입부", description:"",
    randomEvent:[ {eventID:"mystery_merchant",weight:10},
                  {eventID:"spider",weight:45}, {eventID:"wolf",weight:45} ],
    nextStages:["forest_enter","forest_center"] },
  { id:"forest_center", name:"숲의 중심", description:"왠지 위험한 기분이 든다",
    randomEvent:[ {eventID:"bear",weight:50},{eventID:"head_wolf",weight:50} ],
    nextStages:["forest_enter","cave_enter","shop"] },
  { id:"cave_enter", name:"동굴 입구", description:"",
    randomEvent:[ {eventID:"mystery_merchant",weight:10},{eventID:"goblin",weight:90} ],
    nextStages:["cave_enter","cave_center"] },
  { id:"cave_deep", name:"동굴 깊은 곳", description:"",
    randomEvent:[ {eventID:"ork",weight:100} ],
    nextStages:["forest_enter","cave_enter","shop"] },
  { id:"shop", name:"상점", description:"",
    randomEvent:[ {eventID:"shop",weight:100} ],
    nextStages:["forest_enter","cave_enter"] },
];

const ALL_ITEMS = [
  { id:"small_potion", name:"소형 물약", description:"5 ~ 10 범위내 hp만큼 회복됩니다.",
    type:"consumable", priceRange:{minPrice:5,maxPrice:10},
    effect:{ stat:"hp", value:{minValue:5,maxValue:10}, direction:"POSITIVE" } },
  { id:"medium_potion", name:"중형 물약", description:"15 ~ 25 범위내 hp만큼 회복됩니다.",
    type:"consumable", priceRange:{minPrice:10,maxPrice:15},
    effect:{ stat:"hp", value:{minValue:15,maxValue:25}, direction:"POSITIVE" } },
  { id:"large_potion", name:"대형 물약", description:"40 ~ 50 범위내 hp만큼 회복됩니다.",
    type:"consumable", priceRange:{minPrice:20,maxPrice:30},
    effect:{ stat:"hp", value:{minValue:40,maxValue:50}, direction:"POSITIVE" } },
  { id:"str_potion", name:"수상한 힘의 물약", description:"1 ~ 5 만큼 힘 수치가 오르거나 내려갑니다.",
    type:"consumable", priceRange:{minPrice:10,maxPrice:15},
    effect:{ stat:"str", direction:"RANDOM",
      valueDrops:[ {amount:1,weight:25},{amount:2,weight:40},{amount:3,weight:20},{amount:4,weight:10},{amount:5,weight:5} ] } },
];

/* ========================
   [H] 게임 코어 상태/헬퍼
   =========================*/
let player;
let currentAreaID;
let stageLevel;
let currentStageData;
let currentEvent; 
let gameState; 
let titleEl, statsEl, resultEl, buttonEl, inventoryButtonEl, gameContainerEl;

// 주사위 보너스 (전역)
let tempCombatBonus = { attack: 0, defense: 0 };   // 굴리는 동안 임시
let activeDiceBonus = { attack: 0, defense: 0 };   // 전투 중 실제 적용
let isATKDiceRolled = false;
let isDEFDiceRolled = false;
let diceRollResultLog = "";

const STAGE_PROGRESSION_MAP = {
  'forest_enter': { nextArea: 'forest_center', levels: 4 },
  'forest_center': { nextArea: 'shop', levels: 1 },
  'shop':          { nextArea: 'cave_enter', levels: 1 },
  'cave_enter':    { nextArea: 'cave_deep', levels: 4 },
  'cave_deep':     { nextArea: 'GAME_CLEAR', levels: 1 }
};

function initializeDOMElements() {
  gameContainerEl    = document.getElementById('gameContainer');
  titleEl            = document.getElementById('main-title');
  statsEl            = document.getElementById('player-stats');
  resultEl           = document.getElementById('dice-result');
  buttonEl           = document.getElementById('main-button');
  inventoryButtonEl  = document.getElementById('inventory-button');
}

function getRandomInt(min, max) {
  min = Math.ceil(min); 
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function findDataById(array, id) { return array.find(item => item.id === id); }

function getWeightedRandom(array) {
  let totalWeight = 0;
  for (const item of array) totalWeight += item.weight || 0;
  let randomNum = Math.random() * totalWeight;
  for (const item of array) {
    const weight = item.weight || 0;
    if (randomNum < weight) return item;
    randomNum -= weight;
  }
  return array[0];
}

/* ========================
   [I] UI 업데이트 (단일본)
   =========================*/
function updatePlayerStatsUI() {
  if (!statsEl) return;

  // 인벤토리 요약
  const counts = {};
  for (const id of (player?.inventory ?? [])) counts[id] = (counts[id] || 0) + 1;
  let invText = '없음';
  if ((player?.inventory?.length ?? 0) > 0) {
    invText = Object.keys(counts).map(id => {
      const item = findDataById(ALL_ITEMS, id);
      return `${item?.name ?? id} x${counts[id]}`;
    }).join(', ');
  }

  const areaInfo = STAGE_PROGRESSION_MAP?.[currentAreaID] ?? { levels: '?' };
  const stageNm  = currentStageData?.name ?? 'Stage';
  const stageLv  = stageLevel ?? '?';
  const levels   = areaInfo.levels ?? '?';

  const atkBase = player?.attack  ?? 0;  // activeDiceBonus가 스탯에 이미 반영됨
  const defBase = player?.defense ?? 0;
  const hpText  = `${player?.hp ?? 0} / ${player?.maxHp ?? 0}`;

  const aB = activeDiceBonus.attack  || 0;
  const dB = activeDiceBonus.defense || 0;
  const fmt = (b) => b ? `(<span style="color:${b>0?'khaki':'salmon'};">${b>0?'+':''}${b}</span>)` : '';

  statsEl.innerHTML =
    `<b>Stage: ${stageNm} (${stageLv}/${levels})</b><br>
     HP: ${hpText} | ATK: ${atkBase}${fmt(aB)} | DEF: ${defBase}${fmt(dB)} | Gold: ${player?.gold ?? 0}<br>
     인벤토리: ${invText}`;
}

function updateMainUI(title, result, buttonText) {
  if (!titleEl || !resultEl || !buttonEl) return; 
  titleEl.textContent = title;
  resultEl.innerHTML  = result; 
  buttonEl.textContent= buttonText;
  resultEl.style.flexDirection = 'column';
  resultEl.style.textAlign = 'center';
}

function setUIForAction(showMain = false, showInventory = false) {
  if (buttonEl)          buttonEl.style.display          = showMain ? 'block' : 'none';
  if (inventoryButtonEl) inventoryButtonEl.style.display = showInventory ? 'block' : 'none';
}

/* ========================
   [I-ADV] 어드벤처(이미지형) 화면
   =========================*/
function _adv(id){ return document.getElementById(id); }

function showAdventureScreen(show = true) {
  if (!$advEl) return;
  $advEl.classList.toggle('hidden', !show);
}

function renderAdventure({ stageIndex, stageName, player, avatarSrc }) {
  const setTxt = (id, v) => { const el = _adv(id); if (el) el.textContent = v; };
  setTxt('stage-index', stageIndex ?? '1-1');
  setTxt('stage-name',  stageName ?? '숲 초입부');
  setTxt('stat-hp',     player?.hp ?? 100);
  setTxt('stat-atk',    (player?.attack ?? player?.atk) ?? 10);
  setTxt('stat-def',    (player?.defense ?? player?.def) ?? 5);
  setTxt('stat-gold',   player?.gold ?? 0);

  const avatar = _adv('avatar');
  if (avatar && avatarSrc) avatar.src = avatarSrc;
}

// ===== 전투 준비(주사위) 오버레이 =====
const $battleEl   = document.getElementById('battle');
const $bHero      = document.getElementById('battle-hero');
const $bEnemy     = document.getElementById('battle-enemy');
const $bHp        = document.getElementById('b-hp');
const $bAtk       = document.getElementById('b-atk');
const $bDef       = document.getElementById('b-def');
const $bGold      = document.getElementById('b-gold');
const $bStageIdx  = document.getElementById('stage-index');
const $bStageName = document.getElementById('stage-name');
const $btnBATK    = document.getElementById('battle-atk');
const $btnBDEF    = document.getElementById('battle-def');

function showBattlePrep(show = true){
  if(!$battleEl) return;
  $battleEl.classList.toggle('hidden', !show);
}

function renderBattlePrep(){
  if(!$battleEl) return;

  // 스테이지 표기
  $bStageIdx && ($bStageIdx.textContent = `1-${stageLevel ?? 1}`);
  $bStageName && ($bStageName.textContent = currentStageData?.name || 'Stage');

  // 플레이어 스탯
  $bHp  && ($bHp.textContent  = player?.hp ?? 0);
  $bAtk && ($bAtk.textContent = player?.attack ?? 0);
  $bDef && ($bDef.textContent = player?.defense ?? 0);
  $bGold&& ($bGold.textContent= player?.gold ?? 0);

  // 캐릭터/몬스터 이미지
  if ($bHero)  $bHero.src  = "./image/character.png";
  if ($bEnemy){
    // 이벤트에 맞게 간단 매핑 (필요 시 추가)
    const enemyMap = {
      spider: "./image/spider.png",
      wolf:   "./image/wolf.png",  // (예시) 현재 늑대 이미지는 없으므로 spider로 대체
      bear:   "./image/spider.png",
      goblin: "./image/spider.png",
      ork:    "./image/spider.png",
      head_wolf: "./image/spider.png",
    };
    $bEnemy.src = enemyMap[currentEvent?.id] || "./image/spider.png";
  }

  // 버튼 초기화
  if ($btnBATK){ $btnBATK.disabled = false; $btnBATK.querySelector('span').textContent = "공격"; }
  if ($btnBDEF){ $btnBDEF.disabled = false; $btnBDEF.querySelector('span').textContent = "방어"; }
}

function markAtkDone() {
  if ($btnBATK){
    const sp = $btnBATK.querySelector('span');
    freezeInlineWidth(sp);              // ✨ 현재 폭을 픽셀로 고정
    $btnBATK.disabled = true;           // 스타일만 바뀌고 크기는 그대로
    if (sp) sp.textContent = "공격";    // 또는 "공격 완료"로 바꿔도 폭은 고정됨
  }
}
function markDefDone() {
  if ($btnBDEF){
    const sp = $btnBDEF.querySelector('span');
    freezeInlineWidth(sp);              // ✨
    $btnBDEF.disabled = true;
    if (sp) sp.textContent = "방어";
  }
}

/* ========================
   [J] 게임 플레이
   =========================*/
function startGame() {
  // 상태 초기화
  hardResetRun();
  player = { hp:100, maxHp:100, attack:10, defense:5, gold:0, inventory:[] };
  currentAreaID     = 'forest_enter';
  currentStageData  = findDataById(ALL_STAGES, currentAreaID);
  stageLevel        = 1;
  gameState         = 'EXPLORING';
  setMainActionListeners();

  // 텍스트 UI 초기화
  updatePlayerStatsUI();
  setUIForAction(false, false);
  if (gameContainerEl) gameContainerEl.style.display = 'block';

  // 이미지형 진입 화면
  renderAdventure({
    stageIndex: `1-${stageLevel}`,
    stageName:  currentStageData.name,
    player,
    avatarSrc: "./image/character.png"
  });

  // 이미지형 화면 버튼 핸들
  $btnExplore?.addEventListener('click', ()=>{
    showAdventureScreen(false);
    setUIForAction(true, true);
    triggerRandomEvent();
  });
  $btnBag?.addEventListener('click', ()=>{
    showAdventureScreen(false);
    setUIForAction(true, true);
    displayInventory();
  });

  showAdventureScreen(true);
}
// 전투 준비 오버레이 버튼 SFX/클릭 연결
$btnBATK?.addEventListener('mouseenter', () => AudioMgr.beep(850 + Math.random()*150, 0.05));
$btnBDEF?.addEventListener('mouseenter', () => AudioMgr.beep(850 + Math.random()*150, 0.05));
$btnBATK?.addEventListener('click', () => { AudioMgr.beep(700, 0.08);  handleATKDiceRoll(); });
$btnBDEF?.addEventListener('click', () => { AudioMgr.beep(750, 0.08);  handleDEFDiceRoll(); });



// 스페이스로 로비 복귀(원하면 유지)
window.addEventListener('keydown', (e) => {
  if (e.code === 'Space' && $advEl && !$advEl.classList.contains('hidden')) {
    hardResetRun();
    // 로비로
    document.getElementById('gameContainer').style.display = 'none';
    const lobby = document.getElementById('lobby');
    lobby.style.display = 'grid';
    requestAnimationFrame(() => lobby.classList.add('on'));
  }
});

function handleMainAction() {
  switch (gameState) {
    case 'START':
    case 'GAME_OVER': startGame(); break;
    case 'EXPLORING': triggerRandomEvent(); break;
    case 'COMBAT':    attackMonster(); break;
    case 'AREA_CLEAR': break;
  }
}
function handleInventoryAction() {
  if (gameState === 'EXPLORING' || gameState === 'START' || gameState === 'GAME_OVER')
    displayInventory();
}
function setMainActionListeners() {
  buttonEl.onclick = handleMainAction;
  inventoryButtonEl.onclick = handleInventoryAction;
}
function clearMainActionListeners() {
  buttonEl.onclick = null;
  inventoryButtonEl.onclick = null;
}
function setDiceRollListeners() {
  clearMainActionListeners();
  if (buttonEl)          buttonEl.onclick = handleATKDiceRoll;     // 키보드/텍스트 버튼도 동작
  if (inventoryButtonEl) inventoryButtonEl.onclick = handleDEFDiceRoll;

  // ⬇️ 이미지 버튼(ID는 전투 준비 오버레이의 <img>에 부여해둔 값)
  const atkImg = document.getElementById('btn-attack');
  const defImg = document.getElementById('btn-defense');
  if (atkImg) atkImg.onclick = handleATKDiceRoll;
  if (defImg) defImg.onclick = handleDEFDiceRoll;
}


function triggerRandomEvent() {
  const eventRoll = getWeightedRandom(currentStageData.randomEvent); 
  const eventData = findDataById(ALL_EVENTS, eventRoll.eventID);
  if (!eventData) {
    console.error(`이벤트 데이터를 찾을 수 없습니다: ${eventRoll.eventID}`);
    updateMainUI(currentStageData.name, "아무것도 발견하지 못했다.", "탐험하기");
    return;
  }

  if (eventData.baseStats) {
    // 전투 이벤트 시작 전: 기존 전투 보너스 원복
    resetCombatDiceBonus();

    currentEvent = {
      ...eventData,
      currentHp: eventData.baseStats.baseHp,
      attack:    eventData.baseStats.baseAttack,
      defense:   eventData.baseStats.baseDefense
    };

    displayDiceRollScreen(); // ATK/DEF 주사위 굴리기 화면
  } else if (eventData.id === "mystery_merchant" || eventData.id === "shop") {
    gameState = 'SHOPPING';
    currentEvent = { ...eventData };
    displayShopUI();
  }
}


/* ===== 주사위 보너스 ===== */
function applyCombatDiceBonus(statType) {
  const diceRoll = getRandomInt(1, 6);
  let bonus = 0;
  const statName = statType === 'attack' ? '공격력(ATK)' : '방어력(DEF)';
  let message = `주사위 굴림 결과: 🎲 <b>${diceRoll}</b>!`;

  if (diceRoll === 6) {
    bonus = 3;  message += `<br>🔥 <b>대성공!</b> ${statName} +3 보너스!`;
  } else if (diceRoll >= 4) {
    bonus = 2;  message += `<br>👍 <b>성공!</b> ${statName} +2 보너스!`;
  } else if (diceRoll === 1) {
    bonus = -1; message += `<br>💀 <b>실패...</b> ${statName} -1 패널티...`;
  } else {
    message += `<br>평범한 굴림입니다.`;
  }

  tempCombatBonus[statType] = bonus;
  return message;
}

// === 전투 준비 오버레이: 스탯 갱신(임시 보너스 즉시 반영) ===
function updateBattleOverlayStatsWithTemp() {
  if ($bHp)   $bHp.textContent   = player?.hp ?? 0;
  if ($bGold) $bGold.textContent = player?.gold ?? 0;

  // ✨ 즉시 반영: 기본 + temp 보너스
  if ($bAtk)  $bAtk.textContent  = (player?.attack  ?? 0) + (tempCombatBonus.attack  || 0);
  if ($bDef)  $bDef.textContent  = (player?.defense ?? 0) + (tempCombatBonus.defense || 0);
}
// === [공용] 스탯 숫자 갱신 (applyTemp=true면 tempCombatBonus 즉시 반영) ===
function refreshStatsViews({ applyTemp = false } = {}) {
  const baseAtk = player?.attack  ?? 0;
  const baseDef = player?.defense ?? 0;
  const hp      = player?.hp      ?? 0;
  const gold    = player?.gold    ?? 0;

  const atkShown = baseAtk + (applyTemp ? (tempCombatBonus.attack  || 0) : 0);
  const defShown = baseDef + (applyTemp ? (tempCombatBonus.defense || 0) : 0);

  // ⬇️ 오버레이(아이콘 아래 숫자)
  if ($bHp)   $bHp.textContent   = hp;
  if ($bAtk)  $bAtk.textContent  = atkShown;
  if ($bDef)  $bDef.textContent  = defShown;
  if ($bGold) $bGold.textContent = gold;

  // ⬇️ 기존 텍스트 패널(있으면 그대로 갱신)
  updatePlayerStatsUI?.();
}



function resetCombatDiceBonus() {
  // 전투가 끝났을 때 원복
  if (player) {
    player.attack  -= activeDiceBonus.attack  || 0;
    player.defense -= activeDiceBonus.defense || 0;
  }
  activeDiceBonus = { attack: 0, defense: 0 };
  tempCombatBonus  = { attack: 0, defense: 0 };
}

function setBattleText(titleText = '', descHTML = '') {
  const title = document.querySelector('.battle-title');
  const desc  = document.getElementById('battle-desc');
  if (!title || !desc) return;

  // 높이 고정(최초 1회만)
  freezeBlockHeight(title);
  freezeBlockHeight(desc);

  // 1) 현재 문구 페이드아웃
  title.classList.add('battle-text-hide');
  desc.classList.add('battle-text-hide');

  // 2) 내용 교체 후 페이드인 (display는 건드리지 않음)
  setTimeout(() => {
    title.textContent = titleText || '';     // 빈 문자열이어도 높이는 minHeight로 유지
    desc.innerHTML    = descHTML || '';
    requestAnimationFrame(() => {
      title.classList.remove('battle-text-hide');
      desc.classList.remove('battle-text-hide');
    });
  }, 200);
}
// ==== 완전 초기화(보너스/상태 전부 리셋) ====
function hardResetRun() {
  // 이전 판에서 적용돼 있던 보너스 되돌리기
  if (player) {
    player.attack  -= (activeDiceBonus.attack  || 0);
    player.defense -= (activeDiceBonus.defense || 0);
  }

  // 보너스/주사위 상태 초기화
  activeDiceBonus     = { attack: 0, defense: 0 };
  tempCombatBonus     = { attack: 0, defense: 0 };
  isATKDiceRolled     = false;
  isDEFDiceRolled     = false;
  diceRollResultLog   = "";

  // 진행 상태 & 이벤트 초기화
  currentAreaID       = null;
  currentStageData    = null;
  currentEvent        = null;
  stageLevel          = 1;
  
  // 전투 오버레이/텍스트 초기화(보이면 닫기)
  if ($battleEl) $battleEl.classList.add('hidden');
  const t = document.querySelector('.battle-title');
  const d = document.getElementById('battle-desc');
  if (t) t.textContent = '';
  if (d) d.textContent = '';

  // 하단 숫자/텍스트 UI도 깨끗하게
  if ($bHp)   $bHp.textContent   = '0';
  if ($bAtk)  $bAtk.textContent  = '0';
  if ($bDef)  $bDef.textContent  = '0';
  if ($bGold) $bGold.textContent = '0';

  // 기존 텍스트 패널도 비워두기
  if (resultEl) resultEl.innerHTML = '';
}

// === [Freeze Utilities] ==========================
function freezeBlockHeight(el){
  if (!el || el.dataset.frozen) return;
  const h = Math.ceil(el.getBoundingClientRect().height);
  el.style.minHeight = h + 'px';
  el.dataset.frozen = '1';
}
function freezeInlineWidth(el){
  if (!el || el.dataset.frozen) return;
  const w = Math.ceil(el.getBoundingClientRect().width);
  el.style.display = 'inline-block';
  el.style.minWidth = w + 'px';
  el.style.width = w + 'px';
  el.dataset.frozen = '1';
}

// 전투 준비 화면의 레이아웃을 한 번만 고정
let _battleLayoutFrozen = false;
function freezeBattleLayoutOnce(){
  if (_battleLayoutFrozen) return;
  const title = document.querySelector('.battle-title');
  const desc  = document.getElementById('battle-desc');
  const actors= document.querySelector('.battle-actors');
  const stats = document.querySelector('.battle-stat');
  const btns  = document.querySelector('.battle-btns');

  [title, desc, actors, stats, btns].forEach(freezeBlockHeight);
  _battleLayoutFrozen = true;
}

/* ===== 주사위 UI & 동작 ===== */
function displayDiceRollScreen() {
  isATKDiceRolled = false;
  isDEFDiceRolled = false;
  diceRollResultLog = "";

  setDiceRollListeners();
  renderBattlePrep?.();
  showBattlePrep?.(true);
  // 처음 진입 시: 임시보너스 0을 포함한 값으로 정렬
  refreshStatsViews({ applyTemp: true });

  updateBattleOverlayStatsWithTemp();
  // ✨ 들썩임 방지: 현재 레이아웃 높이 고정
  requestAnimationFrame(() => freezeBattleLayoutOnce());

  setBattleText(
    '몬스터 출현!',
    `${currentEvent.name}이(가) 나타났다!\n전투에 돌입하기 전, 공격력과 방어력 주사위를 굴립니다.`
  );

  // (텍스트 UI는 뒤에 가려져 있지만 기존 로직 유지)
  updatePlayerStatsUI();
  updateMainUI(
    `몬스터 출현!`,
    `${currentEvent.name}이(가) 나타났다! 전투에 돌입하기 전, 공격력과 방어력 주사위를 굴립니다.`,
    "공격력 주사위 굴리기"
  );
  inventoryButtonEl.textContent = '방어력 주사위 굴리기';
  inventoryButtonEl.disabled = false;
  buttonEl.disabled = false;
  setUIForAction(true, true);
}

function handleATKDiceRoll() {
  if (isATKDiceRolled) return;

  const message = applyCombatDiceBonus('attack');   // 결과 문자열(HTML 포함)
  isATKDiceRolled = true;
  refreshStatsViews({ applyTemp: true });
  
  diceRollResultLog += `[ATK 굴림]: ${message}<br>`;

  // 텍스트 UI 반영(유지)
  buttonEl.disabled = true;
  buttonEl.textContent =
    `공격력 굴림 완료 (${tempCombatBonus.attack>0?'+':''}${tempCombatBonus.attack})`;
  resultEl.innerHTML = diceRollResultLog;
  updatePlayerStatsUI();
  updateBattleOverlayStatsWithTemp();   // ✨ 즉시 반영

  // 오버레이 결과: 제목 숨기고 결과만 표시
  setBattleText('', `[ATK 굴림]\n${message}`);

  // 이미지 버튼 상태(있으면)
  if (typeof $btnBATK !== 'undefined' && $btnBATK) {
    $btnBATK.disabled = true;
    $btnBATK.querySelector('span') && ($btnBATK.querySelector('span').textContent = "공격 완료");
  }

  if (isDEFDiceRolled) {
    setBattleText('', '두 주사위 모두 완료!\n전투를 시작합니다…');
    setTimeout(() => { showBattlePrep?.(false); startCombatAfterDiceRoll(); }, 600);
  }
}

function handleDEFDiceRoll() {
  if (isDEFDiceRolled) return;
  const message = applyCombatDiceBonus('defense');
  isDEFDiceRolled = true;
  refreshStatsViews({ applyTemp: true });
  diceRollResultLog += `[DEF 굴림]: ${message}<br>`;

  inventoryButtonEl.disabled = true;
  inventoryButtonEl.textContent = `방어력 굴림 완료 (${tempCombatBonus.defense>0?'+':''}${tempCombatBonus.defense})`;
  resultEl.innerHTML = diceRollResultLog;
  updatePlayerStatsUI();

  setBattleText('', `[DEF 굴림]\n${message}`);
  markDefDone();                        // ✨

  if (isATKDiceRolled) {
    setBattleText('', '두 주사위 모두 완료!\n전투를 시작합니다…');
    setTimeout(() => { showBattlePrep?.(false); startCombatAfterDiceRoll(); }, 600);
  }
}


function startCombatAfterDiceRoll() {
  // 주사위 보너스 확정 → 스탯 반영
  activeDiceBonus = { ...tempCombatBonus };
  player.attack  += activeDiceBonus.attack;
  player.defense += activeDiceBonus.defense;
  tempCombatBonus = { attack: 0, defense: 0 };
  refreshStatsViews({ applyTemp: false });
  // 전투 진입
  gameState = 'COMBAT';
  setMainActionListeners();
  buttonEl.disabled = false;
  inventoryButtonEl.disabled = false;
  inventoryButtonEl.textContent = '인벤토리';

  updatePlayerStatsUI();
  updateBattleOverlayStatsWithTemp();   // ✨ 적용된 실제 값으로 동기화

  updateMainUI(
    `전투 시작!`,
    `${diceRollResultLog}<br><b>${currentEvent.name}</b> (HP: ${currentEvent.currentHp})과의 전투를 시작합니다!`,
    "공격하기"
  );
  setUIForAction(true, false);
}

/* ===== 전투 루프 ===== */
function attackMonster() {
  let logMessage = "";
  const playerRawDamage = getRandomInt(player.attack - 2, player.attack + 2);
  const monsterDefense  = currentEvent.defense;
  const playerDamage    = Math.max(1, playerRawDamage - monsterDefense); 
  currentEvent.currentHp -= playerDamage;
  logMessage += `[플레이어] ${currentEvent.name}에게 ${playerDamage}의 피해! (방어: ${monsterDefense})`;

  if (currentEvent.currentHp <= 0) { winCombat(); return; }

  const monsterRawDamage = getRandomInt(currentEvent.attack - 1, currentEvent.attack + 1);
  const playerDefense    = player.defense;
  const monsterDamage    = Math.max(1, monsterRawDamage - playerDefense); 
  player.hp -= monsterDamage;
  logMessage += `<br>[${currentEvent.name}] 플레이어에게 ${monsterDamage}의 피해! (방어: ${playerDefense})`;

  if (player.hp <= 0) {
    player.hp = 0;
    loseGame();
  } else {
    updatePlayerStatsUI();
    updateMainUI('전투 중!', `${currentEvent.name} (HP: ${currentEvent.currentHp})`, "공격하기");
    resultEl.innerHTML = logMessage;
    setUIForAction(true, false); 
  }
}

function advanceStage() {
  const mapEntry = STAGE_PROGRESSION_MAP[currentAreaID];
  if (!mapEntry) return;

  if (mapEntry.nextArea === 'GAME_CLEAR') { winGame(); return; }

  currentAreaID = mapEntry.nextArea;
  stageLevel = 1;
  currentStageData = findDataById(ALL_STAGES, currentAreaID);

  gameState = 'EXPLORING';
  updatePlayerStatsUI();
  updateMainUI(currentStageData.name, `${currentStageData.name}에 진입했습니다.`, "탐험하기"); 
  setUIForAction(true, true);
}

function winCombat() {
  const reward = currentEvent.reward;
  let gainedGold = 0;
  let resultMessage = `${currentEvent.name} 처치!`;
  if (reward?.goldRange) {
    gainedGold = getRandomInt(reward.goldRange.min, reward.goldRange.max);
    player.gold += gainedGold;
    resultMessage += `<br>(+${gainedGold} Gold)`;
  }
  if (reward?.itemIds?.length) {
    const dropped = getWeightedRandom(reward.itemIds);
    if (dropped && dropped.itemID) {
      const itemData = findDataById(ALL_ITEMS, dropped.itemID);
      if (itemData) {
        player.inventory.push(itemData.id);
        resultMessage += `<br>(${itemData.name} 획득!)`;
      }
    } else {
      resultMessage += `<br>(아이템 없음)`;
    }
  }

  resetCombatDiceBonus(); // 보너스 원복
  currentEvent = null; 

  const areaInfo = STAGE_PROGRESSION_MAP[currentAreaID];
  const nextStageLevel = stageLevel + 1;

  if (nextStageLevel > areaInfo.levels) {
    resultMessage += `<br><br><b>🎉 지역 클리어! 🎉</b><br>다음 지역으로 이동합니다...`;
    gameState = 'AREA_CLEAR';

    updatePlayerStatsUI();
    updateMainUI(currentStageData.name, resultMessage, "다음 지역으로");
    setUIForAction(true, false);

    const originalHandler = buttonEl.onclick;
    buttonEl.onclick = () => {
      buttonEl.onclick = originalHandler;
      stageLevel++;
      advanceStage();
    };
    return;
  } else {
    stageLevel++;
    resultMessage += `<br><br>다음 스테이지 (${stageLevel}/${areaInfo.levels}) 로 이동합니다.`;
    gameState = 'EXPLORING';
  }

  updatePlayerStatsUI();
  updateMainUI(currentStageData.name, resultMessage, "탐험하기");
  setUIForAction(true, true); 
}

function loseGame() {
  resetCombatDiceBonus();
  gameState = 'GAME_OVER';
  updatePlayerStatsUI();
  updateMainUI("게임 오버", "사망했습니다...", "다시 시작하기");
  setUIForAction(true, true); 
}

function winGame() {
  gameState = 'GAME_OVER'; 
  updatePlayerStatsUI();
  updateMainUI("★ GAME CLEAR ★", "모든 스테이지를 클리어했습니다!", "다시 시작하기");
  setUIForAction(true, false); 
}

/* ========================
   [K] 인벤토리/상점
   =========================*/
function displayInventory() {
  gameState = 'INVENTORY';
  titleEl.textContent = '인벤토리';
  resultEl.innerHTML  = '';
  resultEl.style.textAlign = 'left';
  setUIForAction(false, false);

  const counts = {};
  for (const id of player.inventory) counts[id] = (counts[id] || 0) + 1;

  if (player.inventory.length === 0) resultEl.textContent = '가진 아이템이 없습니다.';
  for (const id in counts) {
    const item = findDataById(ALL_ITEMS, id);
    if (item && item.type === 'consumable') {
      const btn = document.createElement('button');
      btn.textContent = `사용: ${item.name} (x${counts[id]}) - ${item.description}`;
      btn.onclick = () => useItem(item);
      resultEl.appendChild(btn);
    }
  }
  const exitButton = document.createElement('button');
  exitButton.textContent = '탐험으로 돌아가기';
  exitButton.className = 'exit-button';
  exitButton.onclick = () => exitInventory();
  resultEl.appendChild(exitButton);
}

function exitInventory() {
  if (player.hp <= 0) {
    loseGame(); 
  } else {
    gameState = 'EXPLORING';
    updateMainUI(currentStageData.name, '탐험을 계속합니다.', '탐험하기');
    setUIForAction(true, true); 
  }
}

function useItem(itemToUse) {
  const idx = player.inventory.indexOf(itemToUse.id);
  if (idx === -1) { alert("오류: 해당 아이템이 없습니다."); displayInventory(); return; }
  player.inventory.splice(idx, 1);

  const effect = itemToUse.effect;
  let value = 0;
  if (effect.valueDrops) {
    const drop = getWeightedRandom(effect.valueDrops);
    value = drop.amount;
  } else if (effect.value) {
    value = getRandomInt(effect.value.minValue, effect.value.maxValue);
  }

  let changeValue = 0;
  if (effect.direction === "POSITIVE") changeValue = value;
  else if (effect.direction === "NEGATIVE") changeValue = -value;
  else if (effect.direction === "RANDOM") changeValue = (Math.random() < 0.5) ? value : -value;

  let msg = "";
  if (effect.stat === "hp") {
    player.hp = Math.min(player.maxHp, player.hp + changeValue);
    msg = `HP가 ${changeValue}만큼 변했습니다. (현재 HP: ${player.hp})`;
  } else if (effect.stat === "str") {
    player.attack += changeValue;
    msg = `공격력(ATK)이 ${changeValue}만큼 변했습니다. (현재 ATK: ${player.attack})`;
  }
  alert(msg);
  updatePlayerStatsUI();
  displayInventory();
}

function generateShopInventory(eventData) {
  currentEvent.inventory = []; 
  let ids = [];
  if (eventData.id === 'shop') ids = eventData.itemIds;
  else if (eventData.id === 'mystery_merchant') ids = eventData.itemIds.map(it => it.itemID);
  for (const id of ids) {
    const item = findDataById(ALL_ITEMS, id);
    if (item) {
      const price = getRandomInt(item.priceRange.minPrice, item.priceRange.maxPrice);
      currentEvent.inventory.push({ ...item, price });
    }
  }
}

function displayShopUI() {
  titleEl.textContent = currentEvent.name; 
  resultEl.innerHTML = ''; 
  resultEl.style.textAlign = 'left'; 
  setUIForAction(false, false); 
  generateShopInventory(currentEvent); 
  for (const item of currentEvent.inventory) {
    const btn = document.createElement('button');
    btn.textContent = `구매: ${item.name} (${item.price} Gold) - ${item.description}`;
    btn.onclick = () => buyItem(item); 
    resultEl.appendChild(btn);
  }
  const exitButton = document.createElement('button');
  exitButton.textContent = '가게 나가기';
  exitButton.className = 'exit-button'; 
  exitButton.onclick = () => exitShop(); 
  resultEl.appendChild(exitButton);
}

function buyItem(itemToBuy) {
  if (player.gold >= itemToBuy.price) {
    player.gold -= itemToBuy.price;
    player.inventory.push(itemToBuy.id);
    updatePlayerStatsUI(); 
    alert(`${itemToBuy.name}을(를) 구매했습니다.`);
  } else {
    alert('골드가 부족합니다.');
  }
}

function exitShop() {
  gameState = 'EXPLORING';
  currentEvent = null;
  if (currentAreaID === 'shop') {
    advanceStage();
  } else {
    updateMainUI(currentStageData.name, '탐험을 계속합니다.', '탐험하기');
    setUIForAction(true, true); 
  }
}

/* ========================
   [M] 로비 보조 연결
   =========================*/
function ensureGameDOM(){ if (!gameContainerEl) initializeDOMElements(); }

btnInv.addEventListener('click', ()=>{
  ensureGameDOM();
  if (!player || !gameState || gameState === 'GAME_OVER') startGame();
  lobbyEl.style.display = 'none';
  gameContainerEl.style.display = 'block';
  displayInventory();
});

btnMy.addEventListener('click', ()=>{ alert('캐릭터 보기/커스텀 화면은 곧 추가됩니다!'); });

requestAnimationFrame(() => lobbyEl.classList.add('lobby-ready'));

