window.CONTENT = {
  th: {
    landing: {
      eyebrow: "INTERACTIVE MATHEMATICS",
      title: "สมบัติของจำนวนจริง",
      start: "เริ่ม"
    },
    app: {
      title: "สมบัติเกี่ยวกับระบบจำนวนจริง"
    },
    ui: {
      modeLabel: "โหมด",
      modeLearn: "ศึกษา",
      modeTest: "ทดสอบ",
      categoryLabel: "ตัวเลือก",
      learnHintEquality: "เลือกสมบัติเพื่อศึกษาตัวอย่าง",
      learnHintSystem: "เลือกสมบัติเพื่อศึกษาตัวอย่าง<br>ให้ $a$, $b$ และ $c$ เป็นจำนวนจริง จะได้ว่า",
      learnHintDefinition: "เลือกบทนิยามเพื่อศึกษาตัวอย่าง",
      learnHintTheorem: "เลือกทฤษฎีบทเพื่อศึกษาตัวอย่าง",
      exampleTitle: "ตัวอย่าง",
      colAddition: "การบวก",
      colMultiplication: "การคูณ",
      testInstruction:
        "ระบุสมบัติของเซตและการดำเนินการต่อไปนี้ให้ถูกต้อง (ตอบได้มากกว่า 1 สมบัติ)",
      quizPropHeader: "สมบัติ",
      check: "ตรวจสอบ",
      reveal: "เฉลย",
      resultCorrect: "ถูกต้อง",
      resultWrong: "ยังไม่ถูกต้อง กดปุ่ม เฉลย เพื่อดูคำตอบละเอียด",
      solutionTitle: "เฉลยละเอียด",
      hasProperty: "มีสมบัตินี้",
      noProperty: "ไม่มีสมบัตินี้",
      counterPrefix: "ตัวอย่างค้าน",
      progress: "ข้อ {n}/{total}"
    },
    categories: [
      {
        id: "equality",
        label: "สมบัติการเท่ากัน",
        layout: "list",
        hintKey: "learnHintEquality",
        items: [
          {
            id: "eq1",
            title: "สมบัติการสะท้อน",
            statement: "ถ้า $a$ เป็นจำนวนจริง แล้ว $a = a$",
            examples: ["$3 = 3$", "$x + 1 = x + 1$", "$5 - \\sqrt{7} = 5 - \\sqrt{7}$"]
          },
          {
            id: "eq2",
            title: "สมบัติการสมมาตร",
            statement: "ให้ $a$ และ $b$ เป็นจำนวนจริง ถ้า $a = b$ แล้ว $b = a$",
            examples: [
              "ถ้า $x = 7$ แล้ว $7 = x$",
              "ถ้า $8 + 1 = 9$ แล้ว $9 = 8 + 1$",
              "ถ้า $y = 2t + s$ แล้ว $2t + s = y$"
            ]
          },
          {
            id: "eq3",
            title: "สมบัติการถ่ายทอด",
            statement:
              "ให้ $a$, $b$ และ $c$ เป็นจำนวนจริง ถ้า $a = b$ และ $b = c$ แล้ว $a = c$",
            examples: [
              "ถ้า $p = 4 + 3$ และ $4 + 3 = 7$ แล้ว $p = 7$",
              "ถ้า $a = s$ และ $s = h$ แล้ว $a = h$",
              "ถ้า $3 = 2f + 3g$ และ $2f + 3g = \\sqrt{9}$ แล้ว $3 = \\sqrt{9}$"
            ]
          },
          {
            id: "eq4",
            title: "สมบัติการบวกด้วยจำนวนที่เท่ากัน",
            statement:
              "ให้ $a$, $b$ และ $c$ เป็นจำนวนจริง ถ้า $a = b$ แล้ว $a + c = b + c$",
            examples: [
              "ถ้า $a = 7$ แล้ว $a + 3 = 7 + 3$<br>หรือ $a + 3 = 10$",
              "ถ้า $x - 7 = 2$ แล้ว $(x - 7) + 16 = 2 + 16$<br>หรือ $x + 9 = 18$",
              "ถ้า $k = m - 1$ แล้ว $k + 4 = (m - 1) + 4$<br>หรือ $k + 4 = m + 3$"
            ]
          },
          {
            id: "eq5",
            title: "สมบัติการคูณด้วยจำนวนที่เท่ากัน",
            statement:
              "ให้ $a$, $b$ และ $c$ เป็นจำนวนจริง ถ้า $a = b$ แล้ว $ac = bc$",
            examples: [
              "ถ้า $n = 5$ แล้ว $3n = 3(5)$<br>หรือ $3n = 15$",
              "ถ้า $2t = 3k$ แล้ว $-3(2t) = -3(3k)$<br>หรือ $-6t = -9k$",
              "ถ้า $y = 5x + 8$ แล้ว $2y = 2(5x + 8)$<br>หรือ $2y = 10x + 16$"
            ]
          }
        ]
      },
      {
        id: "system",
        label: "สมบัติของระบบจำนวนจริง",
        layout: "table",
        hintKey: "learnHintSystem",
        rows: [
          {
            id: "closure",
            name: "สมบัติปิด",
            add: {
              id: "sys1",
              num: 1,
              latex: "a + b \\in \\mathbb{R}",
              title: "1. สมบัติปิดการบวก",
              body: [
                "ตัวอย่าง ให้ $a$ และ $b$ เป็นจำนวนจริง โดยที่ $a = 13$ และ $b = 7$",
                "จะได้ $a + b = 13 + 7 = 20$",
                "ซึ่ง $20$ เป็นจำนวนจริง"
              ]
            },
            mul: {
              id: "sys6",
              num: 6,
              latex: "ab \\in \\mathbb{R}",
              title: "6. สมบัติปิดการคูณ",
              body: [
                "ตัวอย่าง ให้ $a$ และ $b$ เป็นจำนวนจริง โดยที่ $a = -2$ และ $b = 12$",
                "จะได้ $ab = (-2)(12) = -24$",
                "ซึ่ง $-24$ เป็นจำนวนจริง"
              ]
            }
          },
          {
            id: "commutative",
            name: "สมบัติการสลับที่",
            add: {
              id: "sys2",
              num: 2,
              latex: "a + b = b + a",
              title: "2. สมบัติสลับที่การบวก",
              body: [
                "ตัวอย่าง ให้ $a = 2$ และ $b = 8$",
                "จะได้ $a + b = 2 + 8 = 10$",
                "และ $b + a = 8 + 2 = 10$",
                "ดังนั้น $a + b = b + a$"
              ]
            },
            mul: {
              id: "sys7",
              num: 7,
              latex: "ab = ba",
              title: "7. สมบัติสลับที่การคูณ",
              body: [
                "ตัวอย่าง ให้ $a = 5$ และ $b = 4$",
                "จะได้ $ab = (5)(4) = 20$",
                "และ $ba = (4)(5) = 20$",
                "ดังนั้น $ab = ba$"
              ]
            }
          },
          {
            id: "associative",
            name: "สมบัติการเปลี่ยนกลุ่ม",
            add: {
              id: "sys3",
              num: 3,
              latex: "(a + b) + c = a + (b + c)",
              title: "3. สมบัติการเปลี่ยนกลุ่มการบวก",
              body: [
                "ตัวอย่าง ให้ $a = 5$, $b = 7$ และ $c = 9$",
                "จะได้ $(a + b) + c = (5 + 7) + 9 = 12 + 9 = 21$",
                "และ $a + (b + c) = 5 + (7 + 9) = 5 + 16 = 21$",
                "ดังนั้น $(a + b) + c = a + (b + c)$"
              ]
            },
            mul: {
              id: "sys8",
              num: 8,
              latex: "(ab)c = a(bc)",
              title: "8. สมบัติการเปลี่ยนกลุ่มการคูณ",
              body: [
                "ตัวอย่าง ให้ $a = 1$, $b = 2$ และ $c = 8$",
                "จะได้ $(ab)c = [(1)(2)](8) = (2)(8) = 16$",
                "และ $a(bc) = (1)[(2)(8)] = (1)(16) = 16$",
                "ดังนั้น $(ab)c = a(bc)$"
              ]
            }
          },
          {
            id: "identity",
            name: "สมบัติการมีเอกลักษณ์",
            add: {
              id: "sys4",
              num: 4,
              latex: "a + 0 = a = 0 + a",
              note: "เรียก $0$ ว่าเอกลักษณ์การบวก",
              title: "4. สมบัติการมีเอกลักษณ์การบวก",
              body: [
                "ตัวอย่าง ให้ $a = 8$",
                "จะมี $0$ ที่ทำให้ $8 + 0 = 8$",
                "และ $0 + 8 = 8$",
                "ดังนั้น $0$ เป็นเอกลักษณ์การบวก"
              ]
            },
            mul: {
              id: "sys9",
              num: 9,
              latex: "a \\times 1 = a = 1 \\times a",
              note: "เรียก $1$ ว่าเอกลักษณ์การคูณ",
              title: "9. สมบัติการมีเอกลักษณ์การคูณ",
              body: [
                "ตัวอย่าง ให้ $a = 4$",
                "จะมี $1$ ที่ทำให้ $4 \\times 1 = 4$",
                "และ $1 \\times 4 = 4$",
                "ดังนั้น $1$ เป็นเอกลักษณ์การคูณ"
              ]
            }
          },
          {
            id: "inverse",
            name: "สมบัติการมีผกผัน",
            add: {
              id: "sys5",
              num: 5,
              latex: "a + (-a) = 0 = (-a) + a",
              note: "เรียก $-a$ ว่าผกผันการบวกของ $a$",
              title: "5. สมบัติการมีผกผันการบวก",
              body: [
                "ตัวอย่าง ให้ $a = 6$",
                "จะมี $-6$ ที่ทำให้ $6 + (-6) = 0$",
                "และ $(-6) + 6 = 0$",
                "ดังนั้น $-6$ เป็นผกผันการบวกของ $6$"
              ]
            },
            mul: {
              id: "sys10",
              num: 10,
              latex: "a \\times a^{-1} = 1 = a^{-1} \\times a",
              note: "เรียก $a^{-1}$ ว่าผกผันการคูณของ $a$ เมื่อ $a \\neq 0$",
              title: "10. สมบัติการมีผกผันการคูณ",
              body: [
                "ตัวอย่าง ให้ $a = 2$",
                "จะมี $\\dfrac{1}{2}$ ที่ทำให้ $2\\left(\\dfrac{1}{2}\\right) = 1$",
                "และ $\\left(\\dfrac{1}{2}\\right)2 = 1$",
                "ดังนั้น $\\dfrac{1}{2}$ เป็นผกผันการคูณของ $2$"
              ]
            }
          },
          {
            id: "distributive",
            name: "สมบัติการแจกแจง",
            span: {
              id: "sys11",
              num: 11,
              latex: "a(b + c) = ab + ac \\text{ และ } (a + b)c = ac + bc",
              title: "11. สมบัติการแจกแจง",
              body: [
                "ตัวอย่าง ให้ $a = 2$, $b = 3$ และ $c = 5$",
                "จะได้ $a(b + c) = 2(3 + 5) = 2(8) = 16$",
                "และ $ab + ac = (2)(3) + (2)(5) = 6 + 10 = 16$",
                "ดังนั้น $a(b + c) = ab + ac$"
              ]
            }
          }
        ]
      },
      {
        id: "definition",
        label: "บทนิยาม",
        layout: "list",
        hintKey: "learnHintDefinition",
        items: [
          {
            id: "def1",
            title: "บทนิยาม 1",
            statement:
              "ให้ $a$ และ $b$ เป็นจำนวนจริง<br>$a$ ลบด้วย $b$ เขียนแทนด้วย $a - b$ โดยที่ $a - b = a + (-b)$",
            examples: ["$5 - 7 = 5 + (-7)$", "$x - 4 = x + (-4)$", "$x - y = x + (-y)$"]
          },
          {
            id: "def2",
            title: "บทนิยาม 2",
            statement:
              "ให้ $a$ และ $b$ เป็นจำนวนจริง โดยที่ $b \\neq 0$<br>$a$ หารด้วย $b$ เขียนแทนด้วย $\\dfrac{a}{b}$ โดยที่ $\\dfrac{a}{b} = ab^{-1}$",
            examples: [
              "$\\dfrac{3}{2} = 3(2)^{-1}$",
              "$\\dfrac{-8}{x} = -8x^{-1}$",
              "$\\dfrac{h}{k} = hk^{-1}$"
            ]
          }
        ]
      },
      {
        id: "theorem1",
        label: "ทฤษฎีบท (1)",
        layout: "list",
        hintKey: "learnHintTheorem",
        items: [
          {
            id: "th1",
            title: "ทฤษฎีบทที่ 1 กฎการตัดออกสำหรับการบวก",
            statement:
              "ให้ $a$, $b$ และ $c$ เป็นจำนวนจริง<br>1. ถ้า $a + c = b + c$ แล้ว $a = b$<br>2. ถ้า $a + b = a + c$ แล้ว $b = c$",
            examples: [
              "ถ้า $a + 3 = b + 3$ แล้ว $(a + 3) - 3 = (b + 3) - 3$<br>หรือ $a = b$",
              "ถ้า $c + 7 = d + 2$ แล้ว $(c + 7) - 7 = (d + 2) - 7$<br>หรือ $c = d - 5$",
              "ถ้า $1 + m = 1 + n$ แล้ว $-1 + (1 + m) = -1 + (1 + n)$<br>หรือ $m = n$",
              "ถ้า $5 + x = -3 + y$ แล้ว $-5 + (5 + x) = -5 + (-3 + y)$<br>หรือ $x = -8 + y$"
            ]
          },
          {
            id: "th2",
            title: "ทฤษฎีบทที่ 2 กฎการตัดออกสำหรับการคูณ",
            statement:
              "ให้ $a$, $b$ และ $c$ เป็นจำนวนจริง<br>1. ถ้า $ac = bc$ และ $c \\neq 0$ แล้ว $a = b$<br>2. ถ้า $ab = ac$ และ $a \\neq 0$ แล้ว $b = c$",
            examples: [
              "ถ้า $ak = bk$ และ $k \\neq 0$ แล้ว $a = b$",
              "ถ้า $c(mn) = d(mn)$ และ $mn \\neq 0$ แล้ว $c = d$",
              "ถ้า $3m = 3n$ แล้ว $m = n$",
              "ถ้า $4x = 8y$ หรือ $4x = 4(2y)$ แล้ว $x = 2y$"
            ]
          }
        ]
      },
      {
        id: "theorem2",
        label: "ทฤษฎีบท (2)",
        layout: "list",
        hintKey: "learnHintTheorem",
        items: [
          {
            id: "th3",
            title: "ทฤษฎีบทที่ 3",
            statement: "ให้ $a$ เป็นจำนวนจริง จะได้ $a \\times 0 = 0$",
            examples: ["$3 \\times 0 = 0$", "$(-10) \\times 0 = 0$", "$k \\times 0 = 0$"]
          },
          {
            id: "th4",
            title: "ทฤษฎีบทที่ 4",
            statement: "ให้ $a$ เป็นจำนวนจริง จะได้ $(-1)a = -a$",
            examples: ["$(-1)(7) = -7$", "$(-1)m = -m$", "$(-1)xyz = -xyz$"]
          },
          {
            id: "th5",
            title: "ทฤษฎีบทที่ 5",
            statement:
              "ให้ $a$ และ $b$ เป็นจำนวนจริง จะได้ $ab = 0$ ก็ต่อเมื่อ $a = 0$ หรือ $b = 0$",
            examples: [
              "$mn = 0$ ก็ต่อเมื่อ $m = 0$<br>หรือ $n = 0$",
              "$(x - 1)(x - 2) = 0$ ก็ต่อเมื่อ $x - 1 = 0$<br>หรือ $x - 2 = 0$",
              "$(x - h)(y - k) = 0$ ก็ต่อเมื่อ $x - h = 0$<br>หรือ $y - k = 0$"
            ]
          },
          {
            id: "th6",
            title: "ทฤษฎีบทที่ 6",
            statement:
              "ให้ $a$ และ $b$ เป็นจำนวนจริง จะได้ว่า<br>1. $a(-b) = -ab$<br>2. $(-a)b = -ab$<br>3. $(-a)(-b) = ab$",
            examples: [
              "$(3)(-7) = -(3)(7)$ หรือ $(3)(-7) = -21$",
              "$(6)(-x) = -(6)(x)$ หรือ $(6)(-x) = -6x$",
              "$(-8)(2) = -(8)(2)$ หรือ $(-8)(2) = -16$",
              "$(-b)(1) = -(b)(1)$ หรือ $(-b)(1) = -b$",
              "$(-4)(-3) = (4)(3)$ หรือ $(-4)(-3) = 12$",
              "$(-m)(-n) = (m)(n)$ หรือ $(-m)(-n) = mn$"
            ]
          }
        ]
      },
      {
        id: "theorem3",
        label: "ทฤษฎีบท (3)",
        layout: "list",
        hintKey: "learnHintTheorem",
        items: [
          {
            id: "th7",
            title: "ทฤษฎีบทที่ 7",
            statement:
              "ให้ $a$, $b$ และ $c$ เป็นจำนวนจริง จะได้ว่า<br>1. $a(b - c) = ab - ac$<br>2. $(a - b)c = ac - bc$",
            examples: [
              "$3(a - b) = 3a - 3b$",
              "$-2(x - y) = -2x - (-2)y$<br>หรือ $-2(x - y) = -2x + 2y$",
              "$(m - n)5 = 5m - 5n$",
              "$(2s - 7t)(4) = (2s)(4) - (7t)(4)$<br>หรือ $(2s - 7t)(4) = 8s - 28t$"
            ]
          },
          {
            id: "th8",
            title: "ทฤษฎีบทที่ 8",
            statement: "ให้ $a$ เป็นจำนวนจริง ถ้า $a \\neq 0$ แล้ว $a^{-1} \\neq 0$",
            examples: [
              "ให้ $a = 2$ แล้ว $a^{-1} = \\dfrac{1}{2}$ ซึ่งไม่เท่ากับ $0$",
              "ให้ $a = \\dfrac{1}{5}$ แล้ว $a^{-1} = 5$ ซึ่งไม่เท่ากับ $0$",
              "ให้ $a = 0.2$ แล้ว $a^{-1} = 5$ ซึ่งไม่เท่ากับ $0$"
            ]
          }
        ]
      },
      {
        id: "theorem4",
        label: "ทฤษฎีบท (4)",
        layout: "list",
        hintKey: "learnHintTheorem",
        items: [
          {
            id: "th9",
            title: "ทฤษฎีบทที่ 9",
            statement:
              "ให้ $a$, $b$, $c$ และ $d$ เป็นจำนวนจริง จะได้ว่า<br>" +
              "1. $\\dfrac{\\left(\\dfrac{a}{b}\\right)}{c} = \\dfrac{a}{bc}$ เมื่อ $b \\neq 0$ และ $c \\neq 0$<br>" +
              "2. $\\dfrac{a}{\\left(\\dfrac{b}{c}\\right)} = \\dfrac{ac}{b}$ เมื่อ $b \\neq 0$ และ $c \\neq 0$<br>" +
              "3. $\\dfrac{a}{b} + \\dfrac{c}{d} = \\dfrac{ad + bc}{bd}$ เมื่อ $b \\neq 0$ และ $d \\neq 0$<br>" +
              "4. $\\left(\\dfrac{a}{b}\\right)\\left(\\dfrac{c}{d}\\right) = \\dfrac{ac}{bd}$ เมื่อ $b \\neq 0$ และ $d \\neq 0$<br>" +
              "5. $\\left(\\dfrac{b}{c}\\right)^{-1} = \\dfrac{c}{b}$ เมื่อ $b \\neq 0$ และ $c \\neq 0$<br>" +
              "6. $\\dfrac{\\left(\\dfrac{a}{b}\\right)}{\\left(\\dfrac{c}{d}\\right)} = \\dfrac{ad}{bc}$ เมื่อ $b \\neq 0$, $c \\neq 0$ และ $d \\neq 0$",
            examples: [
              "$\\dfrac{\\left(\\dfrac{2}{3}\\right)}{4} = \\dfrac{2}{(3)(4)} = \\dfrac{2}{12}$",
              "$\\dfrac{-1}{\\left(\\dfrac{9}{7}\\right)} = \\dfrac{(-1)(7)}{9} = \\dfrac{-7}{9}$",
              "$\\dfrac{3}{4} + \\dfrac{2}{5} = \\dfrac{(3)(5) + (2)(4)}{(4)(5)} = \\dfrac{23}{20}$",
              "$\\left(\\dfrac{5}{7}\\right)\\left(\\dfrac{-1}{8}\\right) = \\dfrac{(5)(-1)}{(7)(8)} = \\dfrac{-5}{56}$",
              "$\\left(\\dfrac{6}{7}\\right)^{-1} = \\dfrac{7}{6}$",
              "$\\dfrac{\\left(\\dfrac{4}{5}\\right)}{\\left(\\dfrac{3}{8}\\right)} = \\dfrac{(4)(8)}{(5)(3)} = \\dfrac{32}{15}$"
            ]
          }
        ]
      }
    ],
    propertyKeys: ["add", "sub", "mul", "div"],
    propertyLabels: {
      add: "สมบัติปิดของการบวก",
      sub: "สมบัติปิดของการลบ",
      mul: "สมบัติปิดของการคูณ",
      div: "สมบัติปิดของการหาร"
    },
    questions: [
      {
        id: "q1",
        setLabel: "เซตของจำนวนคี่",
        setLatex: null,
        correct: { add: false, sub: false, mul: true, div: false },
        solutions: {
          add: {
            ok: false,
            detail:
              "จำนวนคี่บวกจำนวนคี่ได้จำนวนคู่ เช่น $1 + 3 = 4$ และ $4$ ไม่ใช่จำนวนคี่"
          },
          sub: {
            ok: false,
            detail:
              "จำนวนคี่ลบจำนวนคี่ได้จำนวนคู่ เช่น $5 - 1 = 4$ และ $4$ ไม่ใช่จำนวนคี่"
          },
          mul: {
            ok: true,
            detail: "จำนวนคี่คูณจำนวนคี่ได้จำนวนคี่เสมอ เช่น $3 \\times 5 = 15$"
          },
          div: {
            ok: false,
            detail:
              "เช่น $1 \\div 3 = \\dfrac{1}{3}$ ซึ่งไม่ใช่จำนวนคี่ (และไม่ใช่จำนวนเต็ม)"
          }
        }
      },
      {
        id: "q2",
        setLabel: "เซตของจำนวนเต็มลบ",
        setLatex: null,
        correct: { add: true, sub: false, mul: false, div: false },
        solutions: {
          add: {
            ok: true,
            detail:
              "จำนวนเต็มลบสองจำนวนบวกกันยังได้จำนวนเต็มลบ เช่น $(-2) + (-5) = -7$"
          },
          sub: {
            ok: false,
            detail:
              "เช่น $(-2) - (-5) = 3$ ซึ่ง $3$ ไม่ใช่จำนวนเต็มลบ"
          },
          mul: {
            ok: false,
            detail:
              "เช่น $(-2) \\times (-3) = 6$ ซึ่ง $6$ ไม่ใช่จำนวนเต็มลบ"
          },
          div: {
            ok: false,
            detail:
              "เช่น $(-6) \\div (-2) = 3$ ซึ่ง $3$ ไม่ใช่จำนวนเต็มลบ"
          }
        }
      },
      {
        id: "q3",
        setLabel: null,
        setLatex: "\\{-1,\\ 0,\\ 1\\}",
        correct: { add: false, sub: false, mul: true, div: false },
        solutions: {
          add: {
            ok: false,
            detail: "เช่น $1 + 1 = 2$ และ $2 \\notin \\{-1, 0, 1\\}$"
          },
          sub: {
            ok: false,
            detail: "เช่น $1 - (-1) = 2$ และ $2 \\notin \\{-1, 0, 1\\}$"
          },
          mul: {
            ok: true,
            detail:
              "ผลคูณของสมาชิกใด ๆ ในเซตนี้ยังอยู่ในเซต เช่น $(-1)(-1) = 1$, $0 \\times 1 = 0$"
          },
          div: {
            ok: false,
            detail:
              "เซตนี้มี $0$ เป็นสมาชิก การหารด้วย $0$ ไม่ได้กำหนด เช่น $1 \\div 0$ จึงไม่มีสมบัติปิดของการหาร"
          }
        }
      },
      {
        id: "q4",
        setLabel: "เซตของจำนวนจริง",
        setLatex: null,
        correct: { add: true, sub: true, mul: true, div: false },
        solutions: {
          add: {
            ok: true,
            detail: "ผลบวกของจำนวนจริงสองจำนวนใด ๆ เป็นจำนวนจริงเสมอ"
          },
          sub: {
            ok: true,
            detail: "ผลต่างของจำนวนจริงสองจำนวนใด ๆ เป็นจำนวนจริงเสมอ"
          },
          mul: {
            ok: true,
            detail: "ผลคูณของจำนวนจริงสองจำนวนใด ๆ เป็นจำนวนจริงเสมอ"
          },
          div: {
            ok: false,
            detail:
              "เซตของจำนวนจริงมี $0$ เป็นสมาชิก การหารด้วย $0$ ไม่ได้กำหนด เช่น $1 \\div 0$ จึงไม่มีสมบัติปิดของการหาร"
          }
        }
      },
      {
        id: "q5",
        setLabel: null,
        setLatex: "\\{5,\\ 10,\\ 15,\\ 20,\\ \\ldots\\}",
        correct: { add: true, sub: false, mul: true, div: false },
        solutions: {
          add: {
            ok: true,
            detail:
              "ผลบวกของพหุคูณของ $5$ ยังเป็นพหุคูณของ $5$ เช่น $10 + 15 = 25$"
          },
          sub: {
            ok: false,
            detail:
              "เช่น $5 - 10 = -5$ และ $-5$ ไม่อยู่ในเซต $\\{5, 10, 15, 20, \\ldots\\}$"
          },
          mul: {
            ok: true,
            detail:
              "ผลคูณของพหุคูณของ $5$ ยังเป็นพหุคูณของ $5$ เช่น $5 \\times 10 = 50$"
          },
          div: {
            ok: false,
            detail:
              "เช่น $10 \\div 5 = 2$ และ $2$ ไม่อยู่ในเซต $\\{5, 10, 15, 20, \\ldots\\}$"
          }
        }
      }
    ]
  }
};
