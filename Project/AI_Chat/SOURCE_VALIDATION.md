# Source Validation

검증 기준일: 2026-05-28

이 챗봇은 임산부 상담 보조 기능입니다. 응급 신호, 진단, 처방, 복용 결정은 AI가 확정하지 않으며, 공식 자료 기반의 일반 안내와 의료진 상담 유도를 우선합니다.

## Verified Sources

| Topic | Organization | Status |
| --- | --- | --- |
| 임신성 당뇨, 입덧, 고혈압/전자간증, 조산 | 질병관리청 국가건강정보포털 | 공식 건강정보 원문 확인 |
| 산후 우울증 | 보건복지부 국립정신건강센터 국가정신건강정보포털 | 공식 정신건강정보 원문 확인 |
| 산모 관련 응급 경고 징후 | CDC Hear Her campaign | 산모 응급 경고 신호 분기용으로 사용 |
| 임신 중 핵심 영양소와 산전영양제 | NIH Office of Dietary Supplements | 영양소 일반 정보와 상한량 확인 |
| 비타민 C, 철분, 칼슘, 비타민 D, 요오드, 비타민 B6, 비타민 B12 | NIH Office of Dietary Supplements | 임신 중 권장량/상한량/주의사항 확인 |
| 생선, 오메가3, 수은 | FDA/EPA | 임신 중 생선 섭취 권고 확인 |
| 카페인 | ACOG | 임신 중 하루 200 mg 이하 안내 확인 |
| 술 | CDC | 임신 중 안전한 음주량 없음 안내 확인 |
| 피해야 할 음식, 흔한 임신 불편감, 골반통/허리통증 | NHS | 쉬운 표현의 임신 생활 안내 확인 |
| 리스테리아 식품안전 | FDA | 임신 중 고위험 식품 안전 안내 확인 |
| 임신 중 백신 | CDC | 임신 중 권장 백신 안내 확인 |

## Authority Assessment

- 질병관리청 국가건강정보포털은 대한민국 공공 건강정보 원문으로, 국내 사용자의 기본 임신 관련 안내에 우선 사용합니다.
- NIH Office of Dietary Supplements는 미국 국립보건원 산하 영양보충제 정보 기관으로, 영양소 권장량과 상한량 근거에 사용합니다.
- ACOG는 미국 산부인과 전문 학회 자료로, 카페인처럼 산부인과 권고가 중요한 주제에 보조 근거로 사용합니다.
- CDC, FDA, FDA/EPA 자료는 감염, 백신, 식품 안전, 수은 노출처럼 공공보건 기준이 중요한 주제에 사용합니다.
- NHS 자료는 임산부가 이해하기 쉬운 표현을 만들 때 보조 근거로 사용하되, 국내 진료 기준을 대체하지 않습니다.

## Use Restrictions

- 공식 원문 전체를 복제하지 않고, 확인된 사실을 쉬운 문장으로 요약합니다.
- 약물 복용, 영양제 고용량 복용, 진단명 판단, 치료 결정은 의료진 상담으로 안내합니다.
- 공공누리 또는 각 기관의 이용 조건은 실제 공개/상업 배포 전 다시 확인해야 합니다.
- OpenAI API 사용 시 건강 질문이 외부 API로 전송될 수 있으므로 실제 서비스에서는 개인정보 고지와 사용자 동의가 필요합니다.

## Release Gate

- 의료진 또는 의료 콘텐츠 책임자의 문구 검토
- 출처 링크 유효성 정기 점검
- 응급/주의/일반 분기 시나리오 테스트
- 약 복용, 진단, 치료 지시를 생성하지 않는지 평가
- 실제 배포 전 개인정보 처리방침과 이용자 동의 문구 확인
- OpenAI API 키가 GitHub에 포함되지 않는지 확인

## Official Links

- https://health.kdca.go.kr/healthinfo/biz/health/gnrlzHealthInfo/gnrlzHealthInfo/gnrlzHealthInfoView.do?cntnts_sn=5214
- https://health.kdca.go.kr/healthinfo/biz/health/gnrlzHealthInfo/gnrlzHealthInfo/gnrlzHealthInfoView.do?cntnts_sn=5293
- https://health.kdca.go.kr/healthinfo/biz/health/gnrlzHealthInfo/gnrlzHealthInfo/gnrlzHealthInfoView.do?cntnts_sn=3329
- https://health.kdca.go.kr/healthinfo/biz/health/gnrlzHealthInfo/gnrlzHealthInfo/gnrlzHealthInfoView.do?cntnts_sn=6691
- https://health.kdca.go.kr/healthinfo/biz/health/gnrlzHealthInfo/gnrlzHealthInfo/gnrlzHealthInfoView.do?cntnts_sn=6583
- https://www.mentalhealth.go.kr/portal/disease/diseaseDetail.do?dissId=66
- https://www.cdc.gov/hearher/docs/pdf/other-languages/conversation-guides/Hear-Her-Womens-Conv-Guide-Final-9-1-21_Korean.pdf
- https://ods.od.nih.gov/factsheets/Pregnancy-HealthProfessional/
- https://ods.od.nih.gov/factsheets/VitaminC-HealthProfessional/
- https://ods.od.nih.gov/factsheets/Iron-HealthProfessional/
- https://ods.od.nih.gov/factsheets/Calcium-HealthProfessional/
- https://ods.od.nih.gov/factsheets/VitaminD-HealthProfessional/
- https://ods.od.nih.gov/factsheets/Iodine-HealthProfessional/
- https://ods.od.nih.gov/factsheets/VitaminB6-HealthProfessional/
- https://ods.od.nih.gov/factsheets/VitaminB12-HealthProfessional/
- https://www.fda.gov/food/consumers/questions-answers-fdaepa-advice-about-eating-fish-those-who-might-become-or-are-pregnant-or
- https://www.acog.org/womens-health/experts-and-stories/ask-acog/how-much-coffee-can-i-drink-while-pregnant
- https://www.cdc.gov/alcohol-pregnancy/about/index.html
- https://www.nhs.uk/pregnancy/keeping-well/foods-to-avoid/
- https://www.fda.gov/food/health-educators/listeria-food-safety-moms-be
- https://www.cdc.gov/vaccines-pregnancy/recommended-vaccines/index.html
- https://www.nhs.uk/pregnancy/common-symptoms/common-health-problems/
- https://www.nhs.uk/pregnancy/common-symptoms/pelvic-pain/
- https://www.nhs.uk/pregnancy/common-symptoms/headaches/
- https://www.nhs.uk/pregnancy/common-symptoms/swollen-ankles-feet-and-fingers/
- https://www.nhs.uk/pregnancy/common-symptoms/piles/
- https://www.nhs.uk/pregnancy/common-symptoms/indigestion-and-heartburn/
- https://www.nhs.uk/pregnancy/common-symptoms/vomiting-and-morning-sickness/
- https://www.nhs.uk/pregnancy/common-symptoms/vaginal-discharge/
- https://www.nhs.uk/pregnancy/trying-for-a-baby/signs-and-symptoms-of-pregnancy/
- https://www.cdc.gov/pregnancy/during/index.html
- https://www.cdc.gov/physical-activity-basics/guidelines/healthy-pregnant-or-postpartum-women.html
- https://www.acog.org/womens-health/faqs/skin-conditions-during-pregnancy
