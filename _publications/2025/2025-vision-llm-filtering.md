---
layout: project
detail: true
navbar_title: Projects
permalink: /project/vision-llm-filtering/
title:          "Vision-LLM으로 음식 분류 학습 이미지를 자동 필터링하기"
title_en:       "Automated training-image filtering with a Vision-LLM for food classification"
date:           2025-11-30 00:01:00 +0900
selected:       true
pub:            "SOULSOFT"
pub_ko:         "(주)소울소프트"
pub_en:         "SOULSOFT"
pub_date:       "2025.09 – 2025.11"
cover:          /assets/images/vision-llm-pipeline.svg
abstract: >-
  수집한 음식 이미지의 노이즈를 Qwen2.5-VL-7B로 적합/부적합 판정해 수동 QC를 대체함.
  같은 약 1,000장에서 한국어 한 줄(v1, 3.6%)보다 영어 포용 프롬프트(v2, 14.8%)가 통과를 크게 늘렸고, 단계 평가(v3)로 바꾸면 5.6%로 다시 줄어듦.
  필터링 데이터로 학습한 분류 모델 정확도는 82.20%에서 91.42%로 상승.
abstract_en: >-
  Replaced manual QC of collected food images with Qwen2.5-VL-7B suitable/unsuitable judgments.
  On the same ~1,000 images, an inclusive English prompt (v2) passed 14.8% vs. 3.6% for a Korean one-liner (v1); a stricter step-wise prompt (v3) fell to 5.6%.
  A classifier trained on the filtered set rose from 82.20% to 91.42% accuracy.
authors:
  - 임효진
---

<div class="i18n-ko" markdown="1">

## 1. 문제 정의

- 음식 분류 모델을 학습하려면 카테고리마다 이미지가 많이 필요함
- 웹·공개 데이터셋에서 모은 셋에는 다른 음식, 빈 프레임, 포장만 있는 컷이 섞여 있음
- 클래스 수와 장수를 고려하면 사람이 전부 검수할 수 없음

## 2. 과제 목표

- VLM으로 적합/부적합을 자동 판정해 수동 QC 대체
- **같은 분류 모델·같은 학습 설정**에서 필터 전후 데이터만 바꿔 정확도 변화 검증
- 모델·프롬프트를 갈아 끼울 수 있는 필터 파이프라인 확보

수집본 처리, vLLM 서빙, 프롬프트 실험, 학습용 분할까지 맡음.

<figure class="my-3">
  <img src="{{ '/assets/images/vision-llm-pipeline.svg' | relative_url }}" class="img-fluid rounded" alt="수집 이미지, VLM 판정, 적합·부적합 분기 파이프라인">
  <figcaption class="small text-muted text-center mt-2 mb-0">수집 이미지 → VLM 판정 → 적합 / 부적합</figcaption>
</figure>

## 3. 핵심 기술 기여

### 3.1 판정 파이프라인

- `Qwen/Qwen2.5-VL-7B-Instruct`를 vLLM으로 띄우고 OpenAI 호환 API로 호출함
- 상용 API와 로컬 서빙용 핸들러를 같은 `suitable` 인터페이스로 맞춰 바꿔 끼울 수 있게 했고, 운영 기본은 Qwen vLLM임
- 이미지와 목표 라벨마다 구조화 판정을 받고, 모델이 코드펜스를 붙여도 JSON만 꺼내도록 함. 입력은 RGB JPEG로 통일함

```json
{ "suitable": true/false, "reason": "..." }
```

- 적합은 목표 음식이 보이고 주 피사체이며 화질로 식별 가능한 경우, 부적합은 없거나 다른 음식·포장/로고만·너무 어둡거나 흐림·음식이 아닌 대상임
- 포장 글자가 아니라 음식 자체로 판단하라고 명시함
- 판정 후 일정 해상도 미만을 걸러 내고, 장수가 부족한 클래스는 분리한 다음 train/val로 나눔. 클래스 식별자와 표시명은 서로 변환할 수 있게 함

### 3.2 프롬프트 실험

같은 약 1,000장(통과+거부=1,000)에 세 프롬프트를 비교함.

| 프롬프트 | 설명 | 통과 | 거부 | 통과율 | 1,000장 소요 |
|---|---|---:|---:|---:|---:|
| v1 | 한국어, 한 줄 | 36 | 964 | 3.6% | 18.2 min |
| v2 | 영어, 포용적 | 148 | 852 | 14.8% | 16.0 min |
| v3 | 영어, 3단계 기준 | 56 | 944 | 5.6% | 16.9 min |

**구조가 언어보다 큼.** v1 → v2는 **+11.2%p**(36→148), v2 → v3는 **−9.2%p**(148→56, 엄격화). 반면 한국어 한 줄(3.6%)과 영어 단계 평가(5.6%)의 차는 **+2.0%p**뿐임. 언어를 바꾼 효과보다 지시의 톤·구조를 바꾼 효과가 훨씬 큼.

**재현율과 정밀도의 교환.** v2는 “포용적으로”라고 적어 false negative를 줄이지만 false positive 위험이 커짐. v3는 3단계 평가와 적합/부적합 체크리스트로 그 사이에 위치함. 측정한 클래스에서 v2가 통과를 가장 많이 냈고, 성공 1건당 토큰도 v2가 가장 적었음.

**클래스별 민감도가 갈림.** 프롬프트를 바꿨을 때 통과율 차가 35%p를 넘는 고민감도 클래스가 있고, 10–20%p 중민감도, 5%p 이하 저민감도로 나뉨. 같은 사진을 v1은 적합, v3는 목표 음식이 아닌 다른 조리로 판정한 사례도 있음. 프롬프트가 남는 데이터양뿐 아니라 **학습 정답의 정의**를 바꿈.

### 3.3 프롬프트로 고치지 못한 문제

측정한 10개 클래스 중 2개는 가장 포용적인 프롬프트에서도 통과율 0%였음. 폴더에 다른 종류의 이미지가 모여 있는 경우로, 필터 보정이 아니라 원천 라벨 문제로 구분해 재수집·재라벨링 대상으로 넘김.

## 4. 정량적 성과

- 대량 1차 필터에는 재현율을 우선한 v2, 품질을 더 타이트하게 볼 때는 v3를 쓰도록 정리함. 핸들러·프롬프트만 교체하면 나머지 파이프라인은 그대로 씀
- 분류기 설정을 고정하고 학습 이미지만 필터링본으로 바꿨을 때 정확도 **82.20% → 91.42% (+9.22%p)**
- 통과율 0% 클래스를 데이터 품질 이슈로 분리해, 프롬프트 튜닝으로 해결할 문제와 원천 데이터로 돌려보낼 문제를 구분함

</div>

<div class="i18n-en" markdown="1">

## 1. Problem

- A food classifier needs many images per class
- Sets gathered from the web and public datasets mix wrong foods, empty frames, and packaging-only shots
- Given the class count and volume, manual review does not scale

## 2. Goals

- Replace manual QC with automated VLM suitable/unsuitable judgments
- Verify the accuracy change with **the same classifier and the same training setup**, swapping only the data
- Build a filter pipeline where models and prompts are interchangeable

I owned ingest, vLLM serving, the prompt experiments, and the train/val split.

<figure class="my-3">
  <img src="{{ '/assets/images/vision-llm-pipeline.svg' | relative_url }}" class="img-fluid rounded" alt="Pipeline: collected images, VLM judgment, keep or reject">
  <figcaption class="small text-muted text-center mt-2 mb-0">Collected images → VLM judgment → keep / reject</figcaption>
</figure>

## 3. Technical contributions

### 3.1 Judgment pipeline

`Qwen/Qwen2.5-VL-7B-Instruct` ran on vLLM behind an OpenAI-compatible API. Commercial-API and local-serving handlers share one `suitable` interface so they can be swapped; the production default is Qwen on vLLM.

Each image and target label returns structured JSON, and a regex pulls the first object if the model wraps it in a fence. Inputs are normalized to RGB JPEG.

```json
{ "suitable": true/false, "reason": "..." }
```

Suitable: target food visible, main subject, identifiable quality. Unsuitable: missing, different food, packaging/logo only, too dark or blurry, or not food at all. Judge the food, not packaging text.

After judgment the pipeline drops images below a resolution floor, parks classes with too few shots, and splits train/val. Class ids and display names map either way.

### 3.2 Prompt experiment

Three prompts on the same ~1,000 images (passed + rejected = 1,000).

| Prompt | Description | Passed | Rejected | Pass rate | 1,000-image time |
|---|---|---:|---:|---:|---:|
| v1 | Korean, one line | 36 | 964 | 3.6% | 18.2 min |
| v2 | English, inclusive | 148 | 852 | 14.8% | 16.0 min |
| v3 | English, 3-step criteria | 56 | 944 | 5.6% | 16.9 min |

**Structure beat language.** v1 → v2: **+11.2pp** (36→148); v2 → v3: **−9.2pp** (148→56, stricter). But the Korean one-liner (3.6%) versus the English step-wise prompt (5.6%) differ by only **+2.0pp**. Changing the tone and structure of the instruction mattered far more than changing its language.

**Recall/precision trade.** v2 ("be inclusive") cuts false negatives but raises false-positive risk. v3 sits in between with a three-step checklist. Across measured classes, v2 passed the most images and used the fewest tokens per success.

**Sensitivity varies by class.** Some classes shift more than 35pp between prompts; others fall into 10–20pp or under 5pp. One photo was suitable under v1 and rejected under v3 as a different preparation. The prompt changes **what counts as training truth**, not just how much data survives.

### 3.3 A failure no prompt could fix

Two of the ten measured classes stayed at 0% even on the most inclusive prompt — folders holding a different kind of image entirely. Those were separated as source-labeling problems, not filter calibration, and sent back for re-collection.

## 4. Results

- First-pass filtering uses v2 (recall-first), v3 when quality must be tighter. Swapping handler and prompt leaves the rest of the pipeline untouched
- Holding the classifier fixed and swapping only the training images: accuracy **82.20% → 91.42% (+9.22pp)**
- Zero-pass classes were isolated as data-quality issues, separating what prompt tuning can fix from what must go back to the source data

</div>
