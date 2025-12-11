📌 Git & GitHub Complete Guide
1. Git이란?

**Git은 분산 버전 관리 시스템(DVCS)**으로, 소스코드의 변화 이력을 기록하고 관리하는 도구입니다.

Git을 쓰는 이유

모든 변경 기록 저장 (언제, 누가, 무엇을 수정했는지 추적 가능)

잘못되면 언제든지 되돌리기 가능

여러 개발자 동시 협업 가능

코드 안정성·안전성↑

2. Git 작동 구조

Git은 아래 3단계를 거쳐 파일을 저장합니다.

Working Directory
실제 작업 파일이 있는 공간

Staging Area
커밋할 파일을 선택하는 공간

Repository (Commit)
최종 저장된 버전 이력

저장 흐름:

Working Directory → Staging Area → Repository

3. Git 기본 명령어
전역 설정
git config --global user.name "Your Name"
git config --global user.email "you@example.com"

저장소 초기화
git init

상태 확인
git status

스테이징
git add 파일명
git add .     # 모든 변경 사항

커밋
git commit -m "Commit message"

로그 확인
git log
git log --oneline

브랜치
git branch                # 목록
git branch 브랜치명        # 생성
git switch 브랜치명        # 이동
git merge 브랜치명        # 병합

되돌리기
git checkout -- 파일명          # 작업 디렉토리만 되돌리기
git reset --hard 커밋ID         # 해당 커밋으로 완전 복귀

4. GitHub란?

GitHub는 Git 저장소를 인터넷에서 관리할 수 있는 원격 저장소 서비스입니다.

Git ↔ GitHub 관계
Git	GitHub
로컬 버전 관리	원격 저장소
PC에서 작업	온라인 백업 / 협업
5. GitHub에 업로드 (Push)
1) 원격 저장소 추가
git remote add origin https://github.com/username/repo.git

2) 첫 push
git push -u origin main

3) 이후 push
git push

6. GitHub에서 가져오기 (Clone)
git clone https://github.com/username/repo.git


Clone 하면 자동으로 .git 포함하여 내려오므로 git init 필요 없음.

7. 브랜치 전략
브랜치를 사용하는 이유

안정적인 main 유지

새로운 기능을 독립적으로 개발

여러 개발자 병렬 작업 가능

예시

main : 실제 배포용 코드

dev : 개발 통합 브랜치

feature/login : 로그인 기능 개발

fix/user-bug : 버그 수정

8. GitHub 협업 방식 (Pull Request)

가장 많이 사용되는 작업 방식: GitHub Flow

작업 절차

main에서 브랜치 파생

기능 개발

commit & push

GitHub에서 Pull Request(PR) 생성

코드 리뷰

승인 후 main에 merge

필요 시 브랜치 삭제

9. 자주 발생하는 상황 정리
충돌(Conflict) 해결
# 파일 열어서 충돌 부분 수정 후
git add .
git commit

최근 커밋 되돌리기

커밋은 취소하지만 작업 내용 유지

git reset --soft HEAD~1


커밋 + 작업내용 모두 삭제

git reset --hard HEAD~1

원격 변경 내용 가져오기
git pull

10. Git & GitHub 전체 흐름 요약
작업 → add → commit → push → (GitHub PR) → merge → pull

11. Git 학습 추천 흐름

Git 구조 이해 (Working → Staging → Commit)

add / commit / push 기본 사이클 숙달

브랜치 생성-사용-병합 연습

Pull Request 협업 방식 익히기

충돌 해결 및 reset/revert 실습

12. 추가로 제공 가능한 자료

원하면 아래도 만들어 드립니다.

초보자용 Git 실습 프로젝트 템플릿

README용 Git 명령어 치트시트

GitFlow / GitHub Flow 정리 문서

Unity 프로젝트 전용 .gitignore 구성

GitHub Actions 기본 설정 템플릿

VS Code Git 사용법 상세 가이드
