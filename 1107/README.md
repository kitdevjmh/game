
# 게임프로그래밍 팀 과제
- 팀장
  - 김현진 (hyeonjin127)
- 팀원
  - 조현창 (chc020604)
  - 조민혁 (kitdevjmh)

# 🏰 던전 오브 다이스 (Dungeon of Dice)

## 목차

- [디자인](#design)
- [게임 내 데이터](#data)
- [게임 핵심 로직](#logic)

<h1 id='design'> 🎨 디자인 </h1>

HTML5 기반의 **랜덤 RPG 게임** 입니다.  
주사위를 굴려 던전에 진입하는 세계관을 표현합니다.

이 인트로 페이지는 용암 게이지와 주사위 애니메이션을 통해 **로딩 + 진입 연출**을 제공합니다.

---

## 폴더 구조

/event
- event.html # 메인 HTML (인트로 로직 포함)
- intro.css # 스타일 정의 (외부 CSS)
- gamelogo.png # 게임 로고 (PNG, 투명 배경 권장)

> ⚠️ `event.html`, `intro.css`, `gamelogo.png`는 **같은 폴더**에 있어야 합니다.

---

## 실행 방법

1. 위 세 파일을 같은 폴더에 둡니다.  
2. `event.html`을 브라우저로 열면 인트로 화면이 표시됩니다.  
3. 로딩이 완료되면  
   **“로딩 완료! 터치 해서 접속하세요!”** 문구가 뜹니다.
4. 화면을 클릭 / 터치 / `Enter` / `Space` 키로 **게임 진입**이 가능합니다.

---

## 주요 기능 요약

### 🎲 1. 용암 게이지 + 주사위 로딩바
- 주사위 토큰이 **용암 게이지 위를 따라 이동**하며 로딩이 진행됩니다.  
- 주사위는 실제 주사위 눈금처럼 굴러가며 바 끝에서도 **잘리지 않도록 보정**됨.
- 게이지 내부는 다음 레이어들로 구성됩니다:
  - `lava-flow` : 붉은 용암 흐름 애니메이션  
  - `lava-noise` : 미세한 용암 흔들림 효과  
  - `lava-bubbles` : 몽글거리는 용암 버블  
  - `lava-gloss` : 광택층 (빛 반사)

### 2. 주사위(토큰) 애니메이션
- `updateTokenPosition(%)` 함수로 위치 및 회전, 바운스 효과 제어  
- 주사위는 바의 픽셀 폭에 맞춰 중심 이동이 계산되며,  
  끝에서 잘리는 현상이 없도록 **여유 좌우폭(min/maxCenter)** 보정

### 3. 상태(Status) 텍스트 동적 변화
| 진행도 | 문구 |
|--------|------|
| 0~35%  | 자원을 불러오는 중… |
| 35~70% | 주사위를 굴리는 중… |
| 70~99% | 던전 문을 여는 중… |
| 100%   | 로딩 완료! 터치 해서 접속하세요! |

- 100% 이후 `.ready` 클래스로 **크기 확대 + 깜빡임(pulse)** 효과 적용.

### 4. 게임 로고 페이드인 / 확대
- 로딩 완료 시 `.show` 클래스를 적용하여 자연스러운 등장:
  ```css
  #logo { opacity:0; transform:scale(.9); transition:.8s ease; }
  #logo.show { opacity:1; transform:scale(1); }
  ```
---

## 코드별 상세 설명

### event.html — 인트로 화면 구조 & 로직

#### <head> 구성
- meta viewport : 모바일 기기 대응 및 반응형 확대 비율 설정  
- `<title>` : 브라우저 탭 제목 설정  
- link rel="stylesheet" href="intro.css" : 외부 CSS 파일 연결

---

# 인트로 레이아웃 구조

▪ 상단 사운드 토글 버튼
```javascript
<div class="top-ui">
  <button id="sound" class="tiny-btn">🔊 SOUND</button>
</div>
```
- 사운드 온/오프를 제어하는 버튼  
- 클릭 시 AudioMgr.toggle() 호출, Web Audio API 정책으로 인해 사용자 입력 후만 작동

▪ 인트로 메인 영역
```javascript
<div class="intro" id="intro">
  <img id="logo" src="./gamelogo.png" alt="게임 로고" />
  <div class="status" id="status">자원을 불러오는 중…</div>
</div>
```
- #logo : 로딩 100% 후 페이드인 + 확대 등장  
- #status : 로딩 중 텍스트 갱신 (“주사위를 굴리는 중…”, “던전 문을 여는 중…” 등)

▪ 용암 게이지 + 주사위 토큰 로딩바
```javascript
<div class="dice-bar" id="diceBar">
  <div class="track rock">
    <div class="fill" id="fill">
      <div class="lava-flow"></div>
      <div class="lava-noise"></div>
      <div class="lava-bubbles" id="lavaBubbles"></div>
      <div class="lava-gloss"></div>
    </div>
  </div>
  <div class="token" id="token">
    <svg class="die">...</svg>
    <div class="shadow" id="shadow"></div>
  </div>
</div>
```
- .fill 의 width를 통해 진행률 시각화  
- 내부 레이어 구성  
  - lava-flow : 붉은 용암 흐름  
  - lava-noise : 용암 흔들림 노이즈  
  - lava-bubbles : 버블 애니메이션  
  - lava-gloss : 광택 반사  

▪ 게이트 및 클릭 베일
```javascript
<div class="click-veil" id="veil"></div>
<div class="gate" id="gate">
  <div class="top"></div>
  <div class="bottom"></div>
</div>
```
- #veil : 로딩 완료 후 클릭/터치 영역 활성화  
- .gate : 화면 전환 애니메이션 (상하 닫힘)


------------------------------------------------------------
### JavaScript 로직
------------------------------------------------------------

🎲 주사위 눈 관리
```javascript
function setFace(n){
  die.querySelectorAll('.pip').forEach(el=>{
    el.style.display = el.classList.contains('f'+n) ? 'block' : 'none';
  });
}
```
- SVG 내부의 점(pip)을 숨기거나 표시해 1~6 눈 구현

주사위 이동/회전/바운스 처리
```javascript
function updateTokenPosition(percentage){
  const bw = diceBar.clientWidth;
  const tw = token.offsetWidth || 44;
  const centerX = (tw/2) + (bw - tw) * (percentage/100);
  token.style.left = centerX + 'px';
  token.style.transform = `translate(-50%,-50%) rotate(${percentage*3}deg)`;
  const bob = Math.sin(percentage/100 * Math.PI * 2) * 6;
  token.style.transform += ` translateY(${-Math.abs(bob)}px)`;
}
```
- 로딩바의 실제 픽셀 단위를 기준으로 이동  
- 회전 + 위아래 바운스 + 그림자 크기 보정  

용암 버블 생성
```javascript
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
    { transform:'translate(-50%,6px) scale(.8)', opacity:0 },
    { transform:'translate(-50%,-26px) scale(1)', opacity:.9, offset:.2 },
    { transform:'translate(-50%,-58px) scale(.9)', opacity:0 }
  ], { duration: dur, easing:'cubic-bezier(.3,.8,.2,1)' });
  setTimeout(()=> b.remove(), dur+30);
}
```
- 무작위 크기/위치의 버블을 생성해 부드럽게 떠오르는 효과  

사운드 매니저
```javascript
const AudioMgr = (()=>{ ... })();
```
- Web Audio API로 구현된 미니 사운드 시스템  
- fire() : 로딩 완료 시 불타는 듯한 음  
- beep(freq, dur) : 단일 비프  
- toggle() : 음소거 토글 + 버튼 상태 갱신  

로딩 시뮬레이션
```javascript
const timer = setInterval(()=>{
  load = Math.min(100, load + (load<75? Math.random()*8 : Math.random()*3 + 1));
  fill.style.width = load + '%';
  updateTokenPosition(load);

  if(!bubbleTimer) bubbleTimer = setInterval(spawnBubble, 180);
  if(load>35 && load<70) statusEl.textContent='주사위를 굴리는 중…';
  if(load>=70 && load<100) statusEl.textContent='던전 문을 여는 중…';

  if(load>=100){
    clearInterval(timer); clearInterval(rollTimer); clearInterval(bubbleTimer);
    setFace(6); updateTokenPosition(100);
    AudioMgr.fire();
    diceBar.classList.add('hidden');
    requestAnimationFrame(()=> logo.classList.add('show'));
    statusEl.textContent='로딩 완료! 터치 해서 접속하세요!';
    statusEl.classList.add('ready');
    veil.classList.add('on');
    ready = true;
  }
}, 95);
```
- 가짜 로딩 진행률을 시뮬레이션  
- 단계별 문구 자동 변경  
- 100% 도달 시  
  - 로딩바 숨김  
  - 로고 등장  
  - 사운드 재생  
  - 클릭 가능 상태로 전환  

게이트 전환 (던전 입장)
```javascript
function openGateAndEnter(){
  veil.classList.remove('on');
  intro.style.visibility = 'hidden';
  intro.style.opacity = '0';
  gate.classList.add('open');
  setTimeout(()=>{
    document.body.innerHTML =
      '<div style="display:grid;place-items:center;height:100vh;background:var(--bg);color:#fff;font-size:2.5rem;font-weight:900;">던전 입장!</div>';
  }, 720);
}
```
- 클릭 시 인트로 즉시 숨김  
- 게이트 애니메이션 실행  
- 완료 후 “던전 입장!” 화면으로 전환  


------------------------------------------------------------
### intro.css — 스타일 정의 요약
------------------------------------------------------------

| 섹션 | 설명 |
|------|------|
| :root | 색상, 강조 컬러 등 전역 변수 설정 |
| html, body | 전체 레이아웃 및 다크 배경 적용 |
| #logo | 페이드인 / 스케일 업 애니메이션 |
| .status | 로딩 상태 문구, 완료 시 크기 확대 + 깜빡임 |
| .dice-bar | 로딩바 베이스, 내부 레이어 용암 효과 |
| .token / .shadow | 주사위 크기 및 그림자 효과 |
| .gate | 게이트 상/하 패널 닫힘 애니메이션 (부드러운 블랙 그라데이션) |


------------------------------------------------------------
### 동작 흐름 요약
------------------------------------------------------------

1. 페이지 로드 → 가짜 로딩 시작  
2. 주사위 굴림 + 버블 + 상태 문구 변경  
3. 100% → 로고 등장 + 효과음 재생  
4. 터치/클릭/Enter → 인트로 숨김 + 게이트 닫힘  
5. 게이트 애니메이션 종료 후 → “던전 입장!” 화면 표시  


------------------------------------------------------------
💡 요약
------------------------------------------------------------
event.html 은 던전 게임의 인트로 씬을 담당하며,  
intro.css 는 시각적 연출과 애니메이션을 담당합니다.  
두 파일이 함께 작동하여 로딩·효과음·애니메이션·전환이 완성됩니다.

---

<h1 id="data"> 📜 게임 내 데이터

### 목록
- [스테이지](#stage)
  - [스테이지 구조 설명](#stage_des)
  - [스테이지 코드 구조](#stage_code)

- [몬스터/이벤트](#event)
  - [몬스터/이벤트 구조 설명](#event_des)
  - [몬스터/이벤트 코드 구조](#event_code)

- [아이템](#item)
  - [아이템 구조 설명](#item_des)
  - [아이템 코드 구조](#item_code)

---

<h2 id="stage">스테이지</h3>

- 숲
  - 초입부 ( 1~4스테이지, **일반** )
  - 중심 ( 5스테이지, **보스** )

- 동굴
  - 입구 ( 1~4스테이지, **일반** )
  - 깊은 곳 ( 5스테이지, **보스** )

- 스테이지 진행 순서
  > `일반 스테이지` * 4회 ▶️ 해당 테마 `보스 스테이지` ▶️ `다른 테마` 또는 `해당 테마 스테이지`

---

<h2 id="stage_des">스테이지 구조 설명</h3>

|값|설명|
|---|---|
|id|스테이지 id|
|name|스테이지 이름|
|description|스테이지 설명|
|randomEvent|일어날 수 있는 이벤트|
|nextStages|다음 스테이지|


- randomEvent
  - eventID : 몬스터/이벤트 id
  - weight: 가중치 (확률)

---

<h2 id="stage_code">스테이지 코드 구조</h3>

```javascript
{
    id: "forest_enter",
    name: "숲 초입부",
    description: "",
    // 이벤트 확률
    // eventID -> ALL_EVENTS 의 이벤트 중 하나
    // weight -> 이벤트가 나올 확률 ( 가중치 )
    randomEvent: [
        { eventID: "mystery_merchant", weight: 10 },
        { eventID: "spider", weight: 45 },
        { eventID: "wolf", weight: 45 },
    ],

    nextStages: ["forest_enter", "forest_ center"],
}
```

---

<h2 id="event">몬스터/이벤트 ( 등장 확률 )</h3>

- 숲 초입부
  - `거미 [45%]`
  - `늑대 [45%]`
  - `수상한 상인 [10%]`

- 숲의 중심 
  - `우두머리 늑대 [50%]`
  - `곰 [50%]`

- 동굴 입구
  - `고블린 [90%]`
  - `수상한 상인 [10%]`

- 동굴 깊은 곳
  - `오크 [100%]`

---

<h2 id="event_des">몬스터/이벤트 구조 설명</h3>

|값|설명|
|---|---|
|id|몬스터/이벤트 id|
|name|몬스터/이벤트 이름|
|baseStats|기본 스탯|
|reward|보상|

- reward
  - goldRange : 획득 골드 범의
    - min : 골드 최솟값
    - max : 골드 최댓값
  - itemIds : 드랍하는 아이템들과 확률
    - itemID : 아이템 id
    - weight: 가중치 (확률)

---

<h2 id="event_code">몬스터/이벤트 코드 구조</h3>

```javascript
// 몬스터 구조 예시
{
    id: "goblin",
    name: "고블린",

    baseStats: {
        baseHp: 10,
        baseAttack: 3,
        baseDefense: 3,
    },

    reward: {
        goldRange: {
            min: 1,
            max: 5
        },

        itemIds: [
            { itemID: "small_potion", weight: 45 },
            { itemID: "str_potion", weight: 5 },
            { itemID: null, weigth: 50 },
        ]
    }
}
```

```javascript
// 이벤트 구조 예시
{
    id: "mystery_merchant",
    name: "수상한 상인",

    // 등장하는 아이템들과 확률
    itemIds: [
        { itemID: "medium_potion", weight: 70 },
        { itemID: "large_potion", weight: 20 },
        { itemID: "str_potion", weight: 10 },
    ]
}
```
---

<h2 id="item">아이템</h3>

- `소형 물약`
  - 체력을 5 ~ 10 사이 값만큼 회복함

- `중형 물약`
  - 체력을 15 ~ 25 사이 값만큼 회복함

- `대형 물약`
  - 체력을 40 ~ 50 사이 값만큼 회복함

- `수상한 힘의 물약`
  - 힘 스탯(공격력)이 1 ~ 5 사이 값만큼 오르거나 떨어짐

---

<h2 id="item_des">아이템 구조 설명</h3>

|값|설명|
|---|---|
|id|아이템 id|
|name|아이템 이름|
|description|아이템 설명|
|type|아이템 분류 ( ex : consumable, weapon 등 )|
|priceRange|가격 범위|
|effect|아이템 효과|


- effect (아이템 효과)
  - stat : 영향주는 부분
  - valueDrops : 영향주는 값, 확률
  - direction : 효과 적용 방향
    - "RANDOM"     :  + 또는 - 중 50% 확률로 결정
    - "POSITIVE"   :  항상 +
    - "NEGATIVE"   :  항상 -

---

<h2 id="item_code">코드 예시</h3>

```javascript
{
  id: "str_potion",
  name: "수상한 힘의 물약",
  description: "1 ~ 5 만큼 힘 수치가 오르거나 내려갑니다.",
  type: "consumable",
  priceRange: {
      minPrice: 10,
      maxPrice: 15,
  },
  effect: { 
      stat: "str",

      direction: "RANDOM",

      valueDrops: [
          { amount: 1, weigth: 25 },
          { amount: 2, weight: 40 },
          { amount: 3, weight: 20 },
          { amount: 4, weight: 10 },
          { amount: 5, weigth: 5 }
      ]
  },
}
```

---

<h1 id='logic'> 💻 핵심 로직 기능 설명 </h1>

## **1. HTML 연결**

이 로직이 정상적으로 작동하려면, 최종 HTML에 **다음 id들이 반드시 존재**해야 합니다.

* id="main-button": 메인 행동 버튼 (탐험하기, 공격하기, 다시 시작하기)  
* id="inventory-button": 인벤토리 열기 버튼  
* id="player-stats": 플레이어 정보 (HP, 스탯, 골드, 인벤토리, 스테이지)가 표시될 영역  
* id="dice-result": 게임 로그, 몬스터 정보, 상점/인벤토리 아이템 목록이 표시될 메인 화면  
* id="main-title": 현재 스테이지 이름 (예: "숲 초입부")이 표시될 제목

## **2\. 핵심 변수 및 데이터**

### **player**

플레이어의 현재 상태 (체력, 공격력, 방어력, 돈, 인벤토리)를 저장하는 객체입니다.
~~~js
let player \= {  
    hp: 100,  
    maxHp: 100,  
    attack: 10,  
    defense: 5,  
    gold: 0,  
    inventory: \[\]   
};
~~~
### **gameState**

플레이어의 현재 행동 상태를 저장하여 버튼 동작을 제어합니다. (탐험중, 전투중, 상점, 인벤토리 등)
~~~js
let gameState; // 'START', 'EXPLORING', 'COMBAT', 'SHOPPING', 'INVENTORY', 'GAME\_OVER'
~~~
### **스테이지 진행 변수**

플레이어의 현재 스테이지 위치와 레벨을 추적합니다.
~~~js
let currentAreaID;    // 현재 지역 (예: 'forest\_enter')  
let stageLevel;         // 현재 지역 내 레벨 (예: 1, 2, 3, 4\)  
let currentStageData;   // 현재 지역의 데이터 (ALL\_STAGES\[...\])
~~~
### **STAGE\_PROGRESSION\_MAP**

기획에 맞춘 스테이지 순서와 레벨(전투 횟수)을 정의한 핵심 데이터입니다.
~~~js
const STAGE\_PROGRESSION\_MAP \= {  
    'forest\_enter': { nextArea: 'forest\_center', levels: 4 }, // 1\~4 스테이지  
    'forest\_center': { nextArea: 'cave\_enter', levels: 1 },    // 5 스테이지 (보스)  
    'cave\_enter': { nextArea: 'cave\_deep', levels: 4 },  
    'cave\_deep': { nextArea: 'GAME\_CLEAR', levels: 1 }  
};
~~~
## **3\. 핵심 기능별 함수 설명**

### **가. 게임 시작 및 버튼 제어**

#### **document.addEventListener('DOMContentLoaded', ...)**

HTML 로딩이 완료되면 initializeDOMElements()로 HTML 요소들을 연결하고, handleMainAction과 handleInventoryAction 함수를 각 버튼의 onclick 이벤트에 할당합니다.
~~~js
document.addEventListener('DOMContentLoaded', (event) \=\> {  
    initializeDOMElements();  
      
    if (buttonEl) {  
        buttonEl.onclick \= handleMainAction;  
    } else {  
        console.error("메인 버튼 (id='main-button')을 찾을 수 없습니다.");  
    }  
      
    if (inventoryButtonEl) {  
        inventoryButtonEl.onclick \= handleInventoryAction;  
    } else {  
        console.error("인벤토리 버튼 (id='inventory-button')을 찾을 수 없습니다.");  
    }

    gameState \= 'START';  
    updateMainUI("주사위 굴리기 RPG", "게임을 시작하세요\!", "게임 시작");  
    setUIForAction(true, true);   
});
~~~
#### **startGame()**

'게임 시작' 또는 '다시 시작하기' 버튼을 누르면 호출됩니다. player 객체와 스테이지 진행 변수(currentAreaID, stageLevel)를 초기화합니다.

// 플레이어 스탯(ATK, DEF) 및 스테이지 초기화  
~~~js
function startGame() {
    player = {
        hp: 100, 
        maxHp: 100, 
        attack: 10, 
        defense: 5, 
        gold: 0, 
        inventory: [] 
    };

    currentAreaID = 'forest_enter';
    currentStageData = findDataById(ALL_STAGES, currentAreaID);
    setMainActionListeners();
    stageLevel = 1;

    gameState = 'EXPLORING';

    updatePlayerStatsUI();
    updateMainUI(currentStageData.name, "무엇을 하시겠습니까?", "탐험하기");
    setUIForAction(true, true); 
}
~~~
#### **handleMainAction() (메인 버튼)**

gameState에 따라 '탐험', '공격', '재시작' 등 각기 다른 함수를 호출하는 메인 컨트롤러입니다.
~~~js
function handleMainAction() {
    switch (gameState) {
        case 'START':
        case 'GAME_OVER':
            startGame();
            break;
        case 'EXPLORING':
            triggerRandomEvent();
            break;
        case 'DICE_ROLL_ATK':
            rollDiceATK();
            break;
        case 'DICE_ROLL_DEF':
            rollDiceDEF();
            break;
        case 'COMBAT':
            attackMonster();
            break;
        case 'AREA_CLEAR':
            break;
    }
}
~~~
#### **handleInventoryAction() (인벤토리 버튼)**

gameState가 'COMBAT'(전투)이 아닐 때 displayInventory() 함수를 호출하여 인벤토리를 엽니다.
~~~js
function handleInventoryAction() {  
    if (gameState \=== 'EXPLORING' || gameState \=== 'START' || gameState \=== 'GAME\_OVER') {  
        displayInventory();  
    }  
}
~~~
### **나. 탐험 및 전투**

#### **triggerRandomEvent()**

'탐험하기' 시 호출됩니다. 현재 스테이지(currentStageData)의 randomEvent 목록에서 getWeightedRandom() 헬퍼를 이용해 이벤트를 하나 뽑습니다.

* baseStats 속성이 있으면 몬스터로 간주, gameState를 COMBAT으로 변경.  
* 아니면 상점으로 간주, gameState를 SHOPPING으로 변경.

// 몬스터 만날 시 보너스 스탯 획득 화면 이동 및 baseStats \-\> currentHp 등으로 복사  
~~~js
function triggerRandomEvent() {
    const eventRoll = getWeightedRandom(currentStageData.randomEvent); 
    const eventData = findDataById(ALL_EVENTS, eventRoll.eventID);
    if (!eventData) {
        console.error(`이벤트 데이터를 찾을 수 없습니다: ${eventRoll.eventID}`);
        updateMainUI(currentStageData.name, "아무것도 발견하지 못했다.", "탐험하기");
        return;
    }
    if (eventData.baseStats) {
        gameState = 'DICE_ROLL'; 
        // 몬스터 정보 초기화 (주사위 굴림 중에는 보너스/패널티를 받지 않으므로 리셋)
        resetCombatDiceBonus(); 
        
        currentEvent = {
            ...eventData, 
            currentHp: eventData.baseStats.baseHp,
            attack: eventData.baseStats.baseAttack,
            defense: eventData.baseStats.baseDefense
        };
        
        displayDiceRollScreen(); // ATK 주사위 굴림 화면 표시
    } 
    else if (eventData.id === "mystery_merchant" || eventData.id === "shop") {
        gameState = 'SHOPPING';
        currentEvent = { ...eventData };
        displayShopUI(); 
    }
}
~~~
#### **attackMonster()**

'공격하기' 시 호출됩니다. (공격력 \- 방어력) 공식을 적용하여 플레이어와 몬스터가 서로 HP를 깎습니다. (최소 1 데미지)

// (공격력 \- 방어력) 전투 공식 적용  
~~~js
function attackMonster() {
    let logMessage = "";

    // 1. 플레이어 공격
    const playerRawDamage = getRandomInt(player.attack - 2, player.attack + 2);
    const monsterDefense = currentEvent.defense;
    const playerDamage = Math.max(1, playerRawDamage - monsterDefense); // 최소 1 데미지

    currentEvent.currentHp -= playerDamage;
    logMessage += `[플레이어] ${currentEvent.name}에게 ${playerDamage}의 피해! (방어: ${monsterDefense})`;

    if (currentEvent.currentHp <= 0) {
        winCombat(); 
        return;
    }

    // 2. 몬스터 공격
    const monsterRawDamage = getRandomInt(currentEvent.attack - 1, currentEvent.attack + 1);
    const playerDefense = player.defense;
    const monsterDamage = Math.max(1, monsterRawDamage - playerDefense); 

    player.hp -= monsterDamage;
    logMessage += `<br>[${currentEvent.name}] 플레이어에게 ${monsterDamage}의 피해! (방어: ${playerDefense})`;

    if (player.hp <= 0) {
        player.hp = 0;
        loseGame();
    } else {
        // 전투 지속
        updatePlayerStatsUI();
        updateMainUI('전투 중!', `${currentEvent.name} (HP: ${currentEvent.currentHp})`, "공격하기");
        resultEl.innerHTML = logMessage;
        setUIForAction(true, false); 
    }
}
~~~
#### **winCombat()**

전투 승리 시 호출됩니다.

1. 몬스터의 reward (골드, 아이템)를 계산하여 player 객체에 추가합니다. (itemID: null은 "아이템 없음"으로 처리)  
2. 스테이지 시작할 때 부여된 보너스 스탯 초기화
3. stageLevel을 1 올립니다.  
4. STAGE_PROGRESSION_MAP을 확인하여 stageLevel이 최대치를 넘었으면 다음 지역(nextArea)으로 이동시킵니다.  
5. 만약 nextArea가 'GAME_CLEAR'이면 winGame()을 호출합니다.

// 스테이지 진행 로직 \+ itemID: null 처리 
~~~js
function winCombat() {
    // 보상 획득 로직
    const reward = currentEvent.reward;

    let gainedGold = 0;
    let resultMessage = `${currentEvent.name} 처치!`;
    if (reward.goldRange) {
        gainedGold = getRandomInt(reward.goldRange.min, reward.goldRange.max);
        player.gold += gainedGold;
        resultMessage += `<br>(+${gainedGold} Gold)`;
    }

    if (reward.itemIds && reward.itemIds.length > 0) {
        const droppedItemInfo = getWeightedRandom(reward.itemIds); 
        if (droppedItemInfo && droppedItemInfo.itemID) {
            const itemData = findDataById(ALL_ITEMS, droppedItemInfo.itemID);
            if (itemData) {
                player.inventory.push(itemData.id); 
                resultMessage += `<br>(${itemData.name} 획득!)`;
            }
        } else {
            resultMessage += `<br>(아이템 없음)`;
        }
    }

    resetCombatDiceBonus();
    
    currentEvent = null; 
    
    // 다음 지역으로 진행해야 하는지 확인합니다.
    const areaInfo = STAGE_PROGRESSION_MAP[currentAreaID];
    const nextStageLevel = stageLevel + 1; // 다음 스테이지 레벨 계산
    
    if (nextStageLevel > areaInfo.levels) {
        // 현재 지역의 모든 레벨(몬스터)을 클리어했습니다.
        // 다음 지역으로 진행합니다.
        
        resultMessage += `<br><br><b>🎉 지역 클리어! 🎉</b><br>다음 지역으로 이동합니다...`;
        gameState = 'AREA_CLEAR';
        
        // 현재 스테이지 레벨을 유지한 채로 UI 업데이트 (아직 증가시키지 않음)
        updatePlayerStatsUI();
        updateMainUI(currentStageData.name, resultMessage, "다음 지역으로");
        setUIForAction(true, false);
        
        // 버튼 클릭 이벤트를 일시적으로 변경
        const originalHandler = buttonEl.onclick;
        buttonEl.onclick = () => {
            buttonEl.onclick = originalHandler; // 원래 핸들러로 복구
            stageLevel++; // 이제 스테이지 레벨 증가
            advanceStage();
        };
        
        return;
    } else {
        // 현재 지역 내 다음 레벨로 진행합니다.
        stageLevel++; // 여기서 스테이지 레벨 증가
        resultMessage += `<br><br>다음 스테이지 (${stageLevel}/${areaInfo.levels}) 로 이동합니다.`;
        gameState = 'EXPLORING';
    }
    
    updatePlayerStatsUI();
    updateMainUI(currentStageData.name, resultMessage, "탐험하기");
    setUIForAction(true, true); 
}
~~~
### **다. 인벤토리 및 아이템 사용**

#### **displayInventory() / exitInventory()**

displayInventory: gameState를 INVENTORY로 바꾸고 dice-result 영역에 player.inventory 목록을 버튼으로 생성합니다. '탐험으로 돌아가기' 버튼도 함께 생성합니다.  
exitInventory: gameState를 EXPLORING (또는 GAME\_OVER)으로 되돌리고 메인 UI를 복구합니다.  
~~~js
function displayInventory() {  
    gameState \= 'INVENTORY';  
    titleEl.textContent \= '인벤토리';  
    resultEl.innerHTML \= '';   
    setUIForAction(false, false); // 메인 버튼 숨김

    // ... (인벤토리 아이템 버튼 생성 로직) ...  
      
    // 닫기 버튼 생성  
    const exitButton \= document.createElement('button');  
    exitButton.textContent \= '탐험으로 돌아가기';  
    exitButton.className \= 'exit-button';  
    exitButton.onclick \= () \=\> exitInventory();   
    resultEl.appendChild(exitButton);  
}
~~~

~~~js
function exitInventory() {
    if (player.hp <= 0) {
        loseGame(); 
    } else {
        gameState = 'EXPLORING';
        updateMainUI(currentStageData.name, '탐험을 계속합니다.', '탐험하기');
        setUIForAction(true, true); 
    }
}
~~~
#### **useItem()**

인벤토리에서 아이템 버튼 클릭 시 호출됩니다.

1. player.inventory 배열에서 아이템 ID를 1개 제거합니다.  
2. ALL\_ITEMS 데이터에서 해당 아이템의 effect를 찾습니다.  
3. effect의 valueDrops(가중치) 또는 value(범위)를 참조하여 값을 계산합니다.  
4. effect의 stat ('hp' 또는 'str')에 따라 player.hp 또는 player.attack 값을 변경합니다.  
5. 화면을 갱신합니다.

// valueDrops (가중치) 또는 minValue/maxValue (범위)에 따라 효과 적용  
~~~js
function useItem(itemToUse) {  
    // 1\. 인벤토리에서 아이템 제거  
    const itemIndex \= player.inventory.indexOf(itemToUse.id);  
    if (itemIndex \=== \-1) { /\* (오류 처리) \*/ return; }  
    player.inventory.splice(itemIndex, 1); 

    const effect \= itemToUse.effect;  
    let value \= 0;

    // valueDrops (가중치)가 있는지 확인  
    if (effect.valueDrops) {  
        const drop \= getWeightedRandom(effect.valueDrops);  
        value \= drop.amount;  
    }   
    // valueDrops가 없으면 minValue/maxValue 사용  
    else if (effect.value) {   
        value \= getRandomInt(effect.value.minValue, effect.value.maxValue);  
    }

    let changeValue \= 0;  
    // ... (direction에 따른 changeValue 계산) ...

    // 스탯 적용  
    if (effect.stat \=== "hp") {  
        player.hp \+= changeValue;  
        if (player.hp \> player.maxHp) player.hp \= player.maxHp;   
        effectMessage \= \`HP가 ${changeValue}만큼 회복되었습니다. (현재 HP: ${player.hp})\`;  
    }   
    // 'str' 스탯을 'player.attack'에 적용  
    else if (effect.stat \=== "str") {  
        player.attack \+= changeValue;  
        effectMessage \= \`공격력(ATK)이 ${changeValue}만큼 변동했습니다. (현재 ATK: ${player.attack})\`;  
    }

    alert(effectMessage);  
    updatePlayerStatsUI();   
    displayInventory(); // 인벤토리 새로고침  
}
~~~
### **라. 상점 기능**

#### **displayShopUI() / exitShop()**

triggerRandomEvent에서 상점 만났을 때 호출됩니다. dice-result 영역에 아이템 구매 버튼과 '가게 나가기' 버튼을 생성합니다.
~~~js
function displayShopUI() {  
    titleEl.textContent \= currentEvent.name;   
    resultEl.innerHTML \= '';   
    setUIForAction(false, false); // 메인 버튼 숨김

    // ... (판매 아이템 버튼 생성 로직) ...

    // 나가기 버튼 생성  
    const exitButton \= document.createElement('button');  
    exitButton.textContent \= '가게 나가기';  
    exitButton.className \= 'exit-button';   
    exitButton.onclick \= () \=\> exitShop();   
    resultEl.appendChild(exitButton);  
}
~~~
#### **buyItem()**

상점에서 아이템 구매 버튼 클릭 시 호출됩니다. player.gold와 아이템 가격(itemToBuy.price)을 비교하여 구매를 처리합니다.
~~~js
function buyItem(itemToBuy) {  
    if (player.gold \>= itemToBuy.price) {  
        player.gold \-= itemToBuy.price;  
        player.inventory.push(itemToBuy.id);  
        updatePlayerStatsUI();   
        alert(\`${itemToBuy.name}을(를) 구매했습니다.\`);  
    } else {  
        alert('골드가 부족합니다.');  
    }  
}  
~~~
