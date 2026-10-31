window.CONTENT = {
  th: {
    landing: {
      eyebrow: "INTERACTIVE MATHEMATICS",
      title: "การแยกเศษส่วนย่อย",
      start: "เริ่ม"
    },
    app: {
      title: "การแยกเศษส่วนย่อย"
    },
    ui: {
      mode: "โหมด",
      bridge: "หลักการ",
      learn: "ศึกษา",
      test: "ทดสอบ",
      typeLabel: "ประเภทโจทย์",
      pagerLabel: "ข้อ {n}/{total}",
      prev: "ก่อนหน้า",
      next: "ถัดไป",
      check: "ตรวจสอบ",
      reveal: "เฉลย",
      random: "สุ่มโจทย์",
      reset: "ล้าง",
      combine: "รวมเศษส่วน",
      decompose: "แยกเศษส่วนย่อย",
      bridgeLead:
        "เราเรียนการบวกและลบเศษส่วนพหุนามมาแล้ว การแยกเศษส่วนย่อยคือกระบวนการย้อนกลับของการบวกและลบเศษส่วนพหุนาม",
      partsLabel: "เศษส่วนย่อย",
      combinedLabel: "เศษส่วนรวม",
      partsCaption: "ผลบวก/ลบของเศษส่วนง่าย ๆ",
      combinedCaption: "เศษส่วนเดียวที่มีตัวส่วนซับซ้อน",
      arrowCombine: "รวม →",
      arrowDecompose: "← แยก",
      combineWalkTitle: "รวมเศษส่วน",
      decomposeWalkTitle: "ทิศแยก: แยกเศษส่วนย่อย (ย้อนกลับจากการบวก)",
      bridgeTakeawayCombine:
        "สรุป: รวมแล้วได้เศษส่วนเดียว — การแยกเศษส่วนย่อยคือการเดินย้อนเส้นทางนี้กลับไปหาเศษส่วนย่อย",
      bridgeTakeawayDecompose:
        "สรุป: เริ่มจากเศษส่วนรวม แล้วหา $A,B$ ให้ได้เศษส่วนย่อย — โหมดศึกษาจะสอนวิธีตั้งรูปและหาค่าสัมประสิทธิ์",
      bridgeStepStartParts: "เริ่มจากเศษส่วนย่อย",
      bridgeStepLcd: "หา ค.ร.น. ของตัวส่วน",
      bridgeStepRewrite: "ทำตัวส่วนให้เท่ากันโดยการคูณ ค.ร.น.",
      bridgeStepAdd: "รวมตัวเศษเข้าด้วยกัน",
      bridgeStepResult: "ได้เศษส่วนรวม",
      bridgeStepStartCombined: "เริ่มจากเศษส่วนรวม",
      bridgeStepGoal: "เป้าหมายคือแยกกลับเป็นผลบวกของเศษส่วนย่อย",
      bridgeStepFound: "เมื่อหาค่า $A,B$ ได้ จะได้",
      setupHint: "เลือกตัวส่วนที่ต้องใช้ในการตั้งรูป (เลือกให้ครบตามหลักการ)",
      setupIncomplete: "เลือกถูกต้องแล้ว แต่ยังไม่ครบ — เลือกตัวส่วนที่จำเป็นให้ครบ",
      setupWrong: "ตั้งรูปยังไม่ถูกต้อง — ตัวประกอบซ้ำต้องมีทุกกำลังจากต่ำถึงสูง",
      setupOk: "ตั้งรูปถูกต้องแล้ว",
      coeffHint: "กรอกค่าสัมประสิทธิ์ให้ถูกต้อง (รับจำนวนเต็มหรือเศษส่วน เช่น -1 หรือ 2/3)",
      fillSetup: "กรุณาตั้งรูปให้ถูกต้องก่อน",
      fillCoeffs: "กรุณากรอกค่าสัมประสิทธิ์ให้ครบ",
      allOk: "ถูกต้อง",
      incorrect: "ยังไม่ถูกต้อง ลองตรวจตั้งรูปและค่าสัมประสิทธิ์อีกครั้ง",
      therefore: "ดังนั้น",
      revealed: "เฉลย",
      stepShow: "พิจารณาโจทย์",
      stepSetup: "ตั้งรูปการแยกเศษส่วนย่อย",
      stepClear: "คูณด้วย ค.ร.น. เพื่อกำจัดตัวส่วน",
      stepMatch: "เทียบสัมประสิทธิ์ของพจน์ที่เหมือนกัน",
      stepSolve: "หาค่าสัมประสิทธิ์",
      stepResult: "เขียนคำตอบสุดท้าย"
    },
    bridge: {
      examples: [
        {
          id: "b1",
          title: "ตัวส่วน x และ x+1",
          dens: ["x", "x+1"],
          labels: ["A", "B"],
          defaults: [2, -1],
          lcdTex: "x(x+1)"
        },
        {
          id: "b2",
          title: "ตัวส่วน x+1 และ x+2",
          dens: ["x+1", "x+2"],
          labels: ["A", "B"],
          defaults: [3, -2],
          lcdTex: "(x+1)(x+2)"
        },
        {
          id: "b3",
          title: "ตัวส่วน x-2 และ x-3",
          dens: ["x-2", "x-3"],
          labels: ["A", "B"],
          defaults: [4, -3],
          lcdTex: "(x-2)(x-3)"
        }
      ]
    },
    types: [
      { id: "distinctLinear", label: "รูปแบบที่ 1" },
      { id: "repeatedLinear", label: "รูปแบบที่ 2" },
      { id: "mixedLinear", label: "รูปแบบที่ 3" }
    ],
    examples: {
      distinctLinear: [
        {
          id: "d1",
          prompt: "แยกเศษส่วนย่อย",
          promptTex: "\\dfrac{x+2}{x(x+1)}",
          steps: [
            {
              type: "show",
              title: "พิจารณาโจทย์",
              tex: "\\dfrac{x+2}{x(x+1)}",
              note: "ตัวส่วนแยกเป็นตัวประกอบเชิงเส้นไม่ซ้ำ $x$ และ $x+1$"
            },
            {
              type: "setup",
              title: "ตั้งรูปการแยกเศษส่วนย่อย",
              bank: [
                { id: "x", tex: "x", correct: true },
                { id: "x+1", tex: "x+1", correct: true },
                { id: "x-1", tex: "x-1", correct: false },
                { id: "(x+1)^2", tex: "(x+1)^{2}", correct: false }
              ],
              formTex: "\\dfrac{A}{x}+\\dfrac{B}{x+1}"
            },
            {
              type: "clear",
              lines: [
                "\\dfrac{x+2}{x(x+1)}=\\dfrac{A}{x}+\\dfrac{B}{x+1}",
                "x+2=A(x+1)+Bx"
              ]
            },
            {
              type: "match",
              title: "เทียบสัมประสิทธิ์",
              expandTex: "x+2=(A+B)x+A",
              equations: [
                { label: "พจน์ $x$", tex: "A+B=1" },
                { label: "ค่าคงที่", tex: "A=2" }
              ]
            },
            {
              type: "solve",
              title: "หาค่าสัมประสิทธิ์",
              unknowns: [
                { key: "A", answer: 2 },
                { key: "B", answer: -1 }
              ],
              hintTex: "จาก $A=2$ และ $A+B=1$ ได้ $B=-1$"
            },
            {
              type: "result",
              title: "คำตอบสุดท้าย",
              tex: "\\dfrac{x+2}{x(x+1)}=\\dfrac{2}{x}-\\dfrac{1}{x+1}",
              whenTex: "x\\neq 0,\\;-1"
            }
          ]
        },
        {
          id: "d2",
          prompt: "แยกเศษส่วนย่อย",
          promptTex: "\\dfrac{3x+5}{(x+1)(x+2)}",
          steps: [
            {
              type: "show",
              title: "พิจารณาโจทย์",
              tex: "\\dfrac{3x+5}{(x+1)(x+2)}",
              note: "ตัวประกอบเชิงเส้นไม่ซ้ำ $x+1$ และ $x+2$"
            },
            {
              type: "setup",
              title: "ตั้งรูปการแยกเศษส่วนย่อย",
              bank: [
                { id: "x+1", tex: "x+1", correct: true },
                { id: "x+2", tex: "x+2", correct: true },
                { id: "x", tex: "x", correct: false },
                { id: "(x+1)^2", tex: "(x+1)^{2}", correct: false }
              ],
              formTex: "\\dfrac{A}{x+1}+\\dfrac{B}{x+2}"
            },
            {
              type: "clear",
              lines: [
                "\\dfrac{3x+5}{(x+1)(x+2)}=\\dfrac{A}{x+1}+\\dfrac{B}{x+2}",
                "3x+5=A(x+2)+B(x+1)"
              ]
            },
            {
              type: "match",
              title: "เทียบสัมประสิทธิ์",
              expandTex: "3x+5=(A+B)x+(2A+B)",
              equations: [
                { label: "พจน์ $x$", tex: "A+B=3" },
                { label: "ค่าคงที่", tex: "2A+B=5" }
              ]
            },
            {
              type: "solve",
              title: "หาค่าสัมประสิทธิ์",
              unknowns: [
                { key: "A", answer: 2 },
                { key: "B", answer: 1 }
              ],
              hintTex: "แก้ระบบสมการได้ $A=2,\\;B=1$"
            },
            {
              type: "result",
              title: "คำตอบสุดท้าย",
              tex: "\\dfrac{3x+5}{(x+1)(x+2)}=\\dfrac{2}{x+1}+\\dfrac{1}{x+2}",
              whenTex: "x\\neq -1,\\;-2"
            }
          ]
        }
      ],
      repeatedLinear: [
        {
          id: "r1",
          prompt: "แยกเศษส่วนย่อย",
          promptTex: "\\dfrac{5x+2}{(x-1)^{3}}",
          steps: [
            {
              type: "show",
              title: "พิจารณาโจทย์",
              tex: "\\dfrac{5x+2}{(x-1)^{3}}",
              note: "ตัวประกอบเชิงเส้นซ้ำ $(x-1)$ ยกกำลัง $3$ ต้องตั้งรูปครบทุกกำลังจาก $1$ ถึง $3$"
            },
            {
              type: "setup",
              title: "ตั้งรูปการแยกเศษส่วนย่อย",
              bank: [
                { id: "x-1", tex: "x-1", correct: true },
                { id: "(x-1)^2", tex: "(x-1)^{2}", correct: true },
                { id: "(x-1)^3", tex: "(x-1)^{3}", correct: true },
                { id: "x+1", tex: "x+1", correct: false }
              ],
              wrongNote:
                "อย่าตั้งเป็น $\\dfrac{A}{x-1}+\\dfrac{B}{x-1}+\\dfrac{C}{x-1}$ — ต้องมีกำลัง $1,2,3$",
              formTex:
                "\\dfrac{A}{x-1}+\\dfrac{B}{(x-1)^{2}}+\\dfrac{C}{(x-1)^{3}}"
            },
            {
              type: "clear",
              lines: [
                "\\dfrac{5x+2}{(x-1)^{3}}=\\dfrac{A}{x-1}+\\dfrac{B}{(x-1)^{2}}+\\dfrac{C}{(x-1)^{3}}",
                "5x+2=A(x-1)^{2}+B(x-1)+C"
              ]
            },
            {
              type: "match",
              title: "เทียบสัมประสิทธิ์",
              expandTex:
                "0\\cdot x^{2}+5x+2=Ax^{2}+(-2A+B)x+(A-B+C)",
              equations: [
                { label: "พจน์ $x^{2}$", tex: "A=0" },
                { label: "พจน์ $x$", tex: "-2A+B=5" },
                { label: "ค่าคงที่", tex: "A-B+C=2" }
              ],
              note: "ใส่ศูนย์เป็นตัวแทนพจน์ $x^{2}$ ที่ขาดไปทางซ้าย"
            },
            {
              type: "solve",
              title: "หาค่าสัมประสิทธิ์",
              unknowns: [
                { key: "A", answer: 0 },
                { key: "B", answer: 5 },
                { key: "C", answer: 7 }
              ],
              hintTex: "จาก $A=0$ ได้ $B=5$ และ $C=7$"
            },
            {
              type: "result",
              title: "คำตอบสุดท้าย",
              tex: "\\dfrac{5x+2}{(x-1)^{3}}=\\dfrac{5}{(x-1)^{2}}+\\dfrac{7}{(x-1)^{3}}",
              note: "พจน์ที่ $A=0$ หายไป",
              whenTex: "x\\neq 1"
            }
          ]
        },
        {
          id: "r2",
          prompt: "แยกเศษส่วนย่อย",
          promptTex: "\\dfrac{x+3}{(x+2)^{2}}",
          steps: [
            {
              type: "show",
              title: "พิจารณาโจทย์",
              tex: "\\dfrac{x+3}{(x+2)^{2}}",
              note: "ตัวประกอบเชิงเส้นซ้ำ $(x+2)$ ยกกำลัง $2$"
            },
            {
              type: "setup",
              title: "ตั้งรูปการแยกเศษส่วนย่อย",
              bank: [
                { id: "x+2", tex: "x+2", correct: true },
                { id: "(x+2)^2", tex: "(x+2)^{2}", correct: true },
                { id: "x-2", tex: "x-2", correct: false },
                { id: "(x+2)^3", tex: "(x+2)^{3}", correct: false }
              ],
              formTex: "\\dfrac{A}{x+2}+\\dfrac{B}{(x+2)^{2}}"
            },
            {
              type: "clear",
              lines: [
                "\\dfrac{x+3}{(x+2)^{2}}=\\dfrac{A}{x+2}+\\dfrac{B}{(x+2)^{2}}",
                "x+3=A(x+2)+B"
              ]
            },
            {
              type: "match",
              title: "เทียบสัมประสิทธิ์",
              expandTex: "x+3=Ax+(2A+B)",
              equations: [
                { label: "พจน์ $x$", tex: "A=1" },
                { label: "ค่าคงที่", tex: "2A+B=3" }
              ]
            },
            {
              type: "solve",
              title: "หาค่าสัมประสิทธิ์",
              unknowns: [
                { key: "A", answer: 1 },
                { key: "B", answer: 1 }
              ],
              hintTex: "จาก $A=1$ ได้ $B=1$"
            },
            {
              type: "result",
              title: "คำตอบสุดท้าย",
              tex: "\\dfrac{x+3}{(x+2)^{2}}=\\dfrac{1}{x+2}+\\dfrac{1}{(x+2)^{2}}",
              whenTex: "x\\neq -2"
            }
          ]
        }
      ],
      mixedLinear: [
        {
          id: "m1",
          prompt: "แยกเศษส่วนย่อย",
          promptTex: "\\dfrac{x^{2}}{(x-2)(x-3)^{2}}",
          steps: [
            {
              type: "show",
              title: "พิจารณาโจทย์",
              tex: "\\dfrac{x^{2}}{(x-2)(x-3)^{2}}",
              note: "$(x-2)$ ปรากฏครั้งเดียว และ $(x-3)$ ซ้ำยกกำลัง $2$"
            },
            {
              type: "setup",
              title: "ตั้งรูปการแยกเศษส่วนย่อย",
              bank: [
                { id: "x-2", tex: "x-2", correct: true },
                { id: "x-3", tex: "x-3", correct: true },
                { id: "(x-3)^2", tex: "(x-3)^{2}", correct: true },
                { id: "(x-2)^2", tex: "(x-2)^{2}", correct: false }
              ],
              formTex:
                "\\dfrac{A}{x-2}+\\dfrac{B}{x-3}+\\dfrac{C}{(x-3)^{2}}"
            },
            {
              type: "clear",
              lines: [
                "\\dfrac{x^{2}}{(x-2)(x-3)^{2}}=\\dfrac{A}{x-2}+\\dfrac{B}{x-3}+\\dfrac{C}{(x-3)^{2}}",
                "x^{2}=A(x-3)^{2}+B(x-2)(x-3)+C(x-2)"
              ]
            },
            {
              type: "match",
              title: "เทียบสัมประสิทธิ์",
              expandTex:
                "x^{2}+0x+0=(A+B)x^{2}+(-6A-5B+C)x+(9A+6B-2C)",
              equations: [
                { label: "พจน์ $x^{2}$", tex: "A+B=1" },
                { label: "พจน์ $x$", tex: "-6A-5B+C=0" },
                { label: "ค่าคงที่", tex: "9A+6B-2C=0" }
              ],
              note: "ใส่ศูนย์เป็นตัวแทนพจน์ที่ขาดไปทางซ้าย"
            },
            {
              type: "solve",
              title: "หาค่าสัมประสิทธิ์",
              unknowns: [
                { key: "A", answer: 4 },
                { key: "B", answer: -3 },
                { key: "C", answer: 9 }
              ],
              hintTex:
                "แทน $x=2$ ได้ $A=4$ แทน $x=3$ ได้ $C=9$ แล้วหา $B=-3$"
            },
            {
              type: "result",
              title: "คำตอบสุดท้าย",
              tex: "\\dfrac{x^{2}}{(x-2)(x-3)^{2}}=\\dfrac{4}{x-2}-\\dfrac{3}{x-3}+\\dfrac{9}{(x-3)^{2}}",
              whenTex: "x\\neq 2,\\;3"
            }
          ]
        },
        {
          id: "m2",
          prompt: "แยกเศษส่วนย่อย",
          promptTex: "\\dfrac{2x+1}{x(x-1)^{2}}",
          steps: [
            {
              type: "show",
              title: "พิจารณาโจทย์",
              tex: "\\dfrac{2x+1}{x(x-1)^{2}}",
              note: "$x$ ไม่ซ้ำ และ $(x-1)$ ซ้ำยกกำลัง $2$"
            },
            {
              type: "setup",
              title: "ตั้งรูปการแยกเศษส่วนย่อย",
              bank: [
                { id: "x", tex: "x", correct: true },
                { id: "x-1", tex: "x-1", correct: true },
                { id: "(x-1)^2", tex: "(x-1)^{2}", correct: true },
                { id: "x+1", tex: "x+1", correct: false }
              ],
              formTex: "\\dfrac{A}{x}+\\dfrac{B}{x-1}+\\dfrac{C}{(x-1)^{2}}"
            },
            {
              type: "clear",
              lines: [
                "\\dfrac{2x+1}{x(x-1)^{2}}=\\dfrac{A}{x}+\\dfrac{B}{x-1}+\\dfrac{C}{(x-1)^{2}}",
                "2x+1=A(x-1)^{2}+Bx(x-1)+Cx"
              ]
            },
            {
              type: "match",
              title: "เทียบสัมประสิทธิ์",
              expandTex:
                "0\\cdot x^{2}+2x+1=(A+B)x^{2}+(-2A-B+C)x+A",
              equations: [
                { label: "พจน์ $x^{2}$", tex: "A+B=0" },
                { label: "พจน์ $x$", tex: "-2A-B+C=2" },
                { label: "ค่าคงที่", tex: "A=1" }
              ]
            },
            {
              type: "solve",
              title: "หาค่าสัมประสิทธิ์",
              unknowns: [
                { key: "A", answer: 1 },
                { key: "B", answer: -1 },
                { key: "C", answer: 3 }
              ],
              hintTex: "จาก $A=1$ ได้ $B=-1$ และ $C=3$"
            },
            {
              type: "result",
              title: "คำตอบสุดท้าย",
              tex: "\\dfrac{2x+1}{x(x-1)^{2}}=\\dfrac{1}{x}-\\dfrac{1}{x-1}+\\dfrac{3}{(x-1)^{2}}",
              whenTex: "x\\neq 0,\\;1"
            }
          ]
        }
      ]
    },
    testPool: {
      distinctLinear: [
        {
          id: "td1",
          prompt: "แยกเศษส่วนย่อย",
          promptTex: "\\dfrac{x+2}{x(x+1)}",
          bank: [
            {
              id: "x",
              tex: "x",
              correct: true
            },
            {
              id: "x+1",
              tex: "x+1",
              correct: true
            },
            {
              id: "x-1",
              tex: "x-1",
              correct: false
            },
            {
              id: "x-2",
              tex: "x-2",
              correct: false
            }
          ],
          formTex: "\\dfrac{A}{x}+\\dfrac{B}{x+1}",
          unknowns: [
            {
              key: "A",
              answer: 2
            },
            {
              key: "B",
              answer: -1
            }
          ],
          answerTex: "\\dfrac{2}{x}-\\dfrac{1}{x+1}"
        },
        {
          id: "td2",
          prompt: "แยกเศษส่วนย่อย",
          promptTex: "\\dfrac{3x+5}{(x+1)(x+2)}",
          bank: [
            {
              id: "x+1",
              tex: "x+1",
              correct: true
            },
            {
              id: "x+2",
              tex: "x+2",
              correct: true
            },
            {
              id: "x",
              tex: "x",
              correct: false
            },
            {
              id: "x-1",
              tex: "x-1",
              correct: false
            }
          ],
          formTex: "\\dfrac{A}{x+1}+\\dfrac{B}{x+2}",
          unknowns: [
            {
              key: "A",
              answer: 2
            },
            {
              key: "B",
              answer: 1
            }
          ],
          answerTex: "\\dfrac{2}{x+1}+\\dfrac{1}{x+2}"
        },
        {
          id: "td3",
          prompt: "แยกเศษส่วนย่อย",
          promptTex: "\\dfrac{5}{x(x-2)}",
          bank: [
            {
              id: "x",
              tex: "x",
              correct: true
            },
            {
              id: "x-2",
              tex: "x-2",
              correct: true
            },
            {
              id: "x-1",
              tex: "x-1",
              correct: false
            },
            {
              id: "x+1",
              tex: "x+1",
              correct: false
            }
          ],
          formTex: "\\dfrac{A}{x}+\\dfrac{B}{x-2}",
          unknowns: [
            {
              key: "A",
              answer: "-5/2"
            },
            {
              key: "B",
              answer: "5/2"
            }
          ],
          answerTex: "-\\dfrac{5}{2x}+\\dfrac{5}{2(x-2)}"
        },
        {
          id: "td4",
          prompt: "แยกเศษส่วนย่อย",
          promptTex: "\\dfrac{-x-1}{x(x-1)}",
          bank: [
            {
              id: "x",
              tex: "x",
              correct: true
            },
            {
              id: "x-1",
              tex: "x-1",
              correct: true
            },
            {
              id: "x+1",
              tex: "x+1",
              correct: false
            },
            {
              id: "x-2",
              tex: "x-2",
              correct: false
            }
          ],
          formTex: "\\dfrac{A}{x}+\\dfrac{B}{x-1}",
          unknowns: [
            {
              key: "A",
              answer: 1
            },
            {
              key: "B",
              answer: -2
            }
          ],
          answerTex: "\\dfrac{1}{x}-\\dfrac{2}{x-1}"
        },
        {
          id: "td5",
          prompt: "แยกเศษส่วนย่อย",
          promptTex: "\\dfrac{2x+4}{(x-1)(x+1)}",
          bank: [
            {
              id: "x-1",
              tex: "x-1",
              correct: true
            },
            {
              id: "x+1",
              tex: "x+1",
              correct: true
            },
            {
              id: "x",
              tex: "x",
              correct: false
            },
            {
              id: "x-2",
              tex: "x-2",
              correct: false
            }
          ],
          formTex: "\\dfrac{A}{x-1}+\\dfrac{B}{x+1}",
          unknowns: [
            {
              key: "A",
              answer: 3
            },
            {
              key: "B",
              answer: -1
            }
          ],
          answerTex: "\\dfrac{3}{x-1}-\\dfrac{1}{x+1}"
        },
        {
          id: "td6",
          prompt: "แยกเศษส่วนย่อย",
          promptTex: "\\dfrac{x-10}{(x+2)(x-1)}",
          bank: [
            {
              id: "x+2",
              tex: "x+2",
              correct: true
            },
            {
              id: "x-1",
              tex: "x-1",
              correct: true
            },
            {
              id: "x",
              tex: "x",
              correct: false
            },
            {
              id: "x+1",
              tex: "x+1",
              correct: false
            }
          ],
          formTex: "\\dfrac{A}{x+2}+\\dfrac{B}{x-1}",
          unknowns: [
            {
              key: "A",
              answer: 4
            },
            {
              key: "B",
              answer: -3
            }
          ],
          answerTex: "\\dfrac{4}{x+2}-\\dfrac{3}{x-1}"
        },
        {
          id: "td7",
          prompt: "แยกเศษส่วนย่อย",
          promptTex: "\\dfrac{3x-7}{(x-2)(x-3)}",
          bank: [
            {
              id: "x-2",
              tex: "x-2",
              correct: true
            },
            {
              id: "x-3",
              tex: "x-3",
              correct: true
            },
            {
              id: "x",
              tex: "x",
              correct: false
            },
            {
              id: "x-1",
              tex: "x-1",
              correct: false
            }
          ],
          formTex: "\\dfrac{A}{x-2}+\\dfrac{B}{x-3}",
          unknowns: [
            {
              key: "A",
              answer: 1
            },
            {
              key: "B",
              answer: 2
            }
          ],
          answerTex: "\\dfrac{1}{x-2}+\\dfrac{2}{x-3}"
        },
        {
          id: "td8",
          prompt: "แยกเศษส่วนย่อย",
          promptTex: "\\dfrac{2x-3}{x(x+3)}",
          bank: [
            {
              id: "x",
              tex: "x",
              correct: true
            },
            {
              id: "x+3",
              tex: "x+3",
              correct: true
            },
            {
              id: "x-1",
              tex: "x-1",
              correct: false
            },
            {
              id: "x+1",
              tex: "x+1",
              correct: false
            }
          ],
          formTex: "\\dfrac{A}{x}+\\dfrac{B}{x+3}",
          unknowns: [
            {
              key: "A",
              answer: -1
            },
            {
              key: "B",
              answer: 3
            }
          ],
          answerTex: "-\\dfrac{1}{x}+\\dfrac{3}{x+3}"
        },
        {
          id: "td9",
          prompt: "แยกเศษส่วนย่อย",
          promptTex: "\\dfrac{3x-12}{(x+1)(x-2)}",
          bank: [
            {
              id: "x+1",
              tex: "x+1",
              correct: true
            },
            {
              id: "x-2",
              tex: "x-2",
              correct: true
            },
            {
              id: "x",
              tex: "x",
              correct: false
            },
            {
              id: "x-1",
              tex: "x-1",
              correct: false
            }
          ],
          formTex: "\\dfrac{A}{x+1}+\\dfrac{B}{x-2}",
          unknowns: [
            {
              key: "A",
              answer: 5
            },
            {
              key: "B",
              answer: -2
            }
          ],
          answerTex: "\\dfrac{5}{x+1}-\\dfrac{2}{x-2}"
        },
        {
          id: "td10",
          prompt: "แยกเศษส่วนย่อย",
          promptTex: "\\dfrac{-x-5}{(x-1)(x-4)}",
          bank: [
            {
              id: "x-1",
              tex: "x-1",
              correct: true
            },
            {
              id: "x-4",
              tex: "x-4",
              correct: true
            },
            {
              id: "x",
              tex: "x",
              correct: false
            },
            {
              id: "x+1",
              tex: "x+1",
              correct: false
            }
          ],
          formTex: "\\dfrac{A}{x-1}+\\dfrac{B}{x-4}",
          unknowns: [
            {
              key: "A",
              answer: 2
            },
            {
              key: "B",
              answer: -3
            }
          ],
          answerTex: "\\dfrac{2}{x-1}-\\dfrac{3}{x-4}"
        }
      ],
      repeatedLinear: [
        {
          id: "tr1",
          prompt: "แยกเศษส่วนย่อย",
          promptTex: "\\dfrac{5x+2}{(x-1)^{3}}",
          bank: [
            {
              id: "x-1",
              tex: "x-1",
              correct: true
            },
            {
              id: "(x-1)^2",
              tex: "(x-1)^{2}",
              correct: true
            },
            {
              id: "(x-1)^3",
              tex: "(x-1)^{3}",
              correct: true
            },
            {
              id: "x+1",
              tex: "x+1",
              correct: false
            }
          ],
          formTex: "\\dfrac{A}{x-1}+\\dfrac{B}{(x-1)^{2}}+\\dfrac{C}{(x-1)^{3}}",
          unknowns: [
            {
              key: "A",
              answer: 0
            },
            {
              key: "B",
              answer: 5
            },
            {
              key: "C",
              answer: 7
            }
          ],
          answerTex: "\\dfrac{5}{(x-1)^{2}}+\\dfrac{7}{(x-1)^{3}}"
        },
        {
          id: "tr2",
          prompt: "แยกเศษส่วนย่อย",
          promptTex: "\\dfrac{x+3}{(x+2)^{2}}",
          bank: [
            {
              id: "x+2",
              tex: "x+2",
              correct: true
            },
            {
              id: "(x+2)^2",
              tex: "(x+2)^{2}",
              correct: true
            },
            {
              id: "x-1",
              tex: "x-1",
              correct: false
            },
            {
              id: "(x+2)^3",
              tex: "(x+2)^{3}",
              correct: false
            }
          ],
          formTex: "\\dfrac{A}{x+2}+\\dfrac{B}{(x+2)^{2}}",
          unknowns: [
            {
              key: "A",
              answer: 1
            },
            {
              key: "B",
              answer: 1
            }
          ],
          answerTex: "\\dfrac{1}{x+2}+\\dfrac{1}{(x+2)^{2}}"
        },
        {
          id: "tr3",
          prompt: "แยกเศษส่วนย่อย",
          promptTex: "\\dfrac{2x-5}{(x-1)^{2}}",
          bank: [
            {
              id: "x-1",
              tex: "x-1",
              correct: true
            },
            {
              id: "(x-1)^2",
              tex: "(x-1)^{2}",
              correct: true
            },
            {
              id: "x+1",
              tex: "x+1",
              correct: false
            },
            {
              id: "(x-1)^3",
              tex: "(x-1)^{3}",
              correct: false
            }
          ],
          formTex: "\\dfrac{A}{x-1}+\\dfrac{B}{(x-1)^{2}}",
          unknowns: [
            {
              key: "A",
              answer: 2
            },
            {
              key: "B",
              answer: -3
            }
          ],
          answerTex: "\\dfrac{2}{x-1}-\\dfrac{3}{(x-1)^{2}}"
        },
        {
          id: "tr4",
          prompt: "แยกเศษส่วนย่อย",
          promptTex: "\\dfrac{x^{2}+4x+6}{(x+1)^{3}}",
          bank: [
            {
              id: "x+1",
              tex: "x+1",
              correct: true
            },
            {
              id: "(x+1)^2",
              tex: "(x+1)^{2}",
              correct: true
            },
            {
              id: "(x+1)^3",
              tex: "(x+1)^{3}",
              correct: true
            },
            {
              id: "x-1",
              tex: "x-1",
              correct: false
            }
          ],
          formTex: "\\dfrac{A}{x+1}+\\dfrac{B}{(x+1)^{2}}+\\dfrac{C}{(x+1)^{3}}",
          unknowns: [
            {
              key: "A",
              answer: 1
            },
            {
              key: "B",
              answer: 2
            },
            {
              key: "C",
              answer: 3
            }
          ],
          answerTex: "\\dfrac{1}{x+1}+\\dfrac{2}{(x+1)^{2}}+\\dfrac{3}{(x+1)^{3}}"
        },
        {
          id: "tr5",
          prompt: "แยกเศษส่วนย่อย",
          promptTex: "\\dfrac{3x+4}{x^{2}}",
          bank: [
            {
              id: "x",
              tex: "x",
              correct: true
            },
            {
              id: "x^2",
              tex: "x^{2}",
              correct: true
            },
            {
              id: "x-1",
              tex: "x-1",
              correct: false
            },
            {
              id: "x^3",
              tex: "x^{3}",
              correct: false
            }
          ],
          formTex: "\\dfrac{A}{x}+\\dfrac{B}{x^{2}}",
          unknowns: [
            {
              key: "A",
              answer: 3
            },
            {
              key: "B",
              answer: 4
            }
          ],
          answerTex: "\\dfrac{3}{x}+\\dfrac{4}{x^{2}}"
        },
        {
          id: "tr6",
          prompt: "แยกเศษส่วนย่อย",
          promptTex: "\\dfrac{-x+7}{(x-2)^{2}}",
          bank: [
            {
              id: "x-2",
              tex: "x-2",
              correct: true
            },
            {
              id: "(x-2)^2",
              tex: "(x-2)^{2}",
              correct: true
            },
            {
              id: "x-1",
              tex: "x-1",
              correct: false
            },
            {
              id: "(x-2)^3",
              tex: "(x-2)^{3}",
              correct: false
            }
          ],
          formTex: "\\dfrac{A}{x-2}+\\dfrac{B}{(x-2)^{2}}",
          unknowns: [
            {
              key: "A",
              answer: -1
            },
            {
              key: "B",
              answer: 5
            }
          ],
          answerTex: "-\\dfrac{1}{x-2}+\\dfrac{5}{(x-2)^{2}}"
        },
        {
          id: "tr7",
          prompt: "แยกเศษส่วนย่อย",
          promptTex: "\\dfrac{x-4}{(x-2)^{3}}",
          bank: [
            {
              id: "x-2",
              tex: "x-2",
              correct: true
            },
            {
              id: "(x-2)^2",
              tex: "(x-2)^{2}",
              correct: true
            },
            {
              id: "(x-2)^3",
              tex: "(x-2)^{3}",
              correct: true
            },
            {
              id: "x-1",
              tex: "x-1",
              correct: false
            }
          ],
          formTex: "\\dfrac{A}{x-2}+\\dfrac{B}{(x-2)^{2}}+\\dfrac{C}{(x-2)^{3}}",
          unknowns: [
            {
              key: "A",
              answer: 0
            },
            {
              key: "B",
              answer: 1
            },
            {
              key: "C",
              answer: -2
            }
          ],
          answerTex: "\\dfrac{1}{(x-2)^{2}}-\\dfrac{2}{(x-2)^{3}}"
        },
        {
          id: "tr8",
          prompt: "แยกเศษส่วนย่อย",
          promptTex: "\\dfrac{4x+3}{(x+1)^{2}}",
          bank: [
            {
              id: "x+1",
              tex: "x+1",
              correct: true
            },
            {
              id: "(x+1)^2",
              tex: "(x+1)^{2}",
              correct: true
            },
            {
              id: "x-1",
              tex: "x-1",
              correct: false
            },
            {
              id: "(x+1)^3",
              tex: "(x+1)^{3}",
              correct: false
            }
          ],
          formTex: "\\dfrac{A}{x+1}+\\dfrac{B}{(x+1)^{2}}",
          unknowns: [
            {
              key: "A",
              answer: 4
            },
            {
              key: "B",
              answer: -1
            }
          ],
          answerTex: "\\dfrac{4}{x+1}-\\dfrac{1}{(x+1)^{2}}"
        },
        {
          id: "tr9",
          prompt: "แยกเศษส่วนย่อย",
          promptTex: "\\dfrac{2x+11}{(x+3)^{2}}",
          bank: [
            {
              id: "x+3",
              tex: "x+3",
              correct: true
            },
            {
              id: "(x+3)^2",
              tex: "(x+3)^{2}",
              correct: true
            },
            {
              id: "x-1",
              tex: "x-1",
              correct: false
            },
            {
              id: "(x+3)^3",
              tex: "(x+3)^{3}",
              correct: false
            }
          ],
          formTex: "\\dfrac{A}{x+3}+\\dfrac{B}{(x+3)^{2}}",
          unknowns: [
            {
              key: "A",
              answer: 2
            },
            {
              key: "B",
              answer: 5
            }
          ],
          answerTex: "\\dfrac{2}{x+3}+\\dfrac{5}{(x+3)^{2}}"
        },
        {
          id: "tr10",
          prompt: "แยกเศษส่วนย่อย",
          promptTex: "\\dfrac{2x^{2}-x+4}{x^{3}}",
          bank: [
            {
              id: "x",
              tex: "x",
              correct: true
            },
            {
              id: "x^2",
              tex: "x^{2}",
              correct: true
            },
            {
              id: "x^3",
              tex: "x^{3}",
              correct: true
            },
            {
              id: "x-1",
              tex: "x-1",
              correct: false
            }
          ],
          formTex: "\\dfrac{A}{x}+\\dfrac{B}{x^{2}}+\\dfrac{C}{x^{3}}",
          unknowns: [
            {
              key: "A",
              answer: 2
            },
            {
              key: "B",
              answer: -1
            },
            {
              key: "C",
              answer: 4
            }
          ],
          answerTex: "\\dfrac{2}{x}-\\dfrac{1}{x^{2}}+\\dfrac{4}{x^{3}}"
        }
      ],
      mixedLinear: [
        {
          id: "tm1",
          prompt: "แยกเศษส่วนย่อย",
          promptTex: "\\dfrac{x^{2}}{(x-2)(x-3)^{2}}",
          bank: [
            {
              id: "x-2",
              tex: "x-2",
              correct: true
            },
            {
              id: "x-3",
              tex: "x-3",
              correct: true
            },
            {
              id: "(x-3)^2",
              tex: "(x-3)^{2}",
              correct: true
            },
            {
              id: "(x-2)^2",
              tex: "(x-2)^{2}",
              correct: false
            }
          ],
          formTex: "\\dfrac{A}{x-2}+\\dfrac{B}{x-3}+\\dfrac{C}{(x-3)^{2}}",
          unknowns: [
            {
              key: "A",
              answer: 4
            },
            {
              key: "B",
              answer: -3
            },
            {
              key: "C",
              answer: 9
            }
          ],
          answerTex: "\\dfrac{4}{x-2}-\\dfrac{3}{x-3}+\\dfrac{9}{(x-3)^{2}}"
        },
        {
          id: "tm2",
          prompt: "แยกเศษส่วนย่อย",
          promptTex: "\\dfrac{2x+1}{x(x-1)^{2}}",
          bank: [
            {
              id: "x",
              tex: "x",
              correct: true
            },
            {
              id: "x-1",
              tex: "x-1",
              correct: true
            },
            {
              id: "(x-1)^2",
              tex: "(x-1)^{2}",
              correct: true
            },
            {
              id: "x^2",
              tex: "x^{2}",
              correct: false
            }
          ],
          formTex: "\\dfrac{A}{x}+\\dfrac{B}{x-1}+\\dfrac{C}{(x-1)^{2}}",
          unknowns: [
            {
              key: "A",
              answer: 1
            },
            {
              key: "B",
              answer: -1
            },
            {
              key: "C",
              answer: 3
            }
          ],
          answerTex: "\\dfrac{1}{x}-\\dfrac{1}{x-1}+\\dfrac{3}{(x-1)^{2}}"
        },
        {
          id: "tm3",
          prompt: "แยกเศษส่วนย่อย",
          promptTex: "\\dfrac{3x^{2}-2x+1}{x^{2}(x-1)}",
          bank: [
            {
              id: "x-1",
              tex: "x-1",
              correct: true
            },
            {
              id: "x",
              tex: "x",
              correct: true
            },
            {
              id: "x^2",
              tex: "x^{2}",
              correct: true
            },
            {
              id: "(x-1)^2",
              tex: "(x-1)^{2}",
              correct: false
            }
          ],
          formTex: "\\dfrac{A}{x-1}+\\dfrac{B}{x}+\\dfrac{C}{x^{2}}",
          unknowns: [
            {
              key: "A",
              answer: 2
            },
            {
              key: "B",
              answer: 1
            },
            {
              key: "C",
              answer: -1
            }
          ],
          answerTex: "\\dfrac{2}{x-1}+\\dfrac{1}{x}-\\dfrac{1}{x^{2}}"
        },
        {
          id: "tm4",
          prompt: "แยกเศษส่วนย่อย",
          promptTex: "\\dfrac{x^{2}+6x-4}{(x+1)(x-2)^{2}}",
          bank: [
            {
              id: "x+1",
              tex: "x+1",
              correct: true
            },
            {
              id: "x-2",
              tex: "x-2",
              correct: true
            },
            {
              id: "(x-2)^2",
              tex: "(x-2)^{2}",
              correct: true
            },
            {
              id: "(x+1)^2",
              tex: "(x+1)^{2}",
              correct: false
            }
          ],
          formTex: "\\dfrac{A}{x+1}+\\dfrac{B}{x-2}+\\dfrac{C}{(x-2)^{2}}",
          unknowns: [
            {
              key: "A",
              answer: -1
            },
            {
              key: "B",
              answer: 2
            },
            {
              key: "C",
              answer: 4
            }
          ],
          answerTex: "-\\dfrac{1}{x+1}+\\dfrac{2}{x-2}+\\dfrac{4}{(x-2)^{2}}"
        },
        {
          id: "tm5",
          prompt: "แยกเศษส่วนย่อย",
          promptTex: "\\dfrac{x^{2}+5x+3}{x(x+1)^{2}}",
          bank: [
            {
              id: "x",
              tex: "x",
              correct: true
            },
            {
              id: "x+1",
              tex: "x+1",
              correct: true
            },
            {
              id: "(x+1)^2",
              tex: "(x+1)^{2}",
              correct: true
            },
            {
              id: "x^2",
              tex: "x^{2}",
              correct: false
            }
          ],
          formTex: "\\dfrac{A}{x}+\\dfrac{B}{x+1}+\\dfrac{C}{(x+1)^{2}}",
          unknowns: [
            {
              key: "A",
              answer: 3
            },
            {
              key: "B",
              answer: -2
            },
            {
              key: "C",
              answer: 1
            }
          ],
          answerTex: "\\dfrac{3}{x}-\\dfrac{2}{x+1}+\\dfrac{1}{(x+1)^{2}}"
        },
        {
          id: "tm6",
          prompt: "แยกเศษส่วนย่อย",
          promptTex: "\\dfrac{x^{2}+7x-9}{(x-2)(x+1)^{2}}",
          bank: [
            {
              id: "x-2",
              tex: "x-2",
              correct: true
            },
            {
              id: "x+1",
              tex: "x+1",
              correct: true
            },
            {
              id: "(x+1)^2",
              tex: "(x+1)^{2}",
              correct: true
            },
            {
              id: "(x-2)^2",
              tex: "(x-2)^{2}",
              correct: false
            }
          ],
          formTex: "\\dfrac{A}{x-2}+\\dfrac{B}{x+1}+\\dfrac{C}{(x+1)^{2}}",
          unknowns: [
            {
              key: "A",
              answer: 1
            },
            {
              key: "B",
              answer: 0
            },
            {
              key: "C",
              answer: 5
            }
          ],
          answerTex: "\\dfrac{1}{x-2}+\\dfrac{5}{(x+1)^{2}}"
        },
        {
          id: "tm7",
          prompt: "แยกเศษส่วนย่อย",
          promptTex: "\\dfrac{-2x^{2}-5x+16}{(x+2)(x-1)^{2}}",
          bank: [
            {
              id: "x+2",
              tex: "x+2",
              correct: true
            },
            {
              id: "x-1",
              tex: "x-1",
              correct: true
            },
            {
              id: "(x-1)^2",
              tex: "(x-1)^{2}",
              correct: true
            },
            {
              id: "(x+2)^2",
              tex: "(x+2)^{2}",
              correct: false
            }
          ],
          formTex: "\\dfrac{A}{x+2}+\\dfrac{B}{x-1}+\\dfrac{C}{(x-1)^{2}}",
          unknowns: [
            {
              key: "A",
              answer: 2
            },
            {
              key: "B",
              answer: -4
            },
            {
              key: "C",
              answer: 3
            }
          ],
          answerTex: "\\dfrac{2}{x+2}-\\dfrac{4}{x-1}+\\dfrac{3}{(x-1)^{2}}"
        },
        {
          id: "tm8",
          prompt: "แยกเศษส่วนย่อย",
          promptTex: "\\dfrac{-2x^{2}-x-6}{x^{2}(x-3)}",
          bank: [
            {
              id: "x-3",
              tex: "x-3",
              correct: true
            },
            {
              id: "x",
              tex: "x",
              correct: true
            },
            {
              id: "x^2",
              tex: "x^{2}",
              correct: true
            },
            {
              id: "(x-3)^2",
              tex: "(x-3)^{2}",
              correct: false
            }
          ],
          formTex: "\\dfrac{A}{x-3}+\\dfrac{B}{x}+\\dfrac{C}{x^{2}}",
          unknowns: [
            {
              key: "A",
              answer: -3
            },
            {
              key: "B",
              answer: 1
            },
            {
              key: "C",
              answer: 2
            }
          ],
          answerTex: "-\\dfrac{3}{x-3}+\\dfrac{1}{x}+\\dfrac{2}{x^{2}}"
        },
        {
          id: "tm9",
          prompt: "แยกเศษส่วนย่อย",
          promptTex: "\\dfrac{4x^{2}-19x+20}{(x-1)(x-2)^{2}}",
          bank: [
            {
              id: "x-1",
              tex: "x-1",
              correct: true
            },
            {
              id: "x-2",
              tex: "x-2",
              correct: true
            },
            {
              id: "(x-2)^2",
              tex: "(x-2)^{2}",
              correct: true
            },
            {
              id: "(x-1)^2",
              tex: "(x-1)^{2}",
              correct: false
            }
          ],
          formTex: "\\dfrac{A}{x-1}+\\dfrac{B}{x-2}+\\dfrac{C}{(x-2)^{2}}",
          unknowns: [
            {
              key: "A",
              answer: 5
            },
            {
              key: "B",
              answer: -1
            },
            {
              key: "C",
              answer: -2
            }
          ],
          answerTex: "\\dfrac{5}{x-1}-\\dfrac{1}{x-2}-\\dfrac{2}{(x-2)^{2}}"
        },
        {
          id: "tm10",
          prompt: "แยกเศษส่วนย่อย",
          promptTex: "\\dfrac{3x^{2}-x-14}{(x+3)(x-1)^{2}}",
          bank: [
            {
              id: "x+3",
              tex: "x+3",
              correct: true
            },
            {
              id: "x-1",
              tex: "x-1",
              correct: true
            },
            {
              id: "(x-1)^2",
              tex: "(x-1)^{2}",
              correct: true
            },
            {
              id: "(x+3)^2",
              tex: "(x+3)^{2}",
              correct: false
            }
          ],
          formTex: "\\dfrac{A}{x+3}+\\dfrac{B}{x-1}+\\dfrac{C}{(x-1)^{2}}",
          unknowns: [
            {
              key: "A",
              answer: 1
            },
            {
              key: "B",
              answer: 2
            },
            {
              key: "C",
              answer: -3
            }
          ],
          answerTex: "\\dfrac{1}{x+3}+\\dfrac{2}{x-1}-\\dfrac{3}{(x-1)^{2}}"
        }
      ]
    }
  }
};
