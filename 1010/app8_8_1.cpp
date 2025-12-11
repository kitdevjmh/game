// app8_8_1.cpp  (UTF-8 / MinGW / 외부 콘솔 권장)
// 빌드: g++ app8_8_1.cpp -o app8_8_1.exe

#define _CRT_SECURE_NO_WARNINGS
#include <stdio.h>
#include <stdlib.h>
#include <conio.h>
#include <time.h>
#include <string.h>
#include <windows.h>

// ====== 설정 ======
#define COLW    4      // 전각(2칸) 심볼용 셀 폭 (문자+패딩)
#define START_X 3      // 릴 좌상단 X
#define START_Y 7      // 릴 좌상단 Y
#define ROWS    3
#define COLS    3

// ====== 프로토타입 ======
void intro_screen(void);
void display_rule(void);
void draw_reel_grid(int c, int r);
void reel_series(int r[][3]);
void gotoxy(int x, int y);
int  game_progress(int money);
void display_reel(const char* rc[], int r[][3], int index);
void clear_text(void);
void game_control(const char* reel[], int reel_num[][3], int *money);
int  return_money(int r[], int betting, int *case_num);
void get_console_size(int* outW, int* outH);   // 선언을 위로
static void do_doubleup(int *pay);   // ← 이 한 줄 추가

// ==== Lucky Meter(운빨 게이지) 전역 ====
static int  G_LUCKY = 0;         // 0~100
static int  G_LUCKY_READY = 0;   // 1이면 다음 스핀 보장/부스트
static int  G_LOSS_STREAK = 0;   // 연속 패배 카운트
static int GAUGE_X = 33, GAUGE_Y = 25;

// Lucky/입력 유틸 (선언)
static void clear_line_at(int y);
static void draw_lucky_meter(int x, int y);
static int  ask_yes_no(int x, int y, const char* question);

// ====== 콘솔/출력 유틸 ======
static void set_utf8_console(void) {
    SetConsoleOutputCP(CP_UTF8);
    SetConsoleCP(CP_UTF8);
}

static int cell_width_utf8(const char* s) {
    return (!strcmp(s,"★") || !strcmp(s,"♠") || !strcmp(s,"◆") ||
            !strcmp(s,"♥") || !strcmp(s,"♣") || !strcmp(s,"○")) ? 2 : 1;
}
static void print_cell(const char* s) {
    int w = cell_width_utf8(s);
    int pad = COLW - w; if (pad < 0) pad = 0;
    printf("%s", s);
    while (pad--) putchar(' ');
}
// 천단위 콤마
static void format_money(int n, char out[32]) {
    int neg = (n < 0); unsigned int v = (unsigned int)(neg ? -n : n);
    char buf[32]; int bi=0, count=0;
    if (v == 0) buf[bi++]='0';
    while (v > 0) { if(count==3){buf[bi++]=',';count=0;} buf[bi++]=(char)('0'+(v%10)); v/=10; count++; }
    if (neg) buf[bi++]='-';
    int i=0; while (bi>0) out[i++]=buf[--bi]; out[i]='\0';
}

// ====== 콘솔 사이즈/커서 ======
static int utf8_disp_width(const char* s) {
    int w = 0;
    for (const unsigned char* p = (const unsigned char*)s; *p; ++p) {
        if ( (*p & 0xC0) != 0x80 ) w++;
    }
    return w;
}
void get_console_size(int* outW, int* outH) {
    CONSOLE_SCREEN_BUFFER_INFO csbi;
    GetConsoleScreenBufferInfo(GetStdHandle(STD_OUTPUT_HANDLE), &csbi);
    *outW = csbi.srWindow.Right - csbi.srWindow.Left + 1;
    *outH = csbi.srWindow.Bottom - csbi.srWindow.Top + 1;
}
void gotoxy(int x, int y)
{
    COORD Pos = { (SHORT)(x - 1), (SHORT)(y - 1) };
    SetConsoleCursorPosition(GetStdHandle(STD_OUTPUT_HANDLE), Pos);
}

// 럭키 READY가 켜져있으면 결과를 보정/부스트
static void apply_lucky_effect(int symbols[3], int bet, int *case_num, int *pay, int *used_out){
    if (!G_LUCKY_READY) { *used_out = 0; return; }
    *used_out = 1;

    if (*pay == 0) {
        // 꽝 → 최소 보장(×2)
        *pay = bet * 2;
        // 표시에 혼동 없게: '좌우대칭' 같은 무난한 패턴으로 표기
        *case_num = 8; // 좌우대칭
    } else {
        // 이미 당첨 → 2배 부스트
        *pay *= 2;
    }

    // 소모 및 초기화
    G_LUCKY_READY = 0;
    G_LUCKY = 0;
    G_LOSS_STREAK = 0;
}


// 콘솔 한 줄 지우기 (단일 정의)
static void clear_line_at(int y){
    int W,H; get_console_size(&W,&H);
    if (y < 1) y = 1; if (y > H) y = H;
    gotoxy(1,y);
    for(int i=0;i<W;i++) putchar(' ');
}

// 운빵 게이지 그리기 (고정 좌표 추천: x=30, y=2)
static void draw_lucky_meter(int x, int y){
    const int BARW = 22;
    int filled = (G_LUCKY * BARW) / 100;
    gotoxy(x, y);
    printf("LUCKY [");
    for(int i=0;i<BARW;i++) putchar(i<filled ? '#' : '.');
    // READY면 다음 판에 보장/부스트 확실하다는 문구로
    printf("] %3d%% %s   ", G_LUCKY, G_LUCKY_READY ? "READY NEXT!" : "");
}


// Y/N 질문 (하단 등 지정 좌표; Y=1, N=0)
static int ask_yes_no(int x, int y, const char* question){
    clear_line_at(y);
    gotoxy(x, y);
    printf("%s (Y/N) >", question);
    while(1){
        int ch = _getch();
        if (ch=='y' || ch=='Y') { gotoxy(x, y); printf("%s (Y/N) > Y  ", question); return 1; }
        if (ch=='n' || ch=='N') { gotoxy(x, y); printf("%s (Y/N) > N  ", question); return 0; }
    }
}

static void do_doubleup(int *pay){
    if (*pay <= 0) return;               // 당첨 아닐 때는 무시
    int W,H; get_console_size(&W,&H);
    int qy = H - 2;                      // 질문 줄
    int ry = H - 1;                      // 결과 줄

    int accept = ask_yes_no(1, qy, "더블업을 하시겠습니까?");
    if (!accept) return;

    clear_line_at(ry);
    gotoxy(1, ry); printf("더블업 결과 확인 중...");
    Sleep(400);

    int win = rand() & 1;                // 50%
    clear_line_at(ry);
    if (win) {
        *pay *= 2;                       // ★ 최종 pay 2배
        gotoxy(1, ry); printf("성공! 당첨 금액이 두 배가 되었습니다.");
    } else {
        *pay = 0;                        // 실패 → 당첨 무효
        gotoxy(1, ry); printf("실패... 이번 당첨은 무효가 됩니다.");
    }
    Sleep(600);
    clear_line_at(qy);
    clear_line_at(ry);
}


// ====== 메인 ======
int main(void)
{
    set_utf8_console();
    intro_screen();

    // 릴 심볼 (디자인: ◆★♣♥♠○)
    const char* reel[6] = { "◆", "★", "♣", "♥", "♠", "○" };

    int  i, reel_num[3][3];
    int  money = 10000;

    srand((unsigned)time(NULL));

    printf("  슬롯머신 게임\n\n");
    display_rule();

    // 게이지는 룰표 위쪽/오른쪽 여백에 (겹치지 않음)
    draw_lucky_meter(33, 25);

    gotoxy(START_X, START_Y - 2);
    printf(" 릴1  릴2  릴3");
    draw_reel_grid(COLS, ROWS);   // ← 중복 호출 제거 (한 번만)

    for (i = 0; i < 3; i++) reel_num[0][i] = rand() % 6;
    reel_series(reel_num);

    do { game_control(reel, reel_num, &money); } while (money > 0);

    gotoxy(3, 21);
    printf("게임 종료! 수고했어요 :)");
    return 0;

	// 릴 바로 아래 한 줄 띄우고 배치
	GAUGE_X = START_X;
	GAUGE_Y = START_Y + ROWS * 2 + 2;

	draw_lucky_meter(GAUGE_X, GAUGE_Y);

}

// ====== 인트로 ======
void intro_screen(void)
{
    HANDLE h = GetStdHandle(STD_OUTPUT_HANDLE);
    int W, H; get_console_size(&W, &H);
    system("cls");

    const char* LOGO[] = {
        " ███████╗██╗      ██████╗ ████████╗     ██████╗  █████╗ ███╗   ███╗███████╗",
        " ██╔════╝██║     ██╔═══██╗╚══██╔══╝    ██╔════╝ ██╔══██╗████╗ ████║██╔════╝",
        " ███████╗██║     ██║   ██║   ██║       ██║  ███╗███████║██╔████╔██║█████╗  ",
        " ╚════██║██║     ██║   ██║   ██║       ██║   ██║██╔══██║██║╚██╔╝██║██╔══╝  ",
        " ███████║███████╗╚██████╔╝   ██║       ╚██████╔╝██║  ██║██║ ╚═╝ ██║███████╗",
        " ╚══════╝╚══════╝ ╚═════╝    ╚═╝        ╚═════╝ ╚═╝  ╚═╝╚═╝     ╚═╝╚══════╝"
    };
    const int LOGO_LINES = sizeof(LOGO)/sizeof(LOGO[0]);

    int maxLogoW = 0;
    for (int i=0;i<LOGO_LINES;i++) {
        int w = utf8_disp_width(LOGO[i]);
        if (w > maxLogoW) maxLogoW = w;
    }

    int totalBlockH = LOGO_LINES + 1 + 1 + 1 + 1 + 1; // = 11
    int topY = (H - totalBlockH)/2; if (topY < 1) topY = 1;
    int logoX = (W - maxLogoW)/2 + 1; if (logoX < 1) logoX = 1;

    WORD YELLOW = 14, CYAN = 11, GREEN = 10, WHITE = 15;

    SetConsoleTextAttribute(h, YELLOW);
    for (int i=0;i<LOGO_LINES;i++) {
        gotoxy(logoX, topY + i);
        printf("%s", LOGO[i]);
    }

    const char* SUB = "S L O T   G A M E";
    int subX = (W - utf8_disp_width(SUB))/2 + 1;
    SetConsoleTextAttribute(h, CYAN);
    gotoxy(subX, topY + LOGO_LINES + 1);
    printf("%s", SUB);

    int barW = (W >= 60 ? 30 : 20);
    int loadY = topY + LOGO_LINES + 3;
    char buf[160];
    for (int i=0; i<=barW; ++i) {
        int pos = 0;
        pos += snprintf(buf+pos, sizeof(buf)-pos, "LOADING [");
        for (int j=0; j<i; ++j) pos += snprintf(buf+pos, sizeof(buf)-pos, "█");
        for (int j=i; j<barW; ++j) pos += snprintf(buf+pos, sizeof(buf)-pos, "░");
        pos += snprintf(buf+pos, sizeof(buf)-pos, "] %3d%%", (i*100)/barW);

        int loadX = (W - utf8_disp_width(buf))/2 + 1;
        SetConsoleTextAttribute(h, GREEN);
        gotoxy(loadX, loadY);
        printf("%s", buf);
        SetConsoleTextAttribute(h, WHITE);
        Sleep(45);
    }

    const char* PRESS = "★  PRESS ANY KEY TO START  ★";
    int pressY = loadY + 2;
    int pressX = (W - utf8_disp_width(PRESS))/2 + 1;
    int on = 1;
    while (1) {
        gotoxy(pressX, pressY);
        SetConsoleTextAttribute(h, CYAN);
        if (on) printf("%s", PRESS);
        else    printf("                                   ");
        SetConsoleTextAttribute(h, WHITE);

        for (int t=0; t<6; ++t) {
            if (kbhit()) { getch(); system("cls"); return; }
            Sleep(60);
        }
        on ^= 1;
    }
}

// ───────── 정렬 고정 룰표 ─────────
static void draw_rule_hline(int x, int y, int w){
    gotoxy(x, y);
    for (int i=0;i<w;i++) printf("─");   // putchar('─') → printf("─")로 경고 제거
}

void display_rule(void)
{
    const int x = 30;          // 표 시작 X
    const int w = 42;          // 가로폭(구분선 길이)
    int y = 3;                 // 시작 Y

    // 고정 열 좌표
    const int IDX_X   = x + 0;     // 번호
    const int C1_X    = x + 6;     // 릴1 심볼
    const int C2_X    = x + 12;    // 릴2 심볼
    const int C3_X    = x + 18;    // 릴3 심볼
    const int PAY_X   = x + 26;    // ×배수
    const int NOTE_X  = x + 33;    // (잭팟/순환 등)
    const int CAP_X   = x + 6;     // 설명 텍스트 시작(7~)

    // 헤더
    gotoxy(C1_X, y);  printf("릴1");
    gotoxy(C2_X, y);  printf("릴2");
    gotoxy(C3_X, y);  printf("릴3");
    gotoxy(PAY_X, y); printf("배당");
    y++;
    draw_rule_hline(x, y++, w);

    // 1~6: 트리플
    for (int i=1;i<=6;i++){
        gotoxy(IDX_X, y); printf("%2d:", i);
        const char* s =
            (i==1)?"★":(i==2)?"♠":(i==3)?"◆":(i==4)?"♥":(i==5)?"♣":"○";
        gotoxy(C1_X, y); print_cell(s);
        gotoxy(C2_X, y); print_cell(s);
        gotoxy(C3_X, y); print_cell(s);
        gotoxy(PAY_X, y); printf("×%s", (i==1)?"20":(i==2)?"7":"5");
        if (i==1){ gotoxy(NOTE_X, y); printf("(잭팟)"); }
        y++;
    }
    draw_rule_hline(x, y, w); y++;

    // 7~10: 패턴형
    gotoxy(IDX_X, y); printf(" 7:"); gotoxy(CAP_X, y);
    printf("연속(예: ◆→★→♣)");    gotoxy(PAY_X, y); printf("×4");
    gotoxy(NOTE_X, y); printf("(순환)");  y++;

    gotoxy(IDX_X, y); printf(" 8:"); gotoxy(CAP_X, y);
    printf("좌우대칭(예: ◆ ★ ◆)"); gotoxy(PAY_X, y); printf("×2"); y++;

    gotoxy(IDX_X, y); printf(" 9:"); gotoxy(CAP_X, y);
    printf("가운데 ★");            gotoxy(PAY_X, y); printf("×2"); y++;

    gotoxy(IDX_X, y); printf("10:"); gotoxy(CAP_X, y);
    printf("모두 서로 다름");      gotoxy(PAY_X, y); printf("×2"); y++;

    draw_rule_hline(x, y, w); y++;

    // 11~16: ‘두 개’
    struct { const char* s; const char* mul; } pairs[] = {
        {"★ 두 개","×4"},{"♠ 두 개","×3"},{"◆ 두 개","×3"},
        {"♥ 두 개","×3"},{"♣ 두 개","×2"},{"○ 두 개","×1"}
    };
    for (int i=0;i<6;i++){
        gotoxy(IDX_X, y); printf("%2d:", 11+i);
        gotoxy(CAP_X, y); printf("%s", pairs[i].s);
        gotoxy(PAY_X, y); printf("%s", pairs[i].mul);
        y++;
    }
    draw_rule_hline(x, y, w);
}

// 패턴 번호 → 사람이 읽을 이름
static const char* pattern_name(int n) {
    switch (n) {
        case 1:  return "잭팟 ★★★";
        case 2:  return "♠♠♠";
        case 3:  return "트리플(◆/♥/♣/○)";
        case 7:  return "연속(스트레이트)";
        case 8:  return "좌우대칭";
        case 9:  return "가운데 ★";
        case 10: return "모두 서로 다름";
        case 11: return "★ 두 개";
        case 12: return "♠ 두 개";
        case 13: return "◆ 두 개";
        case 14: return "♥ 두 개";
        case 15: return "♣ 두 개";
        case 16: return "○ 두 개";
        default: return "패턴 없음";
    }
}

// ====== 릴 그리드(유니코드 박스) ======
static void draw_hline(int cols, const char* left, const char* mid, const char* right, const char* fill) {
    printf("%s", left);
    for (int j = 0; j < cols; j++) {
        printf("%s%s%s%s", fill, fill, fill, fill); // 칸 폭 4칸
        if (j != cols - 1) printf("%s", mid);
    }
    printf("%s\n", right);
}
void draw_reel_grid(int c, int r)
{
    int x = START_X - 2, y = START_Y - 1;
    gotoxy(x, y++); draw_hline(c, "╔", "╦", "╗", "═");
    for (int i = 0; i < r; i++) {
        gotoxy(x, y++); printf("║");
        for (int j = 0; j < c; j++) {
            for (int k = 0; k < COLW; k++) putchar(' ');
            printf("║");
        }
        if (i != r - 1) {
            gotoxy(x, y++); draw_hline(c, "╠", "╬", "╣", "═");
        }
    }
    gotoxy(x, y); draw_hline(c, "╚", "╩", "╝", "═");
}

// 콘솔 맨 아래 1줄 안전 출력(현재는 사용 안 함; 필요시 사용)
static void print_bottom_safe(const char* s) {
    int W, H; get_console_size(&W, &H);
    if (H < 1) return;
    gotoxy(1, H - 1);
    for (int i = 0; i < W - 1; ++i) putchar(' ');
    putchar(' ');
    gotoxy(1, H - 1);
    int len = (int)strlen(s);
    if (len > W - 1) len = W - 1;
    fwrite(s, 1, len, stdout);
    fflush(stdout);
}

// ====== 릴 숫자 전개 ======
void reel_series(int r[][3])
{
    for (int i = 0; i < 3; i++)
        for (int j = 0; j < 3; j++)
            r[j][i] = (r[0][i] + j) % 6;   // 0~5 순환
}

// ====== 베팅 입력 (검증 루프) ======
static void flush_line(void) { int c; while ((c = getchar()) != '\n' && c != EOF) {} }
int game_progress(int money)
{
    char buf[32]; format_money(money, buf);
    int bet = -1;

    int W, H;
    get_console_size(&W, &H);
    int y1 = H - 3;    // 안내
    int y2 = H - 2;    // 입력
    int y3 = H - 1;    // 경고/추가안내
    int y4 = H;        // 스핀 안내

    while (1) {
        gotoxy(1, y1);
        printf("베팅 금액을 입력하고 Enter 키를 누르세요      현재 보유 금액 : %s원            ", buf);
        gotoxy(1, y2); printf("베팅 금액 입력>                                   ");
        gotoxy(1, y3); printf("0을 입력하면 종료합니다.                           ");
        gotoxy(18, y2);

        if (scanf("%d", &bet) != 1) {
            flush_line();
            gotoxy(1, y4); printf("숫자만 입력하세요. 다시 시도하세요.                               ");
            continue;
        }
        if (bet == 0) exit(0);
        if (bet < 0) {
            gotoxy(1, y4); printf("음수는 허용되지 않습니다. 다시 입력하세요.                          ");
            continue;
        }
        if (bet > money) {
            gotoxy(1, y4); printf("보유 금액을 초과했습니다! (현재 %s원) 더 작은 금액을 입력하세요.      ", buf);
            continue;
        }
        break;
    }

    gotoxy(1, y4); printf("아무 키나 한 번 더 누르면 스핀합니다.                               ");
    return bet;
}

// ====== 릴 출력 ======
void display_reel(const char* rc[], int r[][3], int index)
{
    for (int i = 0; i < ROWS; i++)
        for (int j = index; j < COLS; j++)
        {
            gotoxy(START_X + j * (COLW + 1), START_Y + i * 2);
            print_cell(rc[r[i][j]]);
        }
}

// ====== 하단 안내 클리어 ======
void clear_text(void)
{
    int W, H;
    get_console_size(&W, &H);
    // 맨 아래 4줄만 깨끗하게 지움 (안내/입력/경고/결과 영역)
    for (int y = H - 3; y <= H; ++y) {
        if (y < 1) continue;
        gotoxy(1, y);
        for (int i = 0; i < W; ++i) putchar(' ');
    }
}

// ====== 보조: 연속/모두다름 ======
static int is_straight3(int a, int b, int c) {
    return ((b == (a + 1) % 6) && (c == (b + 1) % 6));
}
static int all_distinct3(int a, int b, int c) {
    return (a != b && b != c && a != c);
}

void game_control(const char* reel[], int reel_num[][3], int *money)
{
    // 게이지 현재 상태만 1회 표시
    draw_lucky_meter(GAUGE_X, GAUGE_Y);

    int i, j, bet, case_num = 0, pay, num[3];
    double pst; clock_t start, end;

    display_reel(reel, reel_num, 0);
    bet = game_progress(*money);

    // 스핀
    for (i = 0; i < 3; i++) {
        start = clock();
        do {
            for (j = i; j < 3; j++) reel_num[0][j] = reel_num[1][j];
            reel_series(reel_num);
            display_reel(reel, reel_num, i);
            end = clock();
            pst = (double)(end - start) / CLOCKS_PER_SEC;
        } while (!kbhit() || (pst < 0.80));
        getch();
        num[i] = reel_num[1][i];
    }

    // 1) 기본 당첨 계산
    pay = return_money(num, bet, &case_num);

    // 2) LUCKY READY 적용 (보장/부스트)
    int lucky_used = 0;
    apply_lucky_effect(num, bet, &case_num, &pay, &lucky_used);

    // 3) 더블업 (당첨시에만) — 최종 pay에 직접 반영
    do_doubleup(&pay);
	

    // 4) 잔액 반영 (더블업/READY 반영된 최종 pay 기준)
    if (pay == 0) *money -= bet;
    else          *money += pay;

    // 5) LUCKY 게이지 갱신 + 연패 관리 (1회만)
    if (pay == 0) {
        G_LOSS_STREAK++;
        G_LUCKY += 20;
        if (G_LOSS_STREAK >= 3) G_LUCKY += 10;
    } else {
        G_LOSS_STREAK = 0;
        if (pay >= bet * 3) G_LUCKY -= 30;
        else                G_LUCKY -= 15;
    }
    if (G_LUCKY < 0)   G_LUCKY = 0;
    if (G_LUCKY >= 100){ G_LUCKY = 100; G_LUCKY_READY = 1; }

    // 게이지 표시 갱신 (항상 동일 좌표)
    draw_lucky_meter(GAUGE_X, GAUGE_Y);

    // 6) 결과 메시지 (상단 한 줄)
    {
        char mBet[32], mPay[32];
        format_money(bet, mBet);
        format_money(pay, mPay);

        clear_line_at(2);
        gotoxy(1, 2);
        if (pay > 0) {
            int mult = (bet > 0) ? (pay / bet) : 0;  // 최종 배수(READY/더블업 포함)
            if (lucky_used)
                printf("[당첨] (LUCKY 적용) 패턴:%d  배당×%d  |  베팅:%s원 → 당첨:%s원", case_num, mult, mBet, mPay);
            else
                printf("[당첨] 패턴:%d  배당×%d  |  베팅:%s원 → 당첨:%s원",          case_num, mult, mBet, mPay);
        } else {
            printf("[꽝] 베팅:%s원 차감", mBet);
        }
    }

    // 7) 하단 안내/입력 영역 정리
    clear_text();
}

// ====== 배당 계산 (우선순위 중요) ======
int return_money(int r[], int betting, int *case_num)
{
    // 심볼 인덱스: 0=◆,1=★,2=♣,3=♥,4=♠,5=○
    int a=r[0], b=r[1], c=r[2];

    // 1) 잭팟 ★★★
    if (a==1 && b==1 && c==1) { *case_num=1; return betting*20; }

    // 2) 같은 그림 3개 (♠/◆/♥/♣/○)
    if (a==b && b==c) {
        if (a==4) { *case_num=2; return betting*7; }   // ♠♠♠
        else      { *case_num=3; return betting*5; }   // ◆◆◆ / ♥♥♥ / ♣♣♣ / ○○○
    }

    // 3) 연속(스트레이트) x,(x+1),(x+2)
    if (is_straight3(a,b,c)) { *case_num=7; return betting*4; }

    // 4) 좌=우
    if (a==c) { *case_num=8; return betting*2; }

    // 5) 가운데 ★
    if (b==1) { *case_num=9; return betting*2; }

    // 6) 모두 서로 다름
    if (all_distinct3(a,b,c)) { *case_num=10; return betting*2; }

    // 7) '두 개' 패턴 (부분페어)
    // ★(1):×4, ♠(4):×3, ◆(0)/♥(3):×3, ♣(2):×2, ○(5):×1
    int cnt[6]={0}; cnt[a]++; cnt[b]++; cnt[c]++;
    for (int sym=0; sym<6; ++sym) {
        if (cnt[sym]==2) {
            if (sym==1) { *case_num=11; return betting*4; } // ★★
            else if(sym==4){ *case_num=12; return betting*3; } // ♠♠
            else if(sym==0){ *case_num=13; return betting*3; } // ◆◆
            else if(sym==3){ *case_num=14; return betting*3; } // ♥♥
            else if(sym==2){ *case_num=15; return betting*2; } // ♣♣
            else if(sym==5){ *case_num=16; return betting*1; } // ○○
        }
    }

    // 꽝
    *case_num = 0;
    return 0;
}
