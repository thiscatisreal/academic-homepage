---
layout: project
detail: true
navbar_title: Projects
permalink: /project/furnace-fuel/
title:          "유리 용해로 공정 AI 기반 연료 최적화"
title_en:       "AI fuel optimization for a glass-melting furnace"
date:           2023-06-09 00:01:00 +0900
selected:       true
pub:            "INEEJI · 동원시스템즈"
pub_ko:         "(주)인이지 · 동원시스템즈"
pub_en:         "INEEJI · Dongwon Systems"
pub_date:       "2022.02 – 2023.05"
cover:          /assets/images/industry_c_01.png
abstract: >-
  바닥온도 예측 모델 RMSE 5.43 → 1.97 개선.
  현장 테스트에서 연료 사용량 3.59% 절감.
  특허 등록 〈온도 예측 및 제어 시스템을 구현하기 위한 전자 장치 및 이의 제어 방법〉.
abstract_en: >-
  Bottom-temperature RMSE fell from 5.43 to 1.97, and on-site tests cut fuel use by 3.59%.
  A two-stage cascade reuses crown-temperature forecasts as inputs to the bottom model, and forecasts drive proactive fuel and oxygen guidance.
  Registered as Korean Patent No. 10-2640747.
authors:
  - 임효진
links:
  Patent: https://doi.org/10.8080/1020230096478
---

<div class="i18n-ko" markdown="1">

## 1. 문제 정의

- 용해로 내부 목표 온도 유지를 위한 최적 연료 투입량을 운전원의 경험에 의존해 판단
- 용출량(생산량) 변동 시 불량 방지를 위해 과도한 연료·전력을 미리 투입하는 관행 존재
- 천장·바닥 온도가 하루에도 여러 번 변화해, 어떤 변화가 용출량에 의한 것인지 구분이 어려움

## 2. 과제 목표

- 천장·바닥 온도 변화를 사전에 예측하여 연료 투입을 미리 조절
- 실시간 모니터링·가이드 UI 구축을 통한 현장 운영 지원
- 동원시스템즈 용해 1로 연료 사용량 5% 감축

## 3. 핵심 기술 기여

- **2단 캐스케이드 신경망 구조 설계** — 천장온도 예측값을 바닥온도 예측 모델의 입력으로 재사용해 두 위치를 연계 예측
- **AI 예측 기반 선제적 제어 로직 설계** — 미래 온도 예측값을 제어 입력으로 사용해 이탈 전 연료·산소 투입량 사전 조정
- 현장 도메인 지식 기반 파생 변수 설계, k-fold 교차검증으로 평가셋 구성

## 4. 정량적 성과

| 회차 | 천장온도 편차 변화 | 연료 투입량 변화 | 비고 |
|---|---:|---:|---|
| 1차 | +1.0°C | +1.24% | 미적용 구간 현장 과다 투입 |
| 2차 | +0.8°C | **−1.30%** | NOx 기준 초과로 현장 개입 |
| 3차 | −1.0°C | +0.87% | 강우로 원료 함수율 변화 |
| 4차 | −1.4°C | +2.35% | 테스트 중 정전 발생 |
| 5차 | +0.7°C | **−3.59%** | 전 구간 정상 작동, 최대 개선 |
| 6차 | +4.3°C | **−1.88%** | 목표 온도 상단 재설정 |

목표는 5% 감축이었고 최대 개선은 5차의 −3.59%임. 외부 교란(강우·정전·NOx 대응)이 없던 회차에서만 루프가 온전히 돌았고, 남은 차이는 교란 구간에도 가이드를 유지하는 룰이 더 필요했던 부분임.

## 5. 특허

[온도 예측 및 제어 시스템을 구현하기 위한 전자 장치 및 이의 제어 방법](https://doi.org/10.8080/1020230096478) (특허 제10-2640747호)

## 핵심 기술 기여 상세

### 1. 바닥온도 예측 모델 개발

**1.1. 현장 도메인 분석**

현장 인터뷰를 통해 데이터만으로는 알 수 없는 공정 특성을 확인하고 모델 설계에 반영함.

- 버블러가 부스터보다 바닥온도에 더 크게 영향을 줄 수 있음
- 습도가 높은 날 연료 사용량이 감소하는 보온 효과 존재
- 용출량 변경 시 온도는 3–6시간에 걸쳐 지연 반영됨
- 배치(원료) 투입 위치, 버너 청소 주기 등 데이터에 잡히지 않는 변동 요인 존재

**1.2. 모델 구조 반복 개선**

바닥온도 특성상 3시간 이내 급변이 드물다는 점에 착안해 선형 추세 + 잔차 보정 구조를 설계함.

| 단계 | 접근 | RMSE |
|---|---|---:|
| 1차 | 선형 예측만 전체 구간에 적용 | 5.43 |
| 2차 | 학습 데이터 기간 확대 + 관련 온도 변수 추가 | 3.78 |
| 3차 | 선형 예측 + 잔차(residual) 예측 구조로 전환, 입력 변수 재선정 | 2.01 |
| 4차 | 1D-CNN 커널 사이즈 튜닝 | **1.97** |

※ RMSE: 예측값과 실제값의 오차 크기(낮을수록 정확) · 잔차 예측: 1차 예측 후 남은 오차분을 추가로 예측해 보정

**1.3. 최종 모델 구현**

최근 일정 구간의 다변량 공정 데이터(온도 태그, 연료 투입량 등)를 입력받아, Conv1d 층을 여러 겹 쌓아 시계열 패턴을 점차 압축된 형태로 요약하고 이를 Linear 층에서 향후 여러 시점의 온도로 변환하는 구조로 구현함. 특히 온도 변화가 특정 시점에 한 번에 나타나지 않고 일정 구간에 걸쳐 서서히 반영되는 공정 특성을 고려해, 한 시점씩 예측값을 다시 입력에 넣어 순차적으로 계산하는 대신 여러 시점을 한 번에 출력하도록 설계해 예측이 반복될수록 오차가 누적되는 문제를 줄임.

※ Conv1d: 인접한 시점들의 변화 패턴(상승·하강 흐름 등)을 자동으로 인식하는 층 · 다중 시점 출력: 한 시점씩 순서대로 예측하지 않고 향후 여러 시점을 동시에 예측해 오차 누적을 방지

### 2. 연료 투입 제어 로직 설계

- **PID 기반 목표온도 추종 제어**: 목표온도(SP)를 직접 예측하는 방식 사용, 오차항·적분항 기반으로 연료 투입량을 증감
- **용출량 변경 사전 대응 룰**: 용출량이 일정 수준 이상 변경될 경우, 변경 전부터 미리 연료량을 조정
- **피드백 로직 보강**: 1차 가이드 후에도 적정 구간에 들어오지 않으면 2차 가이드를 추가 제안하도록 개선

## 현장 테스트 결과

수차례 현장 테스트를 통해 알고리즘을 검증·고도화함. 전일 동일 조건(현장 수동 제어) 대비 결과를 정량 비교함.

6회 중 3회(5·6차, 2차)에서 연료 사용량 감소를 확인했고, 나머지 회차의 증가는 강우로 인한 원료 함수율 변화, 정전, NOx 규제 대응을 위한 현장 개입 등 외부 교란 요인 때문임을 데이터로 구분해 규명함. 결과를 단순히 좋다/나쁘다로 보고하지 않고, 매 테스트마다 원인을 추적해 다음 회차 제어 로직(피드백 주기, 사전 대응 룰)에 반영하는 방식으로 점진적으로 고도화함.

## 사용자 UI

<figure class="my-3">
  <img src="{{ '/assets/images/230519_IMG_8133.jpg' | relative_url }}" class="img-fluid rounded" alt="현장 실시간 모니터링·연료 가이드 대시보드">
  <figcaption class="small text-muted text-center mt-2 mb-0">현장 실시간 모니터링·연료 가이드 대시보드</figcaption>
</figure>

## 배운 점

- 모델 성능이 좋아도 실제 현장에서는 정전·기상·규제 대응 등 통제 불가능한 변수가 결과를 좌우할 수 있음을 경험함.
- 반복적인 테스트-피드백 사이클을 통해 예측 모델과 제어 알고리즘을 점진적으로 고도화하는 프로세스 경험함.
- 데이터만으로는 알 수 없는 도메인 지식을 습득해 모델에 반영한 것이 실제 성능 개선으로 이어짐을 체감함.

</div>

<div class="i18n-en" markdown="1">

## 1. Problem

- Optimal fuel to hold furnace setpoint was judged from operator experience.
- When pull (throughput) changed, crews often over-fired in advance to avoid defects.
- Crown and bottom temperatures moved several times a day, so it was hard to tell which moves came from pull.

## 2. Goals

- Forecast crown and bottom temperature so fuel can be adjusted before the process drifts.
- Support operations with a real-time monitoring and guidance UI.
- Cut fuel use on Dongwon Systems melting furnace 1 by 5%.

## 3. Technical contributions

- **Two-stage cascade network**: crown-temperature forecasts are reused as inputs to the bottom-temperature model so the two locations are predicted together.
- **Forecast-driven proactive control**: future temperatures are control inputs, so fuel and oxygen move before a deviation lands.
- Derived features from shop-floor domain knowledge; evaluation sets from k-fold cross-validation.

## 4. Quantitative results

On-site tests vs. the previous day’s manual control under the same conditions.

| Trial | Crown-temp. deviation change | Fuel-input change | Notes |
|---|---:|---:|---|
| 1 | +1.0°C | +1.24% | Over-firing in an unguided interval |
| 2 | +0.8°C | **−1.30%** | On-site intervention after NOx limit |
| 3 | −1.0°C | +0.87% | Rain changed batch moisture |
| 4 | −1.4°C | +2.35% | Power cut during the test |
| 5 | +0.7°C | **−3.59%** | Loop ran the whole shift; largest gain |
| 6 | +4.3°C | **−1.88%** | Upper setpoint retuned |

The target was 5%; the best trial reached −3.59%. The loop only ran cleanly on days without external disturbance, and closing the remaining gap needed rules that hold the guidance through those disturbances too.

Fuel fell on 3 of 6 trials (2, 5, and 6). Increases were attributed to rain, a power cut, or NOx intervention and folded into the next rules (feedback period, pre-response).

## 5. Patent

[Electronic device and control method for a temperature prediction and control system](https://doi.org/10.8080/1020230096478) (Korean Patent No. 10-2640747)

## Technical details

### 1. Bottom-temperature model

**1.1. Domain analysis**

Shop-floor interviews filled gaps the tags miss.

- Bubblers can move bottom temperature more than boosters.
- Humid days insulate and cut fuel.
- Pull changes lag 3–6 hours into temperature.
- Batch location and burner-cleaning cycles are unmeasured shocks.

**1.2. Iterating the architecture**

Bottom temperature rarely jumps inside three hours, so the stack is **linear trend + residual correction**.

| Stage | Approach | RMSE |
|---|---|---:|
| 1 | Linear only over the full horizon | 5.43 |
| 2 | Longer history + extra temperature tags | 3.78 |
| 3 | Linear + residual; inputs re-chosen | 2.01 |
| 4 | 1D-CNN kernel-size tuning | **1.97** |

RMSE is prediction error (lower is better). Residual prediction models what the first stage still misses.

**1.3. Final model**

A window of multivariate process data (temperature tags, fuel, etc.) goes through stacked Conv1d layers that compress the series, then a linear head emits several future temperatures at once. Because temperature moves over an interval rather than a single step, the model does **not** feed one-step predictions back; multi-horizon output avoids error accumulation.

### 2. Fuel-control logic

- **PID tracking of setpoint**: the model predicts the setpoint (SP); proportional and integral terms raise or lower fuel.
- **Pull-change rule**: if pull moves beyond a threshold, fuel is adjusted before the change lands.
- **Feedback**: if the first guide still leaves the process out of band, a second guide is proposed.

## On-site tests

Repeated plant trials verified and tightened the algorithm against the previous day’s manual control. Each round’s cause was traced and written into the next control rules rather than reported as a binary win/loss.

## Operator UI

Real-time monitoring and fuel-guidance dashboard.

<figure class="my-3">
  <img src="{{ '/assets/images/230519_IMG_8133.jpg' | relative_url }}" class="img-fluid rounded" alt="On-site real-time monitoring and fuel-guidance dashboard">
  <figcaption class="small text-muted text-center mt-2 mb-0">On-site real-time monitoring and fuel-guidance dashboard</figcaption>
</figure>

## What I learned

- Strong model metrics can still be overridden on the floor by power cuts, weather, and regulatory interventions.
- A test–feedback cycle is how the predictor and the control rules actually improved.
- Domain knowledge that never appears in the tags was what moved real performance.

</div>
