# Source Validation

검증 기준일: 2026-05-27

이 서비스는 임산부 대상 기능이므로, 명확한 경고 신호는 모델보다 먼저 안전 문구로 분기합니다.
일반 대화와 모호한 질문은 OpenAI 모델이 대화 이력과 검색된 공식 자료를 참고해
쉬운 안내문을 생성하며, 화면에는 근거 기관명과 원문 링크를 함께 표시합니다.

## Verified Sources

| Topic | Organization | Official update date | Status |
| --- | --- | --- | --- |
| 식이영양(임산부) | 질병관리청 국가건강정보포털 | 2026-05-04 | 원문 확인 |
| 운동 | 질병관리청 국가건강정보포털 | 2026-05-15 | 일반 운동정보로만 사용 |
| 임신고혈압과 전자간증(임신중독증) | 질병관리청 국가건강정보포털 | 2026-05-06 | 원문 확인 |
| 임신당뇨병 | 질병관리청 국가건강정보포털 | 2026-04-27 | 원문 확인 |
| 조산 | 질병관리청 국가건강정보포털 | 2026-04-17 | 원문 확인 |
| 산후 우울증 | 보건복지부 국립정신건강센터 국가정신건강정보포털 | 페이지 및 운영기관 확인, 갱신일 미표시 | 제한 사용 |
| 산모 관련 응급 경고 징후 | 미국 질병통제예방센터(CDC) Hear Her 캠페인 한국어 안내서 | 페이지 확인, 갱신일 미표시 | 복통·태동 경고 분기에만 사용 |

## Authority Assessment

- 질병관리청 국가건강정보포털은 대한민국 공식 전자정부 누리집으로 표시되어 있으며, 해당 임신 관련 문서는 공식 건강정보 원문입니다.
- 국가정신건강정보포털은 보건복지부 국립정신건강센터가 제공하며, 전문가 검증을 거친 정신건강 공공포털임을 안내합니다.
- CDC `Hear Her` 한국어 안내서는 지속되는 심한 복통, 태동 감소·멈춤, 호흡 곤란, 흉통, 실신, 발열, 심한 구토 및 심한 부종 등을 즉시 진료가 필요한 산모 응급 경고 징후로 안내합니다.
- 위 출처는 신뢰 가능한 1차 공공 출처지만, 개별 임산부의 진단·처방·응급 판단을 대신하지 않습니다.
- `운동` 문서는 일반 운동 정보이므로 임산부 개인에게 특정 운동을 권장하는 자료로 확대 해석하지 않습니다.

## Use Restrictions

질병관리청 국가건강정보포털은 공공누리 제4유형 자료에 대해
`출처표시`, `비상업적 이용`, `변경금지` 조건을 안내합니다.
따라서 본 구현은 원문 전체를 복제하지 않고, 검색된 사실을 생성 답변의 근거로 제공하며 원문 링크를 함께 표시합니다.
외부 배포 또는 상업 이용 전에는 각 콘텐츠의 공공누리 부착 여부와 이용허락 범위를
문서별로 다시 확인해야 합니다.

## Release Gate

- 산부인과 전문의 또는 의료 콘텐츠 책임자의 문구 검토 완료
- 원문 링크 유효성 및 갱신일 정기 확인 절차 마련
- 위험 문구 분기 시나리오 테스트 완료
- 의약품 복용, 진단, 치료 지시를 생성하지 않는지 점검
- 상업 배포 시 저작물 이용허락 확인 완료
- 외부 임베딩 검색을 활성화할 경우 민감 건강질문 전송에 대한 개인정보 검토 및 사용자 동의 완료
- OpenAI 생성 답변을 활성화할 경우 건강질문과 대화 이력 전송에 대한 개인정보 고지 및 사용자 동의 완료
- 생성 답변이 공식 근거가 없는 진단·처방·복약 결정을 하지 않는지 평가 시나리오 마련
- 로컬 개발 시 API 서버를 `127.0.0.1`에만 바인딩하고 허용된 프론트 주소만 CORS로 접근시키는지 확인
- 의미 기반 검색 결과가 관련도 기준 미만일 때 의료 근거로 노출되지 않는지 확인

## Triage Presentation Policy

- 증상의 종류나 심각도가 불명확하면 위험하다고 단정하지 않고, 통증 여부, 반복 간격, 출혈·물 샘 여부, 태동 감소 여부를 먼저 질문합니다.
- 질병관리청 조산 안내의 규칙적이고 지속적인 배뭉침, 강해지는 진통, 출혈, 양수 누출 기준이나 CDC의 태동 감소 등 명확한 경고 표현이 확인되면 `지금 의료진 확인이 필요해요` 단계로 안내합니다.
- 호흡 곤란, 흉통, 실신, 자해·타해 표현처럼 즉각적인 도움 요청이 필요한 입력에만 `즉시 도움을 요청하세요` 단계를 표시합니다.
- 이 단계는 진단이나 응급도 확정이 아니라, 사용자가 다음 행동을 선택하도록 돕는 안전 안내입니다.

## Official Links

- https://health.kdca.go.kr/healthinfo/biz/health/gnrlzHealthInfo/gnrlzHealthInfo/gnrlzHealthInfoView.do?cntnts_sn=5214
- https://health.kdca.go.kr/healthinfo/biz/health/gnrlzHealthInfo/gnrlzHealthInfo/gnrlzHealthInfoView.do?cntnts_sn=5293
- https://health.kdca.go.kr/healthinfo/biz/health/gnrlzHealthInfo/gnrlzHealthInfo/gnrlzHealthInfoView.do?cntnts_sn=3329
- https://health.kdca.go.kr/healthinfo/biz/health/gnrlzHealthInfo/gnrlzHealthInfo/gnrlzHealthInfoView.do?cntnts_sn=6691
- https://health.kdca.go.kr/healthinfo/biz/health/gnrlzHealthInfo/gnrlzHealthInfo/gnrlzHealthInfoView.do?cntnts_sn=6583
- https://www.mentalhealth.go.kr/portal/disease/diseaseDetail.do?dissId=66
- https://www.cdc.gov/hearher/docs/pdf/other-languages/conversation-guides/Hear-Her-Womens-Conv-Guide-Final-9-1-21_Korean.pdf
- https://health.kdca.go.kr/healthinfo/biz/health/portalUseGuidance/hlthinsReqst/hlthinsReqstMth.do?index=3
