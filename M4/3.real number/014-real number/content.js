window.CONTENT = {
  th: {
    landing: {
      eyebrow: "INTERACTIVE MATHEMATICS",
      title: "จำนวนจริง",
      start: "เริ่ม"
    },
    app: {
      title: "จำนวนจริง"
    },
    ui: {
      modeLabel: "โหมด",
      modeLearn: "ศึกษา",
      modeTest: "ทดสอบ",
      learnHint: "เลือกแผ่นป้ายเพื่อศึกษา",
      vennToggle: "แสดงระบบจำนวนจริงด้วยแผนภาพเวนน์",
      testInstruction: "ระบุชนิดของจำนวนต่อไปนี้ให้ถูกต้อง (ตอบได้มากกว่า 1 ชนิด)",
      shuffle: "สุ่ม",
      check: "ตรวจสอบ",
      reveal: "เฉลย",
      colItem: "ข้อ",
      colNumber: "จำนวน",
      colNatural: "จำนวนนับ",
      colInteger: "จำนวนเต็ม",
      colRational: "จำนวนตรรกยะ",
      colIrrational: "จำนวนอตรรกยะ",
      resultCorrect: "ถูกต้อง",
      resultWrong: "ยังไม่ถูกต้อง กดปุ่ม เฉลย เพื่อดูคำตอบ",
      checkIncomplete: "เลือกคำตอบอย่างน้อย 1 ช่องในทุกข้อก่อน"
    },
    definitions: {
      real:
        "เซตของจำนวนจริง ($\\mathbb{R}$) คือ เซตที่ประกอบไปด้วยเซตของจำนวนตรรกยะและเซตของจำนวนอตรรกยะ",
      rational:
        "เซตของจำนวนตรรกยะ ($\\mathbb{Q}$) คือ เซตจำนวนที่สามารถเขียนอยู่ในรูปของ $\\dfrac{a}{b}$ โดยที่ $a$ และ $b$ เป็นจำนวนเต็ม และ $b \\neq 0$<br>หรือเซตที่สมาชิกสามารถเขียนให้อยู่ในรูปเศษส่วนได้ เช่น $3,\\ \\dfrac{1}{10},\\ -1\\dfrac{3}{4},\\ 0.45,\\ 1.\\dot{5}\\dot{9},\\ \\ldots$",
      irrational:
        "เซตของจำนวนอตรรกยะ ($\\mathbb{Q}'$) คือ เซตที่ไม่ใช่จำนวนตรรกยะ หรือเซตที่สมาชิกไม่สามารถเขียนให้อยู่ในรูปเศษส่วนได้<br>เช่น $\\pi,\\ 1.3257\\ldots,\\ \\sqrt{2},\\ -\\sqrt{5},\\ \\ldots$",
      integer:
        "เซตของจำนวนเต็ม ($\\mathbb{Z}$) คือ เซตที่ประกอบไปด้วย เซตของจำนวนเต็มลบ เซตของจำนวนเต็มศูนย์ และเซตของจำนวนเต็มบวก<br><span class=\"def-box__eq\">$\\mathbb{Z} = \\{\\ldots,-3,-2,-1,0,1,2,3,\\ldots\\}$</span>",
      nonInteger:
        "เซตของจำนวนที่ไม่ใช่จำนวนเต็ม คือ เซตที่สมาชิกไม่ใช่จำนวนเต็ม เช่น $\\dfrac{1}{2},\\ -1\\dfrac{5}{6},\\ 0.67,\\ 5.\\dot{3},\\ \\ldots$",
      negative:
        "เซตของจำนวนเต็มลบ ($\\mathbb{Z}^{-}$)<br><span class=\"def-box__eq\">$\\mathbb{Z}^{-} = \\{\\ldots,-3,-2,-1\\}$</span>",
      zero:
        "เซตของจำนวนเต็มศูนย์ ($\\mathbb{Z}^{0}$)<br><span class=\"def-box__eq\">$\\mathbb{Z}^{0} = \\{0\\}$</span>",
      positive:
        "เซตของจำนวนเต็มบวก ($\\mathbb{Z}^{+}$) หรือจำนวนธรรมชาติ ($\\mathbb{N}$)<br><span class=\"def-box__eq\">$\\mathbb{Z}^{+} = \\{1,2,3,\\ldots\\}$</span>"
    },
    /**
     * คลังโจทย์ที่ตรวจชนิดแล้วทุกข้อ
     * natural = จำนวนนับ {1,2,3,...}
     * integer ⊂ rational และ irrational ∩ rational = ∅
     * bucket ใช้สุ่มให้ชนิดกระจายทุกครั้ง
     */
    questionBank: {
      naturalPos: [
        { id: "n1", latex: "5", natural: true, integer: true, rational: true, irrational: false },
        { id: "n2", latex: "\\sqrt{(-1)^{2}}", natural: true, integer: true, rational: true, irrational: false },
        { id: "n3", latex: "\\sqrt[3]{8}", natural: true, integer: true, rational: true, irrational: false },
        { id: "n4", latex: "\\sqrt{9}", natural: true, integer: true, rational: true, irrational: false },
        { id: "n5", latex: "\\dfrac{10}{2}", natural: true, integer: true, rational: true, irrational: false },
        { id: "n6", latex: "|-7|", natural: true, integer: true, rational: true, irrational: false },
        { id: "n7", latex: "(-3)^{2}", natural: true, integer: true, rational: true, irrational: false },
        { id: "n8", latex: "\\sqrt[3]{27}", natural: true, integer: true, rational: true, irrational: false },
        { id: "n9", latex: "\\sqrt{25}", natural: true, integer: true, rational: true, irrational: false },
        { id: "n10", latex: "\\dfrac{15}{3}", natural: true, integer: true, rational: true, irrational: false },
        { id: "n11", latex: "|-12|", natural: true, integer: true, rational: true, irrational: false },
        { id: "n12", latex: "(-5)^{2}", natural: true, integer: true, rational: true, irrational: false },
        { id: "n13", latex: "\\sqrt[3]{64}", natural: true, integer: true, rational: true, irrational: false },
        { id: "n14", latex: "2^{3}", natural: true, integer: true, rational: true, irrational: false },
        { id: "n15", latex: "\\dfrac{28}{4}", natural: true, integer: true, rational: true, irrational: false },
        { id: "n16", latex: "\\sqrt{49}", natural: true, integer: true, rational: true, irrational: false },
        { id: "n17", latex: "4!", natural: true, integer: true, rational: true, irrational: false },
        { id: "n18", latex: "\\left(\\dfrac{8}{2}\\right)", natural: true, integer: true, rational: true, irrational: false },
        { id: "n19", latex: "\\sqrt[4]{16}", natural: true, integer: true, rational: true, irrational: false },
        { id: "n20", latex: "3^{2}", natural: true, integer: true, rational: true, irrational: false },
        { id: "n21", latex: "\\dfrac{36}{6}", natural: true, integer: true, rational: true, irrational: false },
        { id: "n22", latex: "|-1|", natural: true, integer: true, rational: true, irrational: false }
      ],
      intNotNatural: [
        { id: "i1", latex: "0", natural: false, integer: true, rational: true, irrational: false },
        { id: "i2", latex: "-5", natural: false, integer: true, rational: true, irrational: false },
        { id: "i3", latex: "\\sqrt[3]{-8}", natural: false, integer: true, rational: true, irrational: false },
        { id: "i4", latex: "-\\sqrt{16}", natural: false, integer: true, rational: true, irrational: false },
        { id: "i5", latex: "\\dfrac{-6}{2}", natural: false, integer: true, rational: true, irrational: false },
        { id: "i6", latex: "(-2)^{3}", natural: false, integer: true, rational: true, irrational: false },
        { id: "i7", latex: "-\\sqrt[3]{64}", natural: false, integer: true, rational: true, irrational: false },
        { id: "i8", latex: "\\dfrac{0}{5}", natural: false, integer: true, rational: true, irrational: false },
        { id: "i9", latex: "-12", natural: false, integer: true, rational: true, irrational: false },
        { id: "i10", latex: "-\\sqrt{36}", natural: false, integer: true, rational: true, irrational: false },
        { id: "i11", latex: "\\dfrac{-15}{3}", natural: false, integer: true, rational: true, irrational: false },
        { id: "i12", latex: "(-4)^{3}", natural: false, integer: true, rational: true, irrational: false },
        { id: "i13", latex: "\\sqrt[3]{-27}", natural: false, integer: true, rational: true, irrational: false },
        { id: "i14", latex: "-|-9|", natural: false, integer: true, rational: true, irrational: false },
        { id: "i15", latex: "\\dfrac{0}{12}", natural: false, integer: true, rational: true, irrational: false },
        { id: "i16", latex: "-3^{2}", natural: false, integer: true, rational: true, irrational: false },
        { id: "i17", latex: "(-1)^{5}", natural: false, integer: true, rational: true, irrational: false },
        { id: "i18", latex: "-\\sqrt[3]{125}", natural: false, integer: true, rational: true, irrational: false },
        { id: "i19", latex: "\\dfrac{-20}{4}", natural: false, integer: true, rational: true, irrational: false },
        { id: "i20", latex: "-7", natural: false, integer: true, rational: true, irrational: false },
        { id: "i21", latex: "0\\times 99", natural: false, integer: true, rational: true, irrational: false },
        { id: "i22", latex: "-2^{4}", natural: false, integer: true, rational: true, irrational: false }
      ],
      nonIntRational: [
        { id: "q1", latex: "0.3", natural: false, integer: false, rational: true, irrational: false },
        { id: "q2", latex: "\\dfrac{1}{2}", natural: false, integer: false, rational: true, irrational: false },
        { id: "q3", latex: "-\\dfrac{3}{4}", natural: false, integer: false, rational: true, irrational: false },
        { id: "q4", latex: "2.5", natural: false, integer: false, rational: true, irrational: false },
        { id: "q5", latex: "\\dfrac{22}{7}", natural: false, integer: false, rational: true, irrational: false },
        { id: "q6", latex: "0.\\dot{3}", natural: false, integer: false, rational: true, irrational: false },
        { id: "q7", latex: "\\dfrac{-5}{2}", natural: false, integer: false, rational: true, irrational: false },
        { id: "q8", latex: "-1\\dfrac{5}{6}", natural: false, integer: false, rational: true, irrational: false },
        { id: "q9", latex: "\\dfrac{9}{4}", natural: false, integer: false, rational: true, irrational: false },
        { id: "q10", latex: "1.\\dot{3}", natural: false, integer: false, rational: true, irrational: false },
        { id: "q11", latex: "1.\\dot{5}\\dot{9}", natural: false, integer: false, rational: true, irrational: false },
        { id: "q12", latex: "\\dfrac{7}{3}", natural: false, integer: false, rational: true, irrational: false },
        { id: "q13", latex: "-0.25", natural: false, integer: false, rational: true, irrational: false },
        { id: "q14", latex: "\\dfrac{5}{8}", natural: false, integer: false, rational: true, irrational: false },
        { id: "q15", latex: "3\\dfrac{1}{4}", natural: false, integer: false, rational: true, irrational: false },
        { id: "q16", latex: "0.\\dot{6}", natural: false, integer: false, rational: true, irrational: false },
        { id: "q17", latex: "-\\dfrac{11}{5}", natural: false, integer: false, rational: true, irrational: false },
        { id: "q18", latex: "\\dfrac{13}{6}", natural: false, integer: false, rational: true, irrational: false },
        { id: "q19", latex: "4.75", natural: false, integer: false, rational: true, irrational: false },
        { id: "q20", latex: "-2\\dfrac{1}{3}", natural: false, integer: false, rational: true, irrational: false },
        { id: "q21", latex: "0.\\overline{12}", natural: false, integer: false, rational: true, irrational: false },
        { id: "q22", latex: "\\dfrac{-8}{3}", natural: false, integer: false, rational: true, irrational: false },
        { id: "q23", latex: "\\dfrac{16}{5}", natural: false, integer: false, rational: true, irrational: false },
        { id: "q24", latex: "0.125", natural: false, integer: false, rational: true, irrational: false },
        { id: "q25", latex: "-\\dfrac{2}{9}", natural: false, integer: false, rational: true, irrational: false },
        { id: "q26", latex: "5.\\dot{0}\\dot{1}", natural: false, integer: false, rational: true, irrational: false },
        { id: "q27", latex: "\\dfrac{100}{3}", natural: false, integer: false, rational: true, irrational: false },
        { id: "q28", latex: "-0.\\dot{7}", natural: false, integer: false, rational: true, irrational: false }
      ],
      irrational: [
        { id: "r1", latex: "\\sqrt{2}", natural: false, integer: false, rational: false, irrational: true },
        { id: "r2", latex: "\\sqrt{32}", natural: false, integer: false, rational: false, irrational: true },
        { id: "r3", latex: "\\pi", natural: false, integer: false, rational: false, irrational: true },
        { id: "r4", latex: "\\dfrac{7\\pi}{22}", natural: false, integer: false, rational: false, irrational: true },
        { id: "r5", latex: "\\sqrt{3}", natural: false, integer: false, rational: false, irrational: true },
        { id: "r6", latex: "-\\sqrt{5}", natural: false, integer: false, rational: false, irrational: true },
        { id: "r7", latex: "\\sqrt[3]{2}", natural: false, integer: false, rational: false, irrational: true },
        { id: "r8", latex: "1+\\sqrt{2}", natural: false, integer: false, rational: false, irrational: true },
        { id: "r9", latex: "\\dfrac{\\sqrt{2}}{2}", natural: false, integer: false, rational: false, irrational: true },
        { id: "r10", latex: "1.3257\\ldots", natural: false, integer: false, rational: false, irrational: true },
        { id: "r11", latex: "0.1010010001\\ldots", natural: false, integer: false, rational: false, irrational: true },
        { id: "r12", latex: "2.71828\\ldots", natural: false, integer: false, rational: false, irrational: true },
        { id: "r13", latex: "\\sqrt{7}", natural: false, integer: false, rational: false, irrational: true },
        { id: "r14", latex: "-\\sqrt{11}", natural: false, integer: false, rational: false, irrational: true },
        { id: "r15", latex: "\\sqrt[3]{5}", natural: false, integer: false, rational: false, irrational: true },
        { id: "r16", latex: "\\sqrt{8}", natural: false, integer: false, rational: false, irrational: true },
        { id: "r17", latex: "3+\\sqrt{5}", natural: false, integer: false, rational: false, irrational: true },
        { id: "r18", latex: "\\dfrac{\\pi}{2}", natural: false, integer: false, rational: false, irrational: true },
        { id: "r19", latex: "\\sqrt{2}+\\sqrt{3}", natural: false, integer: false, rational: false, irrational: true },
        { id: "r20", latex: "-\\dfrac{\\sqrt{3}}{3}", natural: false, integer: false, rational: false, irrational: true },
        { id: "r21", latex: "\\sqrt[4]{7}", natural: false, integer: false, rational: false, irrational: true },
        { id: "r22", latex: "\\sqrt{50}", natural: false, integer: false, rational: false, irrational: true },
        { id: "r23", latex: "2\\pi", natural: false, integer: false, rational: false, irrational: true },
        { id: "r24", latex: "1-\\sqrt{2}", natural: false, integer: false, rational: false, irrational: true },
        { id: "r25", latex: "\\sqrt[3]{-4}", natural: false, integer: false, rational: false, irrational: true },
        { id: "r26", latex: "0.1234567891011\\ldots", natural: false, integer: false, rational: false, irrational: true },
        { id: "r27", latex: "\\dfrac{\\sqrt{5}}{2}", natural: false, integer: false, rational: false, irrational: true },
        { id: "r28", latex: "-3\\sqrt{2}", natural: false, integer: false, rational: false, irrational: true },
        { id: "r29", latex: "\\sqrt{12}", natural: false, integer: false, rational: false, irrational: true },
        { id: "r30", latex: "\\pi+1", natural: false, integer: false, rational: false, irrational: true }
      ]
    }
  }
};
