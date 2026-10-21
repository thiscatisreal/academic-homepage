---
layout: project
detail: true
navbar_title: Projects
permalink: /project/metabolic-syndrome/
title:          "체성분으로 대사증후군을 비침습 예측하는 CatBoost 모델"
title_en:       "Non-invasive metabolic syndrome prediction from body composition with CatBoost"
date:           2026-04-30 00:01:00 +0900
selected:       true
pub:            "SOULSOFT"
pub_ko:         "(주)소울소프트"
pub_en:         "SOULSOFT"
pub_date:       "2026.02 – 2026.04"
cover:          /assets/images/project1-img1.png
abstract: >-
  KNHANES 2022–2024 성인 체성분 데이터로 Modified NCEP ATP III 기준 대사증후군을 혈액 검사 없이 예측함.
  사용자가 혈압을 입력하지 않아도 결과가 나오도록 체성분·허리둘레·설문 12개 피처로 AUC 0.8586을 냈고, 혈압을 입력하면 15개 피처 경로로 올라가 0.9004가 됨.
  같은 파이프라인을 고혈압·당뇨·이상지질혈증·빈혈로 확장하면서, 질환별로 라벨과 직접 이어지는 피처를 제거해 누수를 막음.
abstract_en: >-
  Predicts metabolic syndrome (Modified NCEP ATP III) from KNHANES 2022–2024 adult body-composition data with no blood test.
  So users never have to enter a blood-pressure reading, 12 features from body composition, waist, and a short questionnaire reach AUC 0.8586; entering blood pressure moves the request to a 15-feature path at 0.9004.
  The same pipeline extends to hypertension, diabetes, dyslipidemia, and anemia, with label-linked features removed per condition to prevent leakage.
authors:
  - 임효진
---

<div class="i18n-ko" markdown="1">

## 1. 문제 정의

- 대사증후군은 허리둘레·중성지방·HDL·혈압·공복혈당 5개 중 **3개 이상**이 기준을 넘으면 진단됨
- 이 중 중성지방·HDL·공복혈당은 채혈이 필요하고, 혈압은 사용자가 직접 입력해야 하는 값임
- 기기로 바로 아는 것은 허리둘레 하나뿐이라, **5개 중 1개만 보고 3개 이상인지를 맞혀야 함**

## 2. 과제 목표

- 혈압 입력 없이 체성분·허리둘레·설문만으로 위험도 산출
- 혈압을 입력하면 그 값을 쓰는 더 정확한 경로 제공
- 앱이 쓸 수 있는 API와 사용자용 등급 기준 확보
- 질환을 늘릴 때 코드를 다시 쓰지 않는 구조

<div class="row my-3 align-items-center">
  <div class="col-md-5 mb-3 mb-md-0">
    <figure class="mb-0">
      <img src="{{ '/assets/images/project1-img1.png' | relative_url }}" class="img-fluid rounded" alt="AI 건강점수 입력 화면 — 기본정보, 생활습관, 체지방·혈압">
      <figcaption class="small text-muted text-center mt-2 mb-0">AI 건강점수 입력 화면</figcaption>
    </figure>
  </div>
  <div class="col-md-7">
    <figure class="mb-0">
      <img src="{{ '/assets/images/project1-img2.png' | relative_url }}" class="img-fluid rounded" alt="대사건강 점수와 등급 결과 화면">
      <figcaption class="small text-muted text-center mt-2 mb-0">대사건강 점수·등급 결과</figcaption>
    </figure>
  </div>
</div>

## 3. 핵심 기술 기여

### 3.1 데이터와 라벨

- KNHANES 2022–2024에서 체성분검사를 마친 19세 이상 성인 약 13,000명
- 라벨은 Modified NCEP ATP III 기준으로 5개 중 3개 이상
- 중성지방·HDL·공복혈당은 라벨을 만들 때만 쓰고 입력에서는 제거함. 이 비대칭 때문에 라벨을 만든 값이 피처로 흘러 들어가지 않았는지를 먼저 확인함

### 3.2 피처 설계

- 입력 피처 12개 — 성별·연령, 체중·BMI·허리둘레, 제지방량·체지방량·체지방률, 음주·흡연·유산소, 당뇨 가족력
- 기기와 설문에서 받은 값을 그대로 쓰지 않고, 의학적 근거가 있는 파생 피처를 따로 만듦 — 허리/키 비, 제지방지수, 체간지방×연령 등
- 제지방·체지방 등을 더 넣은 26개 피처(0.8872)와 체성분 3개만 쓴 14개 피처(0.8870)를 비교해 **차이가 0.0002에 그치는 것**을 확인하고, 최종 모델에는 체성분 3개만 남김

### 3.3 모델과 불균형 처리

- 범주형을 원-핫 없이 다루기 위해 CatBoost를 씀. 트리 깊이를 얕게 잡고 valid셋 기준 early stopping으로 과적합을 막음
- 양성 비율이 낮은 불균형은 SMOTE 계열 24가지 조합을 비교한 뒤 **class weight로 처리함.** 합성 표본을 쓴 조합은 어느 것도 기존 성능을 넘지 못했고, 아예 걷어내고 class weight로 바꾸자 재현율이 0.63에서 0.85로 올라감
- AUC 0.9를 목표로 Optuna 탐색, 스태킹, Target Encoding까지 시도했지만 성능이 올라가지 않았음. 결국 효과가 있었던 것은 불균형 처리 방식을 바꾼 것뿐임

### 3.4 검증 설계

- 데이터를 train·valid·test로 나누고, test셋은 학습과 튜닝 과정에서 들여다보지 않음
- 여러 질환을 함께 다루는 데이터는 층화 분할로 한 번에 나눠, 어떻게 나눠도 질환별 유병률이 유지되게 함
- 결측은 설문 항목만 최빈값으로 채우고, 체성분과 신체계측은 필수 입력으로 두어 채워 넣은 값이 섞이지 않게 함

### 3.5 혈압을 입력받지 않아도 되는 구조

사용자에게 혈압을 입력하라고 요구하지 않아도 결과가 나오도록, 혈압을 쓰는 모델과 쓰지 않는 모델을 따로 학습해 두고 요청에 혈압이 있는지에 따라 갈라지게 함. 체성분·신체계측·설문은 필수로 받고 혈압은 선택으로 받음. 혈압이 없으면 12개 피처 경로로 바로 예측하고, 들어오면 15개 피처 경로를 씀. 어느 경로로 계산했는지를 응답에 함께 담아, 앱이 안내 문구를 다르게 띄울 수 있게 함.

혈압은 진단 기준 5개 중 하나라서 영향이 클 수밖에 없어, 얼마나 차이가 나는지를 직접 측정함 — **12개 피처가 0.8586, 혈압을 더한 15개 피처가 0.9004로 차이는 0.042**임. 혈압 없는 경로를 기본으로 두고, 혈압은 정확도를 올려주는 선택 입력으로만 받음.

### 3.6 질환 확장과 타깃 누수 제거

- 전처리·피처 구성·검증 루틴을 한 파이프라인에 두고 라벨을 교체해 고혈압·당뇨·이상지질혈증·빈혈 모델을 추가함
- 라벨만 바꾸는 것으로는 부족해서, **질환별로 라벨과 직접 이어지는 피처를 제거함** — 고혈압에서 혈압 관련 피처, 비만에서 BMI·체중·허리둘레를 제거함. 제거 전에는 고혈압이 0.8822로 잘 나왔지만 중요도 상위가 혈압 자체였고, 제거 후 수치인 0.8138을 실제 성능으로 봄
- 비만은 AUC 0.9989까지 나왔지만 라벨 자체가 BMI로 정해지는 값이라, 모델을 쓰지 않고 기준값 판정으로 바꿈. 고혈압도 혈압이 들어오면 진단 기준으로 바로 판정하고, 없을 때만 모델로 추정함
- 피처 선택은 두 단계로 나눠서 함. Forward Selection으로 자동 선택한 다음 의학적으로 타당한지 다시 검토함 — 빈혈은 혈압과 직접적인 기전이 없어 혈압 관련 피처를 제거하고, 고혈압은 피처를 28개에서 5개로 줄여 과적합을 줄였으며, 성별·연령·BMI는 공통 위험인자로 고정함

### 3.7 서빙과 사용자 등급

- 학습한 모델을 Flask REST API로 감싸 질환별 엔드포인트로 제공하고, 앱은 Spring 백엔드를 경유해 호출함. 추론은 요청이 올 때마다 일어나며 상태를 두지 않음
- 모델이 내는 확률을 그대로 보여주지 않고 **4단계 등급으로 바꿔서 전달함.** 등급 기준값은 valid셋에서 찾고 test셋에서 따로 검증해, 기준을 정하는 과정과 확인하는 과정을 분리함

## 4. 정량적 성과

**대사증후군**

| 입력 구성 | AUC | 재현율 | F1 |
|---|---:|---:|---:|
| 혈압 없음 (12개 피처) | **0.8586** | 0.8331 | 0.6389 |
| 혈압 포함 (15개 피처) | 0.9004 | 0.8460 | 0.6591 |
| [baseline](https://www.jmir.org/2025/1/e67525/) (비침습 6개 피처) | 0.8338 – 0.8447 | — | — |

**확장한 질환 (혈압 없음 기준)**

| 질환 | AUC | 재현율 | F1 |
|---|---:|---:|---:|
| 대사증후군 | 0.8586 | 0.8331 | 0.6389 |
| 고혈압 | 0.8138 | 0.8026 | 0.6730 |
| 당뇨 | 0.8106 | 0.8005 | 0.4536 |
| 빈혈 | 0.7632 | 0.7333 | 0.3299 |
| 이상지질혈증 | 0.6954 | 0.6172 | 0.4918 |

</div>

<div class="i18n-en" markdown="1">

## 1. Problem

- Metabolic syndrome is diagnosed when **3 or more** of 5 criteria are exceeded: waist, triglycerides, HDL, blood pressure, and fasting glucose
- Triglycerides, HDL, and fasting glucose need a blood draw, and blood pressure is a reading the user has to enter
- The device knows only waist, so the model must **decide whether 3 of the 5 are exceeded knowing just 1**

## 2. Goals

- Score risk from body composition, waist, and a questionnaire, with no blood-pressure input
- Use blood pressure for a more accurate path when the user does enter it
- Ship an API the app can call, plus the user-facing rating bands
- Make adding a condition require no rewrite of preprocessing or training code

<div class="row my-3 align-items-center">
  <div class="col-md-5 mb-3 mb-md-0">
    <figure class="mb-0">
      <img src="{{ '/assets/images/project1-img1.png' | relative_url }}" class="img-fluid rounded" alt="AI health-score input — basics, lifestyle, body fat and blood pressure">
      <figcaption class="small text-muted text-center mt-2 mb-0">AI health-score input</figcaption>
    </figure>
  </div>
  <div class="col-md-7">
    <figure class="mb-0">
      <img src="{{ '/assets/images/project1-img2.png' | relative_url }}" class="img-fluid rounded" alt="Metabolic-health score and rating result">
      <figcaption class="small text-muted text-center mt-2 mb-0">Metabolic-health score and rating</figcaption>
    </figure>
  </div>
</div>

## 3. Technical contributions

### 3.1 Data and labels

- About 13,000 adults aged 19+ from KNHANES 2022–2024 who completed a body-composition exam
- Labels follow Modified NCEP ATP III: positive at 3 or more of the 5 criteria
- Triglycerides, HDL, and fasting glucose compute the label but are excluded from the inputs. Because of that asymmetry I checked first that no label component leaked into the features

### 3.2 Feature design

- 12 input features: sex, age, weight, BMI, waist, fat-free mass, fat mass, % body fat, drinking, smoking, aerobic activity, and family history of diabetes
- Built derived features from domain reasoning rather than passing raw values through — waist-to-height ratio, fat-free mass index, trunk fat × age
- Compared 26 features with more fat and fat-free mass detail (0.8872) against 14 features using only three body-composition values (0.8870), found **a gap of 0.0002**, and kept just the three in the final model

### 3.3 Model and class imbalance

- CatBoost, so categoricals need no one-hot encoding. Kept the trees shallow with early stopping on the validation set to curb overfitting
- For the low positive rate I compared 24 SMOTE-family combinations and then chose **class weights**. Synthetic sampling never beat the incumbent, and dropping it for class weights raised recall from 0.63 to 0.85
- Targeted AUC 0.9 through Optuna search, stacking, and target encoding, and got no improvement from any of them. The imbalance strategy was the only change that moved the number

### 3.4 Validation design

- Split into train, validation, and test, and never consulted the test set during training or tuning
- Split the multi-condition data once with stratification so every label keeps its prevalence
- Imputed only the questionnaire items by mode, and required body composition and anthropometrics so no estimated values enter the input

### 3.5 Working without a blood-pressure input

To return a result without asking users for a blood-pressure reading, I built two model bundles and branch per request. Body composition, anthropometrics, and the questionnaire are required and blood pressure is optional: with no blood pressure it predicts straight from the 12-feature path, and with it the request moves to the 15-feature path. The response carries which path ran so the app can word its guidance accordingly.

Blood pressure is one of the five criteria, so I measured how much it contributes — **0.8586 on 12 features against 0.9004 with blood pressure added, a gap of 0.042.** The no-BP path is the default, and blood pressure is treated as an optional input that raises accuracy.

### 3.6 Extending conditions and removing target leakage

- Kept preprocessing, feature construction, and validation in one pipeline and swapped the label to add the hypertension, diabetes, dyslipidemia, and anemia models
- Swapping the label was not enough, so I **removed the features tied directly to each label** — blood-pressure features for hypertension, and BMI, weight, and waist for obesity. Hypertension looked strong at 0.8822 until its top features turned out to be blood pressure, and I treat the post-removal 0.8138 as the real number
- Obesity reached AUC 0.9989, but its label is a function of BMI, so I dropped the model and judge it against a threshold. Hypertension likewise falls back to the diagnostic criteria when blood pressure is supplied, and only estimates when it is not
- Ran feature selection in two stages: forward selection first, then a revision on medical grounds — dropped blood-pressure-derived features from anemia for lack of a direct mechanism, cut hypertension from 28 features to 5 to curb overfitting, and pinned sex, age, and BMI as shared risk factors

### 3.7 Serving and user-facing ratings

- Wrapped the trained artifacts in a Flask REST API with one endpoint per condition; the app calls it through the Spring backend, and inference runs per request and holds no state
- Mapped model probabilities to a **four-level rating** instead of exposing them directly. Cuts are searched on the validation set and verified separately on the test set, keeping search and verification apart

## 4. Results

**Metabolic syndrome**

| Input configuration | AUC | Recall | F1 |
|---|---:|---:|---:|
| No blood pressure (12 features) | **0.8586** | 0.8331 | 0.6389 |
| With blood pressure (15 features) | 0.9004 | 0.8460 | 0.6591 |
| [baseline](https://www.jmir.org/2025/1/e67525/) (6 non-invasive features) | 0.8338 – 0.8447 | — | — |

**Extended conditions (no-BP path)**

| Condition | AUC | Recall | F1 |
|---|---:|---:|---:|
| Metabolic syndrome | 0.8586 | 0.8331 | 0.6389 |
| Hypertension | 0.8138 | 0.8026 | 0.6730 |
| Diabetes | 0.8106 | 0.8005 | 0.4536 |
| Anemia | 0.7632 | 0.7333 | 0.3299 |
| Dyslipidemia | 0.6954 | 0.6172 | 0.4918 |

</div>
