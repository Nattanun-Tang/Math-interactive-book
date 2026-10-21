window.CONTENT = {
  th: {
    landing: {
      eyebrow: "INTERACTIVE MATHEMATICS",
      title: "พื้นที่แรเงาบนแผนภาพเวนน์",
      start: "เริ่ม"
    },
    app: {
      title: "พื้นที่แรเงาบนแผนภาพเวนน์"
    },
    ui: {
      modeLabel: "โหมด",
      explore: "สำรวจ",
      shade: "แรเงา",
      setsLabel: "จำนวนเซต",
      twoSets: "2 เซต",
      threeSets: "3 เซต",
      hint: "เลือกที่แผนภาพ\nเพื่อแรเงาหรือยกเลิก",
      write: "เขียนเซต",
      resultLead: "เขียนเซตจากพื้นที่แรเงาได้เป็น",
      shadeResultLead: "พื้นที่แรเงาของ",
      reset: "ล้างแรเงา",
      empty: "\\varnothing",
      tilesLabel: "สร้างนิพจน์ด้วยแผ่นป้าย",
      exprLabel: "นิพจน์ :",
      exprBackspace: "ลบ",
      exprClear: "ล้างนิพจน์",
      shadeApply: "แรเงา",
      exprInvalid: "เขียนเซตไม่ถูกต้องตามหลักการ",
      exprEmptyHint: "เลือกแผ่นป้ายเพื่อสร้างนิพจน์"
    },
    atoms2: {
      onlyA: "A \\cap B'",
      onlyB: "A' \\cap B",
      ab: "A \\cap B",
      outside: "(A \\cup B)'"
    },
    atoms3: {
      onlyA: "A \\cap B' \\cap C'",
      onlyB: "A' \\cap B \\cap C'",
      onlyC: "A' \\cap B' \\cap C",
      ab: "A \\cap B \\cap C'",
      ac: "A \\cap C \\cap B'",
      bc: "B \\cap C \\cap A'",
      abc: "A \\cap B \\cap C",
      outside: "(A \\cup B \\cup C)'"
    },
    expressions2: [
      { regions: [], latex: "\\varnothing" },
      { regions: ["onlyA"], latex: "A - B" },
      { regions: ["onlyB"], latex: "B - A" },
      { regions: ["onlyA", "onlyB"], latex: "(A - B) \\cup (B - A)" },
      { regions: ["ab"], latex: "A \\cap B" },
      { regions: ["onlyA", "ab"], latex: "A" },
      { regions: ["onlyB", "ab"], latex: "B" },
      { regions: ["onlyA", "onlyB", "ab"], latex: "A \\cup B" },
      { regions: ["outside"], latex: "(A \\cup B)'" },
      { regions: ["onlyA", "outside"], latex: "B'" },
      { regions: ["onlyB", "outside"], latex: "A'" },
      { regions: ["onlyA", "onlyB", "outside"], latex: "(A \\cap B)'" },
      { regions: ["ab", "outside"], latex: "(A \\cap B) \\cup (A \\cup B)'" },
      { regions: ["onlyA", "ab", "outside"], latex: "A \\cup B'" },
      { regions: ["onlyB", "ab", "outside"], latex: "B \\cup A'" },
      { regions: ["onlyA", "onlyB", "ab", "outside"], latex: "U" }
    ],
    expressions3: [
      { regions: [], latex: "\\varnothing" },
      { regions: ["onlyA", "ab", "ac", "abc"], latex: "A" },
      { regions: ["onlyB", "ab", "bc", "abc"], latex: "B" },
      { regions: ["onlyC", "ac", "bc", "abc"], latex: "C" },
      { regions: ["ab", "abc"], latex: "A \\cap B" },
      { regions: ["ac", "abc"], latex: "A \\cap C" },
      { regions: ["bc", "abc"], latex: "B \\cap C" },
      { regions: ["abc"], latex: "A \\cap B \\cap C" },
      { regions: ["ab"], latex: "(A \\cap B) - C" },
      { regions: ["ac"], latex: "(A \\cap C) - B" },
      { regions: ["bc"], latex: "(B \\cap C) - A" },
      { regions: ["onlyA"], latex: "A - (B \\cup C)" },
      { regions: ["onlyB"], latex: "B - (A \\cup C)" },
      { regions: ["onlyC"], latex: "C - (A \\cup B)" },
      { regions: ["onlyA", "onlyB", "onlyC", "ab", "ac", "bc", "abc"], latex: "A \\cup B \\cup C" },
      { regions: ["outside"], latex: "(A \\cup B \\cup C)'" },
      { regions: ["onlyB", "onlyC", "bc", "outside"], latex: "A'" },
      { regions: ["onlyA", "onlyC", "ac", "outside"], latex: "B'" },
      { regions: ["onlyA", "onlyB", "ab", "outside"], latex: "C'" },
      { regions: ["ab", "ac", "abc"], latex: "A \\cap (B \\cup C)" },
      { regions: ["ac", "bc", "abc"], latex: "(A \\cup B) \\cap C" },
      { regions: ["onlyA", "ac"], latex: "A - B" },
      { regions: ["onlyB", "bc"], latex: "B - A" },
      { regions: ["onlyA", "onlyB", "ab", "ac", "bc", "abc"], latex: "A \\cup B" },
      { regions: ["onlyA", "onlyC", "ab", "ac", "bc", "abc"], latex: "A \\cup C" },
      { regions: ["onlyB", "onlyC", "ab", "ac", "bc", "abc"], latex: "B \\cup C" },
      { regions: ["onlyA", "onlyB", "ab"], latex: "(A \\cup B) - C" },
      { regions: ["onlyA", "onlyB", "ac", "bc"], latex: "(A - B) \\cup (B - A)" },
      { regions: ["onlyA", "onlyB", "onlyC", "ab", "ac", "bc", "abc", "outside"], latex: "U" }
    ]
  }
};
