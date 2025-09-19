#카드 표시, 카드 내용 출력, 카드를 섞는 기능 구현해보기

#include <stdio.h>
#include <stdlib.h>   // rand(), srand()
#include <string.h>   // strcpy()
#include <time.h>     // time()

// 카드 구조체
struct trump {
    int order;       // 모양 순서 (♠=0, ◆=1, ♥=2, ♣=3)
    char shape[4];   // 모양 문자열
    int number;      // 숫자 (1~13)
};

// 함수 원형 선언
void make_card(struct trump m_card[]);
void display_card(struct trump m_card[]);
void shuffle_card(struct trump m_card[]);

int main(void) {
    struct trump card[52];    // 52장 카드 배열

    make_card(card);          // 카드 생성
    shuffle_card(card);       // 카드 섞기
    display_card(card);       // 섞은 카드 출력

    return 0;
}

// 카드 생성 함수
void make_card(struct trump m_card[]) {
    int i, j;
    char shape[4][4] = {"♠", "◆", "♥", "♣"};

    for (i = 0; i < 4; i++) {
        for (j = 0; j < 13; j++) {
            int idx = i * 13 + j;
            m_card[idx].order = i;
            strcpy(m_card[idx].shape, shape[i]);
            m_card[idx].number = j + 1;
        }
    }
}

// 카드 출력 함수
void display_card(struct trump m_card[]) {
    int i, count = 0;

    for (i = 0; i < 52; i++) {
        printf("%s", m_card[i].shape);

        switch (m_card[i].number) {
            case 1:
                printf("%2c ", 'A');
                break;
            case 11:
                printf("%2c ", 'J');
                break;
            case 12:
                printf("%2c ", 'Q');
                break;
            case 13:
                printf("%2c ", 'K');
                break;
            default:
                printf("%2d ", m_card[i].number);
        }

        count++;
        if (count == 13) {   // 13장 출력 후 줄바꿈
            printf("\n");
            count = 0;
        }
    }
}
    
// 카드 섞기 함수
void shuffle_card(struct trump m_card[]) {
    int i, rnd;
    struct trump temp;

    srand(time(NULL));  // 난수 초기화

    for (i = 0; i < 52; i++) {
        rnd = rand() % 52;           // 0~51 난수 발생
        temp = m_card[rnd];          // 두 카드 위치 교환
        m_card[rnd] = m_card[i];
        m_card[i] = temp;
    }
}
