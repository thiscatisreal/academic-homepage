---
layout: project
detail: true
navbar_title: Projects
permalink: /project/food-llm-pipeline/
title:          "음식 인식·영양 추정을 위한 멀티모달 LLM 파이프라인"
title_en:       "Multimodal LLM pipeline for food recognition and nutrition estimation"
date:           2025-12-01 00:01:00 +0900
selected:       true
pub:            "SOULSOFT"
pub_ko:         "(주)소울소프트"
pub_en:         "SOULSOFT"
pub_date:       "2025.12 – 2026.01"
cover:          /assets/images/food-llm-pipeline.svg
abstract: >-
  식사 사진 또는 텍스트로 음식 항목, 영양소 13개, 건강목표 6축 등급, 코칭, (이미지면) 박스를 구조화 JSON으로 반환하는 서비스를 설계·운영함.
  JSON Schema로 출력을 고정하고, primary/fallback 모델이 같은 deadline을 쓰며 클라이언트 120초 안에 응답하거나 끊음.
  접시 위 음식을 항목으로 나눌지 한 요리로 묶을지에 대한 프롬프트 규칙이 칼로리 합계에 직접 영향을 줌.
abstract_en: >-
  A production service that turns a meal photo or food-name text into structured JSON: items, 13 nutrients,
  six health-goal ratings, coaching, and (for images) boxes. JSON Schema locks the contract; primary and fallback
  models share one deadline so the server responds or stops inside the client’s 120 seconds.
  Prompt rules for splitting plate items versus a single dish feed calorie totals directly.
authors:
  - 임효진
---

<div class="i18n-ko" markdown="1">

## 1. 문제 정의

- 헬스케어 앱에서 식사 사진 또는 음식명 텍스트를 올리면 항목별 영양·건강 등급·코칭을 돌려줘야 함
- 초기 구현은 앱이 멀티모달 LLM을 직접 호출해, 사용량이 늘자 타임아웃·과금·동시 요청이 앱 쪽에서 통제되지 않음
- 모델 자유 텍스트를 파싱하는 구조라 필드가 하나만 달라져도 화면이 깨짐

## 2. 과제 목표

- 추론을 서버로 이관해 **클라이언트 120초 안에 반드시 응답하거나 끊는** 계약 확립
- 항목·합계·박스를 앱이 그대로 그릴 수 있는 구조화 출력 유지
- 업스트림 장애·혼잡·인식 실패를 앱이 다른 안내로 분기할 수 있게 구분

담당 범위는 이관 대상 서버 API 전체로, 프롬프트·응답 스키마·재시도·fallback·동시성 제어·에러 계약을 맡음.

<figure class="my-3">
  <img src="{{ '/assets/images/food-llm-pipeline.svg' | relative_url }}" class="img-fluid rounded" alt="앱 요청, 동시성 게이트, primary/fallback 모델, 구조화 JSON 응답 흐름">
  <figcaption class="small text-muted text-center mt-2 mb-0">입력 → 게이트 → 추론(primary / fallback) → JSON</figcaption>
</figure>

## 3. 핵심 기술 기여

### 3.1 구조화 출력 계약

- 이미지·텍스트 두 경로가 같은 응답 형태를 냄 — 음식 이름, 영양소 13개(열량·탄수화물·단백질·지방·당·섬유·나트륨 등), 건강목표 6축 등급, 코칭, (이미지면) 박스, 항목 합계
- 모델 출력은 JSON 배열로 강제하고, 필드명만 앱이 쓰는 키로 바꾸는 어댑터를 둠
- **필드 단위 제약은 스키마에, 항목 간·전역 규칙은 프롬프트에** 두어 중복을 없앰 — 한쪽만 고쳐 두 정의가 어긋나는 것을 막기 위한 분리
- 분석 API는 상태를 두지 않음 — 결과를 확인·수정한 뒤 별도 저장 요청으로 남기므로, 분석 경로의 장애가 기록을 오염시키지 않음

### 3.2 항목 분리와 박스

- `SEPARATE FOODS = SEPARATE ITEMS`를 대문자 선언으로 유지함 — 평문으로 바꿨을 때 스테이크·샐러드·빵이 한 접시로 뭉치는 회귀가 있었음
- 보이는 반찬·소스까지 빠짐없이 적고, 같은 음식의 여러 인분은 항목을 늘리지 않고 수량으로 합침. **이 규칙이 칼로리 합계에 직접 영향을 줌**
- 이미지 경로는 음식마다 박스를 붙이고, 원소 수를 4개로 고정해 두 박스를 이어붙여 8원소로 내던 출력을 차단함
- 모델 좌표를 화면용 정규화 좌표로 변환하고, 겹침이 크거나 테이블 전체를 한 박스로 잡지 말라는 규칙은 프롬프트에 둠

### 3.3 시간 예산과 동시성

- 게이트 대기와 처리(재시도·fallback)를 합쳐 클라 120초보다 짧게 상한을 잡음
- 재시도 판단에 **다음 호출이 최악으로 걸리는 시간까지 더해서** deadline을 넘길 것 같으면 재시도를 포기함
- Primary는 최신 계열, 가용성 실패가 소진된 뒤에만 구버전 계열로 fallback함. 두 경로가 **같은 deadline**을 공유하므로 앱은 이미 끊겼는데 서버만 호출을 이어가는 고아 작업이 생기지 않음
- 계열별로 thinking·temperature 파라미터가 달라 섞어 보내면 400이 나므로 요청 구성을 분기함
- 동일 사진 반복 호출에서 칼로리가 흔들리지 않도록 생성 시드를 고정함
- 동시에 돌아가는 추론 수는 제한하고, 큐가 가득 차면 대기 없이 거절함. 잘못된 입력은 슬롯을 얻기 **전에** 돌려보내 무효 요청이 자리를 점유하지 않게 함

### 3.4 장애를 UX로

- 인식 실패(다시 촬영), 이용자 많음, 타임아웃(잠시 후 재시도), 용량 초과를 구분함
- 업스트림 장애가 “다시 촬영”으로 오인되지 않도록 HTTP 상태 계약을 맞춤
- 안전 차단과 응답 타임아웃은 재시도하지 않음 — 재시도해도 결과가 같거나 중복 과금·장시간 대기만 늘기 때문임
- 음식이 없으면 빈 목록을 200으로 주고 앱이 인식 실패로 처리함

## 4. 결과

- 스키마 강제·공유 deadline·동시성 상한이 적용된 상태로 운영 중이며, 앱이 받는 응답 형태와 에러 분기가 코드 계약으로 고정됨
- 생성 시드 고정으로 동일 사진 반복 호출 시 칼로리 편차 없음
- 프롬프트를 고칠 때마다 항목 분리가 흔들리는 것을 확인해, 이름 규칙·분리 규칙은 회귀 사례를 남기고 변경하도록 정리함

</div>

<div class="i18n-en" markdown="1">

## 1. Problem

- The healthcare app needs per-item nutrition, health-goal ratings, and coaching from a meal photo or a food-name string
- The first version called a multimodal LLM from the client, so timeouts, billing, and concurrency became uncontrollable as traffic grew
- Parsing free-text model output meant one changed field could break the screen

## 2. Goals

- Move inference to the server under a contract to **respond or stop inside 120 seconds**
- Keep structured items, totals, and boxes the app can render directly
- Separate upstream outage, overload, and recognition failure so the app can guide users differently

I owned the server API being migrated: prompts, response schema, retries, fallback, concurrency control, and the error contract.

<figure class="my-3">
  <img src="{{ '/assets/images/food-llm-pipeline.svg' | relative_url }}" class="img-fluid rounded" alt="Request, concurrency gate, primary and fallback models, structured JSON response">
  <figcaption class="small text-muted text-center mt-2 mb-0">Input → gate → inference (primary / fallback) → JSON</figcaption>
</figure>

## 3. Technical contributions

### 3.1 Structured output contract

Image and text paths return the same shape: name, 13 nutrients (energy, macros, sugar, fiber, sodium, and related), six health-goal ratings, coaching, boxes on images, and item totals. The model must emit a JSON array; an adapter only maps field names onto the app's keys.

**Field constraints live in the schema, cross-item and global rules in the prompt**, with no duplication, so editing one side cannot silently desync the other.

The analyze API is stateless. The client persists after the user reviews and edits, so a failure in the analyze path cannot corrupt stored records.

### 3.2 Itemization and boxes

The rule `SEPARATE FOODS = SEPARATE ITEMS` stayed as an all-caps declaration. Flattening it into prose merged steak, salad, and bread into one plate. Every visible side and sauce is listed, and identical servings become one item with a higher quantity. **This rule feeds calorie totals directly.**

The image path boxes each food. Exactly four numbers, which stops the model concatenating two boxes into eight values, and model coordinates are converted to normalized screen coordinates. The prompt forbids large overlap and boxing the whole table.

### 3.3 Time budget and concurrency

Gate wait plus processing (retries and fallback) stay under the client's 120s. A retry is skipped when **the worst-case duration of the next call** would cross the deadline.

The primary is the newer family; fallback to the older one only after availability failures are exhausted. Both share **the same deadline**, so the server never keeps calling after the app is gone. Thinking and temperature parameters differ per family — mixing them returns 400 — so request building branches by family. A fixed generation seed keeps calories stable across repeat calls on the same photo.

In-flight inference is capped and a full queue is rejected without waiting. Invalid input is rejected **before** taking a slot, so bad requests never hold capacity.

### 3.4 Failures as UX

Recognition failure (re-shoot), overload, timeout (try again), and oversize are distinct. HTTP statuses are chosen so an upstream outage is never read as "re-shoot." Safety blocks and response timeouts are not retried — the result would repeat, and retrying only adds duplicate billing and long waits. No food returns an empty list with HTTP 200, which the client treats as recognition failure.

## 4. Result

- Schema enforcement, a shared deadline, and a concurrency cap are live; response shape and error branching are fixed as code contracts
- A fixed seed keeps calorie values stable across repeat calls on the same photo
- Because prompt edits kept destabilizing itemization, naming and separation rules are now changed only alongside a recorded regression case

</div>
