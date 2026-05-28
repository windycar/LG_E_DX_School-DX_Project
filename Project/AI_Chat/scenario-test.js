import assert from "node:assert/strict";

process.env.PORT = "8137";
process.env.ENABLE_AI_GENERATION = "false";
process.env.ENABLE_SEMANTIC_RETRIEVAL = "false";
const { server } = await import("./index.js");

async function ask(message, history = []) {
  const response = await fetch("http://127.0.0.1:8137/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message, history }),
  });
  assert.equal(response.ok, true);
  return response.json();
}

try {
  const allowedOriginResponse = await fetch("http://127.0.0.1:8137/api/health", {
    headers: { Origin: "http://localhost:5173" },
  });
  assert.equal(allowedOriginResponse.headers.get("access-control-allow-origin"), "http://localhost:5173");

  const blockedOriginResponse = await fetch("http://127.0.0.1:8137/api/health", {
    headers: { Origin: "https://untrusted.example" },
  });
  assert.equal(blockedOriginResponse.status, 403);
  assert.notEqual(
    blockedOriginResponse.headers.get("access-control-allow-origin"),
    "https://untrusted.example",
  );

  const contactNowScenarios = [
    "배가 너무 아파요",
    "피가 나요",
    "물이 새는 것 같아요",
    "태동이 줄었어요",
    "눈앞이 흐리고 머리가 너무 아파요",
    "5분마다 배가 뭉치고 아파요",
  ];

  for (const scenario of contactNowScenarios) {
    const result = await ask(scenario);
    assert.equal(result.urgent, false, `${scenario}: contact guidance is not an emergency determination`);
    assert.equal(result.careLevel, "contact_now");
    assert.match(result.answer, /산부인과|분만 병원|응급실/);
    assert.equal(result.responseMode, "contact_now_guidance");
    assert.equal(result.sources.length > 0, true);
  }

  const emergencyScenarios = [
    "숨쉬기 힘들고 가슴이 아파요",
    "죽고 싶어요",
  ];

  for (const scenario of emergencyScenarios) {
    const result = await ask(scenario);
    assert.equal(result.urgent, true, `${scenario}: urgent response expected`);
    assert.equal(result.careLevel, "emergency");
    assert.match(result.answer, /응급실|119|112/);
    assert.equal(result.responseMode, "emergency_guidance");
    assert.equal(result.sources.length > 0, true);
  }

  const contractionQuestions = ["배에 진통있어", "진통", "배가 계속 뭉쳐요"];
  for (const scenario of contractionQuestions) {
    const result = await ask(scenario);
    assert.equal(result.careLevel, "clarify");
    assert.equal(result.responseMode, "contraction_clarifying_question");
    assert.match(result.answer, /현재 임신 몇 주/);
  }

  const greeting = await ask("안녕");
  assert.equal(greeting.responseMode, "greeting");
  assert.match(greeting.answer, /안녕하세요/);

  const shortGreeting = await ask("ㅎㅇ");
  assert.equal(shortGreeting.responseMode, "greeting");

  const medication = await ask("임신 중인데 감기약 먹어도 돼?");
  assert.equal(medication.responseMode, "medication_safety_boundary");
  assert.match(medication.answer, /산부인과나 약사/);

  const painMedication = await ask("진통제 먹어도 돼?");
  assert.equal(painMedication.responseMode, "medication_safety_boundary");

  const unspecifiedPain = await ask("배가 아파요");
  assert.equal(unspecifiedPain.responseMode, "symptom_safety_guidance");
  assert.equal(unspecifiedPain.careLevel, "clarify");
  assert.match(unspecifiedPain.answer, /상태를 더 확인/);
  assert.doesNotMatch(unspecifiedPain.answer, /https?:\/\//);

  const vagueMovement = await ask("움직임이 느껴진다요");
  assert.equal(vagueMovement.responseMode, "clarifying_question");
  assert.equal(vagueMovement.careLevel, "clarify");
  assert.match(vagueMovement.answer, /어떤 느낌/);

  const numberedMovementReply = await ask("1번이에요", [
    { role: "assistant", text: vagueMovement.answer, responseMode: vagueMovement.responseMode },
  ]);
  assert.equal(numberedMovementReply.responseMode, "fetal_movement_guidance");

  const naturalContractionReply = await ask("배가 단단해지는 느낌이에요", [
    { role: "assistant", text: vagueMovement.answer, responseMode: vagueMovement.responseMode },
  ]);
  assert.equal(naturalContractionReply.responseMode, "contraction_clarifying_question");

  const statedFetalMovement = await ask("태동이 느껴져요");
  assert.equal(statedFetalMovement.responseMode, "fetal_movement_guidance");
  assert.equal(statedFetalMovement.careLevel, "information");
  assert.match(statedFetalMovement.answer, /태동/);
  assert.equal(statedFetalMovement.sources.length, 0);

  const naturalFetalMovement = await ask("아이가 움직이는 느끼이래");
  assert.equal(naturalFetalMovement.responseMode, "fetal_movement_guidance");
  assert.equal(naturalFetalMovement.careLevel, "information");

  const contractionFollowUp = await ask("쉬면 괜찮아지고 피는 없어요", [
    {
      role: "assistant",
      text: naturalContractionReply.answer,
      responseMode: naturalContractionReply.responseMode,
    },
  ]);
  assert.equal(contractionFollowUp.responseMode, "contraction_follow_up");
  assert.equal(contractionFollowUp.careLevel, "clarify");

  const verifiedInformation = await ask("임신당뇨 검사는 언제 하나요?");
  assert.equal(verifiedInformation.responseMode, "verified_plain_language");
  assert.match(verifiedInformation.answer, /24~28주/);
  assert.doesNotMatch(verifiedInformation.answer, /https?:\/\//);

  const vitaminC = await ask("비타민 C 얼마나 먹어?");
  assert.equal(vitaminC.responseMode, "verified_plain_language");
  assert.match(vitaminC.answer, /85 mg|2,000 mg/);
  assert.match(vitaminC.answer, /쉽게 말하면/);
  assert.match(vitaminC.answer, /말 풀이/);
  assert.equal(vitaminC.sources.length > 0, true);

  const caffeine = await ask("임신 중 커피 마셔도 돼?");
  assert.equal(caffeine.responseMode, "verified_plain_language");
  assert.match(caffeine.answer, /200 mg/);
  assert.match(caffeine.answer, /쉽게 말하면/);
  assert.equal(caffeine.sources.length > 0, true);

  const dizziness = await ask("어지러워");
  assert.equal(dizziness.responseMode, "verified_plain_language");
  assert.match(dizziness.answer, /어지러/);
  assert.equal(dizziness.sources.length > 0, true);

  const heartburn = await ask("속이 쓰려");
  assert.equal(heartburn.responseMode, "verified_plain_language");
  assert.match(heartburn.answer, /속|신물|눕지/);
  assert.equal(heartburn.sources.length > 0, true);

  const urinaryPain = await ask("소변 볼 때 아파");
  assert.equal(urinaryPain.responseMode, "verified_plain_language");
  assert.match(urinaryPain.answer, /소변|산부인과/);
  assert.equal(urinaryPain.sources.length > 0, true);

  const swelling = await ask("손이 너무 부어");
  assert.equal(swelling.responseMode, "verified_plain_language");
  assert.match(swelling.answer, /붓|산부인과/);
  assert.equal(swelling.sources.length > 0, true);

  const exercise = await ask("임신 중 산책해도 돼?");
  assert.equal(exercise.responseMode, "verified_plain_language");
  assert.match(exercise.answer, /운동|걷기|산책/);
  assert.equal(exercise.sources.length > 0, true);

  const pregnancyTest = await ask("임신 테스트 방법");
  assert.equal(pregnancyTest.responseMode, "verified_plain_language");
  assert.match(pregnancyTest.answer, /임신 테스트|양성|음성/);
  assert.doesNotMatch(pregnancyTest.answer, /술|알코올|음주/);
  assert.equal(pregnancyTest.sources.length, 1);

  const topicRoutingScenarios = [
    {
      question: "술 마셔도 돼?",
      source: /술과 임신/,
      expected: /술|마시지/,
      forbidden: /임신 테스트|임테기|카페인|커피/,
    },
    {
      question: "커피 마셔도 돼?",
      source: /카페인과 임신/,
      expected: /200 mg|카페인/,
      forbidden: /술|알코올|임신 테스트/,
    },
    {
      question: "생선 먹어도 돼?",
      source: /생선/,
      expected: /생선|수은|오메가3/,
      forbidden: /카페인|술|임신 테스트/,
    },
    {
      question: "백신 맞아도 돼?",
      source: /백신/,
      expected: /백신|Tdap|독감|COVID-19/,
      forbidden: /술|카페인|임신 테스트/,
    },
    {
      question: "냉이 많아",
      source: /질 분비물/,
      expected: /냉|분비물|가렵|냄새/,
      forbidden: /술|카페인|임신 테스트/,
    },
    {
      question: "치질 생겼어",
      source: /치질/,
      expected: /치질|항문|변비/,
      forbidden: /술|카페인|임신 테스트/,
    },
    {
      question: "담배 피워도 돼?",
      source: /흡연/,
      expected: /담배|전자담배|피하는 것/,
      forbidden: /술|카페인|임신 테스트/,
    },
    {
      question: "생리가 늦고 임테기 해보려는데",
      source: /임신 초기 증상과 임신 테스트/,
      expected: /임신 테스트|양성|음성|생리/,
      forbidden: /술|카페인|수은/,
    },
    {
      question: "입덧이 심해",
      source: /입덧/,
      expected: /입덧|토|물/,
      forbidden: /술|카페인|임신 테스트/,
    },
  ];

  for (const scenario of topicRoutingScenarios) {
    const result = await ask(scenario.question);
    assert.equal(result.responseMode, "verified_plain_language", scenario.question);
    assert.equal(result.sources.some((source) => scenario.source.test(source.title)), true, scenario.question);
    assert.match(result.answer, scenario.expected, scenario.question);
    assert.doesNotMatch(result.answer, scenario.forbidden, scenario.question);
  }

  console.log("AI_Chat safety scenarios passed.");
} finally {
  server.close();
}
