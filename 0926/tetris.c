#define _CRT_SECURE_NO_WARNINGS
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <stdbool.h>
#include <time.h>
#include <windows.h>
#include <conio.h>

#define WIDTH 10
#define HEIGHT 20
#define BORDER 1
#define BOARD_W (WIDTH + 2*BORDER)
#define BOARD_H (HEIGHT + 2*BORDER)

static const int LINE_SCORE[5] = {0, 100, 300, 500, 800};
#define SOFT_DROP_SCORE 1
#define HARD_DROP_SCORE 2


static const char *TET[7][4] = {
    // I
    {
        "...."
        "XXXX"
        "...."
        "....",
        "..X."
        "..X."
        "..X."
        "..X.",
        "...."
        "XXXX"
        "...."
        "....",
        ".X.."
        ".X.."
        ".X.."
        ".X.."
    },
    // O
    {
        ".XX."
        ".XX."
        "...."
        "....",
        ".XX."
        ".XX."
        "...."
        "....",
        ".XX."
        ".XX."
        "...."
        "....",
        ".XX."
        ".XX."
        "...."
        "...."
    },
    // T
    {
        ".X.."
        "XXX."
        "...."
        "....",
        ".X.."
        ".XX."
        ".X.."
        "....",
        "...."
        "XXX."
        ".X.."
        "....",
        ".X.."
        "XX.."
        ".X.."
        "...."
    },
    // S
    {
        "..XX"
        ".XX."
        "...."
        "....",
        ".X.."
        ".XX."
        "..X."
        "....",
        "..XX"
        ".XX."
        "...."
        "....",
        ".X.."
        ".XX."
        "..X."
        "...."
    },
    // Z
    {
        ".XX."
        "..XX"
        "...."
        "....",
        "..X."
        ".XX."
        ".X.."
        "....",
        ".XX."
        "..XX"
        "...."
        "....",
        "..X."
        ".XX."
        ".X.."
        "...."
    },
    // J
    {
        "X..."
        "XXX."
        "...."
        "....",
        ".XX."
        ".X.."
        ".X.."
        "....",
        "...."
        "XXX."
        "..X."
        "....",
        ".X.."
        ".X.."
        "XX.."
        "...."
    },
    // L
    {
        "..X."
        "XXX."
        "...."
        "....",
        ".X.."
        ".X.."
        ".XX."
        "....",
        "...."
        "XXX."
        "X..."
        "....",
        "XX.."
        ".X.."
        ".X.."
        "...."
    }
};

// 색상
static const WORD COLORS[7] = {
    FOREGROUND_BLUE | FOREGROUND_INTENSITY,                    // I
    FOREGROUND_RED | FOREGROUND_GREEN | FOREGROUND_INTENSITY,  // O (Yellow)
    FOREGROUND_RED | FOREGROUND_BLUE | FOREGROUND_INTENSITY,   // T (Magenta)
    FOREGROUND_GREEN | FOREGROUND_INTENSITY,                   // S
    FOREGROUND_RED | FOREGROUND_INTENSITY,                     // Z
    FOREGROUND_BLUE,                                           // J
    FOREGROUND_RED                                             // L
};

static int board[BOARD_H][BOARD_W]; // 0=빈칸, -1=벽, 1..7=고정블럭(색 인덱스)
static int curType, curRot, curX, curY; // 현재 조각
static int nextType;                     // 다음 조각
static int score=0, lines=0, level=1;
static bool paused=false, gameOver=false;

static HANDLE hOut;

static void hideCursor(void){
    CONSOLE_CURSOR_INFO ci = {1, FALSE};
    SetConsoleCursorInfo(hOut, &ci);
}
static void gotoxy(int x, int y){
    COORD c; c.X = (SHORT)x; c.Y = (SHORT)y;
    SetConsoleCursorPosition(hOut, c);
}
static void setColor(WORD attr){
    SetConsoleTextAttribute(hOut, attr);
}

static void clearBoard(void){
    for(int y=0;y<BOARD_H;y++){
        for(int x=0;x<BOARD_W;x++){
            if (x==0 || x==BOARD_W-1 || y==BOARD_H-1) board[y][x] = -1; // 벽
            else board[y][x] = 0;
        }
    }
}

static bool hitTest(int type, int rot, int px, int py){
    const char* m = TET[type][rot];
    for(int dy=0; dy<4; dy++){
        for(int dx=0; dx<4; dx++){
            if (m[dy*4 + dx]=='X'){
                int x = px + dx;
                int y = py + dy;
                if (x<0 || x>=BOARD_W || y<0 || y>=BOARD_H) return true;
                if (board[y][x]!=0) return true;
            }
        }
    }
    return false;
}

static void lockPiece(void){
    const char* m = TET[curType][curRot];
    for(int dy=0; dy<4; dy++){
        for(int dx=0; dx<4; dx++){
            if (m[dy*4+dx]=='X'){
                int x = curX + dx;
                int y = curY + dy;
                if (y>=0 && y<BOARD_H && x>=0 && x<BOARD_W)
                    board[y][x] = curType+1;
            }
        }
    }
}

static int clearLines(void){
    int cleared = 0;
    for(int y=BORDER; y<HEIGHT+BORDER; y++){
        bool full = true;
        for(int x=BORDER; x<WIDTH+BORDER; x++){
            if (board[y][x]==0){ full=false; break; }
        }
        if (full){
            cleared++;
            // 한 줄 내리기
            for(int yy=y; yy>0; yy--){
                for(int xx=BORDER; xx<WIDTH+BORDER; xx++){
                    board[yy][xx] = board[yy-1][xx];
                }
            }
            // 최상단 내부 라인 초기화
            for(int xx=BORDER; xx<WIDTH+BORDER; xx++) board[BORDER-1][xx]=0;
        }
    }
    return cleared;
}

static void spawnPiece(void){
    curType = nextType;
    nextType = rand()%7;
    curRot = 0;
    curX = BORDER + (WIDTH/2) - 2;
    curY = 0;
    if (hitTest(curType, curRot, curX, curY)){
        gameOver = true;
    }
}

static void drawCellAt(int x, int y, int val){

    int sx = 2 + (x - BORDER) * 2;
    int sy = 1 + (y - BORDER);
    if (x==0 || x==BOARD_W-1) { sx = 0 + x*2; sy = 1 + (y - BORDER); }

    gotoxy(sx, sy);

    if (val==-1){ // 벽
        setColor(FOREGROUND_BLUE|FOREGROUND_GREEN|FOREGROUND_RED);
        printf("██");
        return;
    }
    if (val==0){
        setColor(0);
        printf("  ");
        return;
    }
    setColor(COLORS[(val-1)%7]);
    printf("██");
}

static void drawBoard(void){
    for(int y=0; y<BOARD_H; y++){
        for(int x=0; x<BOARD_W; x++){
            drawCellAt(x, y, board[y][x]);
        }
    }
}

static void drawPieceGhostAndCurrent(void){

    int gy = curY;
    while(!hitTest(curType, curRot, curX, gy+1)) gy++;


    const char* m = TET[curType][curRot];
    for(int dy=0; dy<4; dy++){
        for(int dx=0; dx<4; dx++){
            if (m[dy*4+dx]=='X'){
                int x = curX+dx, y = gy+dy;
                if (y>=0 && y<BOARD_H && x>=0 && x<BOARD_W){
                    gotoxy(2 + (x-BORDER)*2, 1 + (y-BORDER));
                    setColor(FOREGROUND_BLUE|FOREGROUND_GREEN|FOREGROUND_RED);
                    printf("··");
                }
            }
        }
    }

    setColor(COLORS[curType]);
    for(int dy=0; dy<4; dy++){
        for(int dx=0; dx<4; dx++){
            if (m[dy*4+dx]=='X'){
                int x = curX+dx, y = curY+dy;
                if (y>=0 && y<BOARD_H && x>=0 && x<BOARD_W){
                    gotoxy(2 + (x-BORDER)*2, 1 + (y-BORDER));
                    printf("██");
                }
            }
        }
    }
}

static void drawUI(void){
    int panelX = 2 + (WIDTH+2)*2 + 2;
    setColor(FOREGROUND_RED|FOREGROUND_GREEN|FOREGROUND_BLUE|FOREGROUND_INTENSITY);
    gotoxy(panelX, 1);  printf("Score : %d   ", score);
    gotoxy(panelX, 2);  printf("Lines : %d   ", lines);
    gotoxy(panelX, 3);  printf("Level : %d   ", level);

    gotoxy(panelX, 5);  printf("Next:");
    const char* nm = TET[nextType][0];
    for(int dy=0; dy<4; dy++){
        gotoxy(panelX, 6+dy);
        for(int dx=0; dx<4; dx++){
            if (nm[dy*4+dx]=='X'){ setColor(COLORS[nextType]); printf("██"); }
            else { setColor(0); printf("  "); }
        }
    }

    setColor(FOREGROUND_GREEN|FOREGROUND_INTENSITY);
    gotoxy(panelX, 12); printf("Controls");
    setColor(FOREGROUND_RED|FOREGROUND_GREEN|FOREGROUND_BLUE);
    gotoxy(panelX, 13); printf("←/→: Move");
    gotoxy(panelX, 14); printf("↓   : Soft drop");
    gotoxy(panelX, 15); printf("↑   : Rotate");
    gotoxy(panelX, 16); printf("Space: Hard drop");
    gotoxy(panelX, 17); printf("P    : Pause");
    gotoxy(panelX, 18); printf("Q    : Quit");

    if (paused){
        gotoxy(panelX, 20); setColor(FOREGROUND_RED|FOREGROUND_INTENSITY);
        printf("== PAUSED ==     ");
    } else if (gameOver){
        gotoxy(panelX, 20); setColor(FOREGROUND_RED|FOREGROUND_INTENSITY);
        printf("== GAME OVER ==  ");
    } else {
        gotoxy(panelX, 20); printf("                 ");
    }
}

static void hardDrop(void){
    int dist = 0;
    while(!hitTest(curType, curRot, curX, curY+1)){ curY++; dist++; }
    score += dist * HARD_DROP_SCORE;
}

static void softDropStep(void){
    if (!hitTest(curType, curRot, curX, curY+1)){
        curY++; score += SOFT_DROP_SCORE;
    }
}

static void tryRotateCW(void){
    int nr = (curRot+1) % 4;
    if (!hitTest(curType, nr, curX, curY)) { curRot = nr; return; }
    if (!hitTest(curType, nr, curX-1, curY)) { curX--; curRot = nr; return; }
    if (!hitTest(curType, nr, curX+1, curY)) { curX++; curRot = nr; return; }
    // 실패 시 회전 안 함
}

static void processInput(void){
    if (!_kbhit()) return;
    int ch = _getch();
    if (ch==0 || ch==224){
        int k = _getch();
        if (paused || gameOver) return;
        if (k==75){ // Left
            if (!hitTest(curType, curRot, curX-1, curY)) curX--;
        } else if (k==77){ // Right
            if (!hitTest(curType, curRot, curX+1, curY)) curX++;
        } else if (k==80){ // Down (soft)
            softDropStep();
        } else if (k==72){ // Up (rotate)
            tryRotateCW();
        }
    } else {
        if (ch=='p' || ch=='P'){ paused = !paused; }
        else if (ch=='q' || ch=='Q'){ gameOver = true; }
        else if (!paused && !gameOver && ch==' '){
            hardDrop();
        }
    }
}

static void update(void){
    static DWORD lastTick = 0;
    DWORD now = GetTickCount();
    int fallDelay = 600 - (level-1)*50; // 레벨 증가 시 하강속도 증가
    if (fallDelay < 100) fallDelay = 100;

    if (now - lastTick >= (DWORD)fallDelay){
        lastTick = now;
        if (!paused && !gameOver){
            if (!hitTest(curType, curRot, curX, curY+1)){
                curY++;
            } else {
                // 고정
                lockPiece();
                int c = clearLines();
                if (c>0){
                    score += LINE_SCORE[c] * level;
                    lines += c;
                    int newLevel = lines/10 + 1;
                    if (newLevel > level) level = newLevel;
                }
                spawnPiece();
            }
        }
    }
}

static void render(void){
    drawBoard();
    if (!gameOver) drawPieceGhostAndCurrent();
    drawUI();
}

int main(void){
    // 콘솔 준비
    hOut = GetStdHandle(STD_OUTPUT_HANDLE);
    hideCursor();
    srand((unsigned)time(NULL));

    // 보드 초기화
    clearBoard();
    nextType = rand()%7;
    spawnPiece();

    // 게임 루프
    while(!gameOver){
        processInput();
        update();
        render();
        Sleep(16); // 약 60fps
    }

    // 게임오버 메시지
    setColor(FOREGROUND_RED|FOREGROUND_INTENSITY);
    gotoxy(2, HEIGHT + 3);
    printf("Final Score: %d   Press any key to exit...", score);
    setColor(FOREGROUND_RED|FOREGROUND_GREEN|FOREGROUND_BLUE);
    _getch();
    return 0;
}
