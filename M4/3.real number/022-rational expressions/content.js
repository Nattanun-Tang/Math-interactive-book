window.CONTENT = {
  th: {
    landing: {
      eyebrow: "INTERACTIVE MATHEMATICS",
      title: "เศษส่วนของพหุนาม",
      start: "เริ่ม"
    },
    app: {
      title: "เศษส่วนของพหุนาม"
    },
    ui: {
      modeLabel: "โหมด",
      modeLearn: "ศึกษา",
      modeTest: "ทดสอบ",
      topics: {
        simplify: "การทำเศษส่วนพหุนามให้อยู่ในรูปสำเร็จ",
        muldiv: "การคูณและการหารเศษส่วนพหุนาม",
        addsub: "การบวกและการลบเศษส่วนพหุนาม"
      },
      pagerLabel: "ข้อ {n}/{total}",
      prev: "ก่อนหน้า",
      next: "ถัดไป",
      random: "สุ่มโจทย์",
      check: "ตรวจสอบ",
      reveal: "เฉลย",
      reset: "ล้าง",
      thereforeLabel: "ดังนั้น",
      cancelHint: "คลิกตัวประกอบในเศษและส่วนที่เป็นตัวเดียวกันเพื่อยกเลิก",
      cancelDone: "ยกเลิกตัวประกอบร่วมครบแล้ว",
      cancelWrong: "คู่ที่เลือกไม่ใช่ตัวประกอบร่วม",
      pickAnswer: "เลือกรูปผลสำเร็จ",
      pickExcluded: "เลือกค่า $x$ ที่ต้องตัดออกจากโดเมน",
      noneExcluded: "ไม่มีค่าเพิ่มจากการยกเลิก (นอกจากตัวส่วนเดิมเป็นศูนย์)",
      fillCancel: "ยกเลิกตัวประกอบร่วมให้ครบก่อน",
      incorrect: "ยังไม่ถูกต้อง ลองตรวจการยกเลิกและคำตอบอีกครั้ง",
      allOk: "ถูกต้อง",
      revealed: "เฉลย"
    },
    topics: {
      simplify: {
        learn: [
          {
            id: "s1",
            prompt: "จงเขียนเศษส่วนของพหุนามในรูปผลสำเร็จ",
            promptTex: "\\dfrac{x^{2}+5x+6}{x^{2}+x-6}",
            steps: [
              { type: "show", tex: "\\dfrac{x^{2}+5x+6}{x^{2}+x-6}" },
              {
                type: "show",
                tex: "=\\dfrac{(x+2)(x+3)}{(x+3)(x-2)}"
              },
              {
                type: "cancel",
                num: [
                  { id: "n1", tex: "x+2", key: "x+2" },
                  { id: "n2", tex: "x+3", key: "x+3" }
                ],
                den: [
                  { id: "d1", tex: "x+3", key: "x+3" },
                  { id: "d2", tex: "x-2", key: "x-2" }
                ],
                pairs: [["n2", "d1"]],
                afterTex: "\\dfrac{x+2}{x-2}",
                excludedNote: "x\\neq -3"
              },
              {
                type: "result",
                tex: "\\dfrac{x+2}{x-2}",
                whenTex: "x\\neq -3"
              }
            ],
            resultTex: "\\dfrac{x+2}{x-2}",
            excluded: [-3],
            choices: [
              "\\dfrac{x+2}{x-2}",
              "\\dfrac{x+3}{x-2}",
              "\\dfrac{x+2}{x+3}",
              "\\dfrac{x-2}{x+2}"
            ],
            answerIndex: 0
          },
          {
            id: "s2",
            prompt: "จงเขียนเศษส่วนของพหุนามในรูปผลสำเร็จ",
            promptTex: "\\dfrac{x-3}{x^{2}-9}",
            steps: [
              { type: "show", tex: "\\dfrac{x-3}{x^{2}-9}" },
              {
                type: "show",
                tex: "=\\dfrac{x-3}{(x-3)(x+3)}"
              },
              {
                type: "cancel",
                num: [{ id: "n1", tex: "x-3", key: "x-3" }],
                den: [
                  { id: "d1", tex: "x-3", key: "x-3" },
                  { id: "d2", tex: "x+3", key: "x+3" }
                ],
                pairs: [["n1", "d1"]],
                afterTex: "\\dfrac{1}{x+3}",
                excludedNote: "x\\neq 3"
              },
              {
                type: "result",
                tex: "\\dfrac{1}{x+3}",
                whenTex: "x\\neq 3"
              }
            ],
            resultTex: "\\dfrac{1}{x+3}",
            excluded: [3],
            choices: [
              "\\dfrac{1}{x+3}",
              "\\dfrac{1}{x-3}",
              "x+3",
              "\\dfrac{x-3}{x+3}"
            ],
            answerIndex: 0
          },
          {
            id: "s3",
            prompt: "จงเขียนเศษส่วนของพหุนามในรูปผลสำเร็จ",
            promptTex: "\\dfrac{6x+12}{2x^{2}+4x}",
            steps: [
              { type: "show", tex: "\\dfrac{6x+12}{2x^{2}+4x}" },
              {
                type: "show",
                tex: "=\\dfrac{6(x+2)}{2x(x+2)}"
              },
              {
                type: "cancel",
                num: [
                  { id: "n0", tex: "6", key: "6", kind: "const" },
                  { id: "n1", tex: "x+2", key: "x+2" }
                ],
                den: [
                  { id: "d0", tex: "2", key: "2", kind: "const" },
                  { id: "d1", tex: "x", key: "x" },
                  { id: "d2", tex: "x+2", key: "x+2" }
                ],
                pairs: [["n1", "d2"]],
                constSimplify: { num: 6, den: 2, resultNum: 3, resultDen: 1 },
                afterTex: "\\dfrac{3}{x}",
                excludedNote: "x\\neq -2"
              },
              {
                type: "result",
                tex: "\\dfrac{3}{x}",
                whenTex: "x\\neq -2"
              }
            ],
            resultTex: "\\dfrac{3}{x}",
            excluded: [-2],
            choices: [
              "\\dfrac{3}{x}",
              "\\dfrac{6}{2x}",
              "\\dfrac{3}{x+2}",
              "\\dfrac{6}{x}"
            ],
            answerIndex: 0
          }
        ],
        testPool: [
          {
            id: "st1",
            prompt: "จงเขียนเศษส่วนของพหุนามในรูปผลสำเร็จ",
            promptTex: "\\dfrac{x^{2}-2x-15}{x^{2}-x-12}",
            cancel: {
              num: [
                { id: "n1", tex: "x-5", key: "x-5" },
                { id: "n2", tex: "x+3", key: "x+3" }
              ],
              den: [
                { id: "d1", tex: "x-4", key: "x-4" },
                { id: "d2", tex: "x+3", key: "x+3" }
              ],
              pairs: [["n2", "d2"]],
              afterTex: "\\dfrac{x-5}{x-4}",
              excludedNote: "x\\neq -3"
            },
            resultTex: "\\dfrac{x-5}{x-4}",
            excluded: [-3],
            choices: [
              "\\dfrac{x-5}{x-4}",
              "\\dfrac{x+3}{x-4}",
              "\\dfrac{x-5}{x+3}",
              "\\dfrac{x-4}{x-5}"
            ],
            answerIndex: 0,
            excludedChoices: [-5, -4, -3, 4]
          },
          {
            id: "st2",
            prompt: "จงเขียนเศษส่วนของพหุนามในรูปผลสำเร็จ",
            promptTex: "\\dfrac{x+4}{x^{2}-16}",
            cancel: {
              num: [{ id: "n1", tex: "x+4", key: "x+4" }],
              den: [
                { id: "d1", tex: "x+4", key: "x+4" },
                { id: "d2", tex: "x-4", key: "x-4" }
              ],
              pairs: [["n1", "d1"]],
              afterTex: "\\dfrac{1}{x-4}",
              excludedNote: "x\\neq -4"
            },
            resultTex: "\\dfrac{1}{x-4}",
            excluded: [-4],
            choices: [
              "\\dfrac{1}{x-4}",
              "\\dfrac{1}{x+4}",
              "x-4",
              "\\dfrac{x+4}{x-4}"
            ],
            answerIndex: 0,
            excludedChoices: [-4, 4, -1, 0]
          },
          {
            id: "st3",
            prompt: "จงเขียนเศษส่วนของพหุนามในรูปผลสำเร็จ",
            promptTex: "\\dfrac{5x+10}{10x^{2}+20x}",
            cancel: {
              num: [
                { id: "n0", tex: "5", key: "5", kind: "const" },
                { id: "n1", tex: "x+2", key: "x+2" }
              ],
              den: [
                { id: "d0", tex: "10", key: "10", kind: "const" },
                { id: "d1", tex: "x", key: "x" },
                { id: "d2", tex: "x+2", key: "x+2" }
              ],
              pairs: [["n1", "d2"]],
              afterTex: "\\dfrac{1}{2x}",
              excludedNote: "x\\neq -2"
            },
            resultTex: "\\dfrac{1}{2x}",
            excluded: [-2],
            choices: [
              "\\dfrac{1}{2x}",
              "\\dfrac{5}{10x}",
              "\\dfrac{1}{x}",
              "\\dfrac{1}{2(x+2)}"
            ],
            answerIndex: 0,
            excludedChoices: [-2, 0, 2, 5]
          },
          {
            id: "st4",
            prompt: "จงเขียนเศษส่วนของพหุนามในรูปผลสำเร็จ",
            promptTex: "\\dfrac{x^{2}-9}{x^{2}+6x+9}",
            cancel: {
              num: [
                { id: "n1", tex: "x-3", key: "x-3" },
                { id: "n2", tex: "x+3", key: "x+3" }
              ],
              den: [
                { id: "d1", tex: "x+3", key: "x+3" },
                { id: "d2", tex: "x+3", key: "x+3" }
              ],
              pairs: [["n2", "d1"]],
              afterTex: "\\dfrac{x-3}{x+3}",
              excludedNote: "x\\neq -3"
            },
            resultTex: "\\dfrac{x-3}{x+3}",
            excluded: [-3],
            choices: [
              "\\dfrac{x-3}{x+3}",
              "\\dfrac{x+3}{x-3}",
              "x-3",
              "\\dfrac{x-3}{(x+3)^{2}}"
            ],
            answerIndex: 0,
            excludedChoices: [-3, 3, -9, 0]
          },
          {
            id: "st5",
            prompt: "จงเขียนเศษส่วนของพหุนามในรูปผลสำเร็จ",
            promptTex: "\\dfrac{x^{2}-5x+6}{x^{2}-4}",
            cancel: {
              num: [
                { id: "n1", tex: "x-2", key: "x-2" },
                { id: "n2", tex: "x-3", key: "x-3" }
              ],
              den: [
                { id: "d1", tex: "x-2", key: "x-2" },
                { id: "d2", tex: "x+2", key: "x+2" }
              ],
              pairs: [["n1", "d1"]],
              afterTex: "\\dfrac{x-3}{x+2}",
              excludedNote: "x\\neq 2"
            },
            resultTex: "\\dfrac{x-3}{x+2}",
            excluded: [2],
            choices: [
              "\\dfrac{x-3}{x+2}",
              "\\dfrac{x-2}{x+2}",
              "\\dfrac{x-3}{x-2}",
              "\\dfrac{x-3}{x^{2}-4}"
            ],
            answerIndex: 0,
            excludedChoices: [-2, 2, 3, -3]
          },
          {
            id: "st6",
            prompt: "จงเขียนเศษส่วนของพหุนามในรูปผลสำเร็จ",
            promptTex: "\\dfrac{2x+6}{x^{2}+3x}",
            cancel: {
              num: [
                { id: "n0", tex: "2", key: "2", kind: "const" },
                { id: "n1", tex: "x+3", key: "x+3" }
              ],
              den: [
                { id: "d1", tex: "x", key: "x" },
                { id: "d2", tex: "x+3", key: "x+3" }
              ],
              pairs: [["n1", "d2"]],
              afterTex: "\\dfrac{2}{x}",
              excludedNote: "x\\neq -3"
            },
            resultTex: "\\dfrac{2}{x}",
            excluded: [-3],
            choices: [
              "\\dfrac{2}{x}",
              "\\dfrac{2}{x+3}",
              "\\dfrac{2(x+3)}{x}",
              "\\dfrac{2x}{x+3}"
            ],
            answerIndex: 0,
            excludedChoices: [-3, 0, 2, 3]
          },
          {
            id: "st7",
            prompt: "จงเขียนเศษส่วนของพหุนามในรูปผลสำเร็จ",
            promptTex: "\\dfrac{x^{2}-16}{x-4}",
            cancel: {
              num: [
                { id: "n1", tex: "x-4", key: "x-4" },
                { id: "n2", tex: "x+4", key: "x+4" }
              ],
              den: [{ id: "d1", tex: "x-4", key: "x-4" }],
              pairs: [["n1", "d1"]],
              afterTex: "x+4",
              excludedNote: "x\\neq 4"
            },
            resultTex: "x+4",
            excluded: [4],
            choices: ["x+4", "x-4", "\\dfrac{x+4}{x-4}", "(x-4)(x+4)"],
            answerIndex: 0,
            excludedChoices: [-4, 4, 0, 16]
          },
          {
            id: "st8",
            prompt: "จงเขียนเศษส่วนของพหุนามในรูปผลสำเร็จ",
            promptTex: "\\dfrac{x^{2}+7x+12}{x^{2}+5x+6}",
            cancel: {
              num: [
                { id: "n1", tex: "x+3", key: "x+3" },
                { id: "n2", tex: "x+4", key: "x+4" }
              ],
              den: [
                { id: "d1", tex: "x+2", key: "x+2" },
                { id: "d2", tex: "x+3", key: "x+3" }
              ],
              pairs: [["n1", "d2"]],
              afterTex: "\\dfrac{x+4}{x+2}",
              excludedNote: "x\\neq -3"
            },
            resultTex: "\\dfrac{x+4}{x+2}",
            excluded: [-3],
            choices: [
              "\\dfrac{x+4}{x+2}",
              "\\dfrac{x+3}{x+2}",
              "\\dfrac{x+4}{x+3}",
              "\\dfrac{x+4}{x+6}"
            ],
            answerIndex: 0,
            excludedChoices: [-4, -3, -2, 2]
          },
          {
            id: "st9",
            prompt: "จงเขียนเศษส่วนของพหุนามในรูปผลสำเร็จ",
            promptTex: "\\dfrac{4x-12}{2x^{2}-6x}",
            cancel: {
              num: [
                { id: "n0", tex: "4", key: "4", kind: "const" },
                { id: "n1", tex: "x-3", key: "x-3" }
              ],
              den: [
                { id: "d0", tex: "2", key: "2", kind: "const" },
                { id: "d1", tex: "x", key: "x" },
                { id: "d2", tex: "x-3", key: "x-3" }
              ],
              pairs: [["n1", "d2"]],
              afterTex: "\\dfrac{2}{x}",
              excludedNote: "x\\neq 3"
            },
            resultTex: "\\dfrac{2}{x}",
            excluded: [3],
            choices: [
              "\\dfrac{2}{x}",
              "\\dfrac{4}{2x}",
              "\\dfrac{2}{x-3}",
              "\\dfrac{4}{x}"
            ],
            answerIndex: 0,
            excludedChoices: [-3, 0, 2, 3]
          },
          {
            id: "st10",
            prompt: "จงเขียนเศษส่วนของพหุนามในรูปผลสำเร็จ",
            promptTex: "\\dfrac{x^{2}-x-6}{x^{2}-9}",
            cancel: {
              num: [
                { id: "n1", tex: "x-3", key: "x-3" },
                { id: "n2", tex: "x+2", key: "x+2" }
              ],
              den: [
                { id: "d1", tex: "x-3", key: "x-3" },
                { id: "d2", tex: "x+3", key: "x+3" }
              ],
              pairs: [["n1", "d1"]],
              afterTex: "\\dfrac{x+2}{x+3}",
              excludedNote: "x\\neq 3"
            },
            resultTex: "\\dfrac{x+2}{x+3}",
            excluded: [3],
            choices: [
              "\\dfrac{x+2}{x+3}",
              "\\dfrac{x-2}{x+3}",
              "\\dfrac{x+2}{x-3}",
              "\\dfrac{x+3}{x+2}"
            ],
            answerIndex: 0,
            excludedChoices: [-3, -2, 2, 3]
          }
        ]
      },
      muldiv: {
        learn: [
          {
            id: "m1",
            prompt: "จงหาผลลัพธ์ในรูปผลสำเร็จ",
            promptTex: "\\dfrac{3x^{2}+6x}{x-4}\\cdot\\dfrac{x}{x+2}",
            steps: [
              {
                type: "show",
                tex: "\\dfrac{3x^{2}+6x}{x-4}\\cdot\\dfrac{x}{x+2}"
              },
              {
                type: "show",
                tex: "=\\dfrac{3x(x+2)\\cdot x}{(x-4)(x+2)}"
              },
              {
                type: "cancel",
                num: [
                  { id: "n0", tex: "3", key: "3", kind: "const" },
                  { id: "n1", tex: "x", key: "x" },
                  { id: "n2", tex: "x+2", key: "x+2" },
                  { id: "n3", tex: "x", key: "x" }
                ],
                den: [
                  { id: "d1", tex: "x-4", key: "x-4" },
                  { id: "d2", tex: "x+2", key: "x+2" }
                ],
                pairs: [["n2", "d2"]],
                afterTex: "\\dfrac{3x^{2}}{x-4}",
                excludedNote: "x\\neq -2"
              },
              {
                type: "result",
                tex: "\\dfrac{3x^{2}}{x-4}",
                whenTex: "x\\neq -2"
              }
            ],
            resultTex: "\\dfrac{3x^{2}}{x-4}",
            excluded: [-2],
            choices: [
              "\\dfrac{3x^{2}}{x-4}",
              "\\dfrac{3x}{x-4}",
              "\\dfrac{3x^{2}}{x+2}",
              "\\dfrac{3x(x+2)}{x-4}"
            ],
            answerIndex: 0
          },
          {
            id: "m2",
            prompt: "จงหาผลลัพธ์ในรูปผลสำเร็จ",
            promptTex: "\\dfrac{x^{2}-x-12}{x^{2}-9}\\cdot\\dfrac{x+3}{x-4}",
            steps: [
              {
                type: "show",
                tex: "\\dfrac{x^{2}-x-12}{x^{2}-9}\\cdot\\dfrac{x+3}{x-4}"
              },
              {
                type: "show",
                tex: "=\\dfrac{(x-4)(x+3)\\cdot(x+3)}{(x-3)(x+3)\\cdot(x-4)}"
              },
              {
                type: "cancel",
                num: [
                  { id: "n1", tex: "x-4", key: "x-4" },
                  { id: "n2", tex: "x+3", key: "x+3" },
                  { id: "n3", tex: "x+3", key: "x+3" }
                ],
                den: [
                  { id: "d1", tex: "x-3", key: "x-3" },
                  { id: "d2", tex: "x+3", key: "x+3" },
                  { id: "d3", tex: "x-4", key: "x-4" }
                ],
                pairs: [
                  ["n1", "d3"],
                  ["n2", "d2"]
                ],
                afterTex: "\\dfrac{x+3}{x-3}",
                excludedNote: "x\\neq -3,\\,4"
              },
              {
                type: "result",
                tex: "\\dfrac{x+3}{x-3}",
                whenTex: "x\\neq -3,\\,x\\neq 4"
              }
            ],
            resultTex: "\\dfrac{x+3}{x-3}",
            excluded: [-3, 4],
            choices: [
              "\\dfrac{x+3}{x-3}",
              "\\dfrac{x-4}{x-3}",
              "\\dfrac{x+3}{x-4}",
              "\\dfrac{(x+3)^{2}}{(x-3)(x-4)}"
            ],
            answerIndex: 0
          },
          {
            id: "m3",
            prompt: "จงหาผลลัพธ์ในรูปผลสำเร็จ",
            promptTex: "\\dfrac{1}{x^{2}+3x}\\div\\dfrac{1}{x}",
            steps: [
              {
                type: "show",
                tex: "\\dfrac{1}{x^{2}+3x}\\div\\dfrac{1}{x}"
              },
              {
                type: "show",
                tex: "=\\dfrac{1}{x^{2}+3x}\\cdot\\dfrac{x}{1}"
              },
              {
                type: "show",
                tex: "=\\dfrac{x}{x(x+3)}"
              },
              {
                type: "cancel",
                num: [{ id: "n1", tex: "x", key: "x" }],
                den: [
                  { id: "d1", tex: "x", key: "x" },
                  { id: "d2", tex: "x+3", key: "x+3" }
                ],
                pairs: [["n1", "d1"]],
                afterTex: "\\dfrac{1}{x+3}",
                excludedNote: "x\\neq 0"
              },
              {
                type: "result",
                tex: "\\dfrac{1}{x+3}",
                whenTex: "x\\neq 0"
              }
            ],
            resultTex: "\\dfrac{1}{x+3}",
            excluded: [0],
            choices: [
              "\\dfrac{1}{x+3}",
              "\\dfrac{x}{x+3}",
              "x+3",
              "\\dfrac{1}{x(x+3)}"
            ],
            answerIndex: 0
          },
          {
            id: "m4",
            prompt: "จงหาผลลัพธ์ในรูปผลสำเร็จ",
            promptTex: "\\dfrac{x}{x+2}\\div\\dfrac{x+3}{x^{2}-4}",
            steps: [
              {
                type: "show",
                tex: "\\dfrac{x}{x+2}\\div\\dfrac{x+3}{x^{2}-4}"
              },
              {
                type: "show",
                tex: "=\\dfrac{x}{x+2}\\cdot\\dfrac{x^{2}-4}{x+3}"
              },
              {
                type: "show",
                tex: "=\\dfrac{x(x+2)(x-2)}{(x+2)(x+3)}"
              },
              {
                type: "cancel",
                num: [
                  { id: "n1", tex: "x", key: "x" },
                  { id: "n2", tex: "x+2", key: "x+2" },
                  { id: "n3", tex: "x-2", key: "x-2" }
                ],
                den: [
                  { id: "d1", tex: "x+2", key: "x+2" },
                  { id: "d2", tex: "x+3", key: "x+3" }
                ],
                pairs: [["n2", "d1"]],
                afterTex: "\\dfrac{x(x-2)}{x+3}",
                excludedNote: "x\\neq -2"
              },
              {
                type: "result",
                tex: "\\dfrac{x(x-2)}{x+3}",
                whenTex: "x\\neq -2"
              }
            ],
            resultTex: "\\dfrac{x(x-2)}{x+3}",
            excluded: [-2],
            choices: [
              "\\dfrac{x(x-2)}{x+3}",
              "\\dfrac{x}{x+3}",
              "\\dfrac{x(x+2)}{x+3}",
              "\\dfrac{x-2}{x+3}"
            ],
            answerIndex: 0
          }
        ],
        testPool: [
          {
            id: "mt1",
            prompt: "จงหาผลลัพธ์ในรูปผลสำเร็จ",
            promptTex: "\\dfrac{2x^{2}+8x}{x-5}\\cdot\\dfrac{x}{x+4}",
            cancel: {
              num: [
                { id: "n0", tex: "2", key: "2", kind: "const" },
                { id: "n1", tex: "x", key: "x" },
                { id: "n2", tex: "x+4", key: "x+4" },
                { id: "n3", tex: "x", key: "x" }
              ],
              den: [
                { id: "d1", tex: "x-5", key: "x-5" },
                { id: "d2", tex: "x+4", key: "x+4" }
              ],
              pairs: [["n2", "d2"]],
              afterTex: "\\dfrac{2x^{2}}{x-5}",
              excludedNote: "x\\neq -4"
            },
            resultTex: "\\dfrac{2x^{2}}{x-5}",
            excluded: [-4],
            choices: [
              "\\dfrac{2x^{2}}{x-5}",
              "\\dfrac{2x}{x-5}",
              "\\dfrac{2x^{2}}{x+4}",
              "\\dfrac{2x(x+4)}{x-5}"
            ],
            answerIndex: 0,
            excludedChoices: [-5, -4, 0, 4]
          },
          {
            id: "mt2",
            prompt: "จงหาผลลัพธ์ในรูปผลสำเร็จ",
            promptTex: "\\dfrac{1}{x^{2}+5x}\\div\\dfrac{1}{x}",
            cancel: {
              num: [{ id: "n1", tex: "x", key: "x" }],
              den: [
                { id: "d1", tex: "x", key: "x" },
                { id: "d2", tex: "x+5", key: "x+5" }
              ],
              pairs: [["n1", "d1"]],
              afterTex: "\\dfrac{1}{x+5}",
              excludedNote: "x\\neq 0"
            },
            resultTex: "\\dfrac{1}{x+5}",
            excluded: [0],
            choices: [
              "\\dfrac{1}{x+5}",
              "\\dfrac{x}{x+5}",
              "\\dfrac{1}{x}",
              "x+5"
            ],
            answerIndex: 0,
            excludedChoices: [-5, 0, 1, 5]
          },
          {
            id: "mt3",
            prompt: "จงหาผลลัพธ์ในรูปผลสำเร็จ",
            promptTex: "\\dfrac{x}{x+5}\\div\\dfrac{x+1}{x^{2}-25}",
            cancel: {
              num: [
                { id: "n1", tex: "x", key: "x" },
                { id: "n2", tex: "x+5", key: "x+5" },
                { id: "n3", tex: "x-5", key: "x-5" }
              ],
              den: [
                { id: "d1", tex: "x+5", key: "x+5" },
                { id: "d2", tex: "x+1", key: "x+1" }
              ],
              pairs: [["n2", "d1"]],
              afterTex: "\\dfrac{x(x-5)}{x+1}",
              excludedNote: "x\\neq -5"
            },
            resultTex: "\\dfrac{x(x-5)}{x+1}",
            excluded: [-5],
            choices: [
              "\\dfrac{x(x-5)}{x+1}",
              "\\dfrac{x}{x+1}",
              "\\dfrac{x-5}{x+1}",
              "\\dfrac{x(x+5)}{x+1}"
            ],
            answerIndex: 0,
            excludedChoices: [-5, -1, 1, 5]
          },
          {
            id: "mt4",
            prompt: "จงหาผลลัพธ์ในรูปผลสำเร็จ",
            promptTex: "\\dfrac{x^{2}-1}{x+2}\\cdot\\dfrac{x+2}{x-1}",
            cancel: {
              num: [
                { id: "n1", tex: "x-1", key: "x-1" },
                { id: "n2", tex: "x+1", key: "x+1" },
                { id: "n3", tex: "x+2", key: "x+2" }
              ],
              den: [
                { id: "d1", tex: "x+2", key: "x+2" },
                { id: "d2", tex: "x-1", key: "x-1" }
              ],
              pairs: [
                ["n1", "d2"],
                ["n3", "d1"]
              ],
              afterTex: "x+1",
              excludedNote: "x\\neq -2,\\,1"
            },
            resultTex: "x+1",
            excluded: [-2, 1],
            choices: ["x+1", "x-1", "\\dfrac{x+1}{x-1}", "(x+1)(x+2)"],
            answerIndex: 0,
            excludedChoices: [-2, -1, 1, 2]
          },
          {
            id: "mt5",
            prompt: "จงหาผลลัพธ์ในรูปผลสำเร็จ",
            promptTex: "\\dfrac{3x}{x-2}\\cdot\\dfrac{x-2}{x+1}",
            cancel: {
              num: [
                { id: "n0", tex: "3", key: "3", kind: "const" },
                { id: "n1", tex: "x", key: "x" },
                { id: "n2", tex: "x-2", key: "x-2" }
              ],
              den: [
                { id: "d1", tex: "x-2", key: "x-2" },
                { id: "d2", tex: "x+1", key: "x+1" }
              ],
              pairs: [["n2", "d1"]],
              afterTex: "\\dfrac{3x}{x+1}",
              excludedNote: "x\\neq 2"
            },
            resultTex: "\\dfrac{3x}{x+1}",
            excluded: [2],
            choices: [
              "\\dfrac{3x}{x+1}",
              "\\dfrac{3}{x+1}",
              "\\dfrac{3x}{x-2}",
              "3x"
            ],
            answerIndex: 0,
            excludedChoices: [-2, -1, 1, 2]
          },
          {
            id: "mt6",
            prompt: "จงหาผลลัพธ์ในรูปผลสำเร็จ",
            promptTex: "\\dfrac{x}{x+2}\\div\\dfrac{x}{x^{2}-4}",
            cancel: {
              num: [
                { id: "n1", tex: "x", key: "x" },
                { id: "n2", tex: "x-2", key: "x-2" },
                { id: "n3", tex: "x+2", key: "x+2" }
              ],
              den: [
                { id: "d1", tex: "x+2", key: "x+2" },
                { id: "d2", tex: "x", key: "x" }
              ],
              pairs: [
                ["n1", "d2"],
                ["n3", "d1"]
              ],
              afterTex: "x-2",
              excludedNote: "x\\neq -2,\\,0"
            },
            resultTex: "x-2",
            excluded: [-2, 0],
            choices: ["x-2", "x+2", "\\dfrac{x-2}{x}", "\\dfrac{1}{x-2}"],
            answerIndex: 0,
            excludedChoices: [-2, 0, 2, 4]
          },
          {
            id: "mt7",
            prompt: "จงหาผลลัพธ์ในรูปผลสำเร็จ",
            promptTex: "\\dfrac{x^{2}+5x}{x-3}\\cdot\\dfrac{x-3}{x+5}",
            cancel: {
              num: [
                { id: "n1", tex: "x", key: "x" },
                { id: "n2", tex: "x+5", key: "x+5" },
                { id: "n3", tex: "x-3", key: "x-3" }
              ],
              den: [
                { id: "d1", tex: "x-3", key: "x-3" },
                { id: "d2", tex: "x+5", key: "x+5" }
              ],
              pairs: [
                ["n2", "d2"],
                ["n3", "d1"]
              ],
              afterTex: "x",
              excludedNote: "x\\neq -5,\\,3"
            },
            resultTex: "x",
            excluded: [-5, 3],
            choices: ["x", "x+5", "\\dfrac{x}{x+5}", "x(x-3)"],
            answerIndex: 0,
            excludedChoices: [-5, -3, 3, 5]
          },
          {
            id: "mt8",
            prompt: "จงหาผลลัพธ์ในรูปผลสำเร็จ",
            promptTex: "\\dfrac{x-1}{x+4}\\div\\dfrac{x-1}{x^{2}-16}",
            cancel: {
              num: [
                { id: "n1", tex: "x-1", key: "x-1" },
                { id: "n2", tex: "x+4", key: "x+4" },
                { id: "n3", tex: "x-4", key: "x-4" }
              ],
              den: [
                { id: "d1", tex: "x+4", key: "x+4" },
                { id: "d2", tex: "x-1", key: "x-1" }
              ],
              pairs: [
                ["n1", "d2"],
                ["n2", "d1"]
              ],
              afterTex: "x-4",
              excludedNote: "x\\neq -4,\\,1"
            },
            resultTex: "x-4",
            excluded: [-4, 1],
            choices: ["x-4", "x+4", "\\dfrac{x-4}{x-1}", "\\dfrac{1}{x-4}"],
            answerIndex: 0,
            excludedChoices: [-4, -1, 1, 4]
          },
          {
            id: "mt9",
            prompt: "จงหาผลลัพธ์ในรูปผลสำเร็จ",
            promptTex: "\\dfrac{2x+4}{x}\\cdot\\dfrac{x}{x+2}",
            cancel: {
              num: [
                { id: "n0", tex: "2", key: "2", kind: "const" },
                { id: "n1", tex: "x+2", key: "x+2" },
                { id: "n2", tex: "x", key: "x" }
              ],
              den: [
                { id: "d1", tex: "x", key: "x" },
                { id: "d2", tex: "x+2", key: "x+2" }
              ],
              pairs: [
                ["n1", "d2"],
                ["n2", "d1"]
              ],
              afterTex: "2",
              excludedNote: "x\\neq 0,\\,-2"
            },
            resultTex: "2",
            excluded: [0, -2],
            choices: ["2", "2x", "\\dfrac{2}{x}", "x+2"],
            answerIndex: 0,
            excludedChoices: [-2, 0, 2, 4]
          },
          {
            id: "mt10",
            prompt: "จงหาผลลัพธ์ในรูปผลสำเร็จ",
            promptTex: "\\dfrac{x^{2}-4}{x+3}\\cdot\\dfrac{x+3}{x+2}",
            cancel: {
              num: [
                { id: "n1", tex: "x-2", key: "x-2" },
                { id: "n2", tex: "x+2", key: "x+2" },
                { id: "n3", tex: "x+3", key: "x+3" }
              ],
              den: [
                { id: "d1", tex: "x+3", key: "x+3" },
                { id: "d2", tex: "x+2", key: "x+2" }
              ],
              pairs: [
                ["n2", "d2"],
                ["n3", "d1"]
              ],
              afterTex: "x-2",
              excludedNote: "x\\neq -3,\\,-2"
            },
            resultTex: "x-2",
            excluded: [-3, -2],
            choices: ["x-2", "x+2", "\\dfrac{x-2}{x+3}", "(x-2)(x+3)"],
            answerIndex: 0,
            excludedChoices: [-3, -2, 2, 3]
          }
        ]
      },
      addsub: {
        learn: [
          {
            id: "a1",
            prompt: "จงหาผลลัพธ์ในรูปผลสำเร็จ",
            promptTex: "\\dfrac{3x+1}{x+2}+\\dfrac{x-5}{x+2}",
            steps: [
              {
                type: "show",
                tex: "\\dfrac{3x+1}{x+2}+\\dfrac{x-5}{x+2}"
              },
              {
                type: "show",
                tex: "=\\dfrac{(3x+1)+(x-5)}{x+2}"
              },
              {
                type: "result",
                tex: "\\dfrac{4x-4}{x+2}"
              }
            ],
            resultTex: "\\dfrac{4x-4}{x+2}",
            excluded: [],
            choices: [
              "\\dfrac{4x-4}{x+2}",
              "\\dfrac{4x+4}{x+2}",
              "\\dfrac{2x-4}{x+2}",
              "\\dfrac{4x-4}{2(x+2)}"
            ],
            answerIndex: 0,
            skipCancel: true
          },
          {
            id: "a2",
            prompt: "จงหาผลลัพธ์ในรูปผลสำเร็จ",
            promptTex: "\\dfrac{5}{x+3}-\\dfrac{2-x}{x+3}",
            steps: [
              {
                type: "show",
                tex: "\\dfrac{5}{x+3}-\\dfrac{2-x}{x+3}"
              },
              {
                type: "show",
                tex: "=\\dfrac{5-(2-x)}{x+3}"
              },
              {
                type: "show",
                tex: "=\\dfrac{5-2+x}{x+3}=\\dfrac{x+3}{x+3}"
              },
              {
                type: "cancel",
                num: [{ id: "n1", tex: "x+3", key: "x+3" }],
                den: [{ id: "d1", tex: "x+3", key: "x+3" }],
                pairs: [["n1", "d1"]],
                afterTex: "1",
                excludedNote: "x\\neq -3"
              },
              {
                type: "result",
                tex: "1",
                whenTex: "x\\neq -3"
              }
            ],
            resultTex: "1",
            excluded: [-3],
            choices: ["1", "x+3", "\\dfrac{x+3}{x+3}", "\\dfrac{7-x}{x+3}"],
            answerIndex: 0
          },
          {
            id: "a3",
            prompt: "จงหาผลลัพธ์ในรูปผลสำเร็จ",
            promptTex: "\\dfrac{1}{x}+\\dfrac{2}{x+2}",
            steps: [
              { type: "show", tex: "\\dfrac{1}{x}+\\dfrac{2}{x+2}" },
              {
                type: "show",
                tex: "=\\dfrac{x+2}{x(x+2)}+\\dfrac{2x}{x(x+2)}"
              },
              {
                type: "result",
                tex: "\\dfrac{3x+2}{x(x+2)}"
              }
            ],
            resultTex: "\\dfrac{3x+2}{x(x+2)}",
            excluded: [],
            choices: [
              "\\dfrac{3x+2}{x(x+2)}",
              "\\dfrac{3}{x(x+2)}",
              "\\dfrac{3x+2}{x+2}",
              "\\dfrac{x+2+2x}{x}"
            ],
            answerIndex: 0,
            skipCancel: true
          },
          {
            id: "a4",
            prompt: "จงหาผลลัพธ์ในรูปผลสำเร็จ",
            promptTex: "\\dfrac{x}{x+4}-\\dfrac{32}{x^{2}-16}",
            steps: [
              {
                type: "show",
                tex: "\\dfrac{x}{x+4}-\\dfrac{32}{x^{2}-16}"
              },
              {
                type: "show",
                tex: "=\\dfrac{x}{x+4}-\\dfrac{32}{(x+4)(x-4)}"
              },
              {
                type: "show",
                tex: "=\\dfrac{x(x-4)-32}{(x+4)(x-4)}=\\dfrac{x^{2}-4x-32}{(x+4)(x-4)}"
              },
              {
                type: "show",
                tex: "=\\dfrac{(x+4)(x-8)}{(x+4)(x-4)}"
              },
              {
                type: "cancel",
                num: [
                  { id: "n1", tex: "x+4", key: "x+4" },
                  { id: "n2", tex: "x-8", key: "x-8" }
                ],
                den: [
                  { id: "d1", tex: "x+4", key: "x+4" },
                  { id: "d2", tex: "x-4", key: "x-4" }
                ],
                pairs: [["n1", "d1"]],
                afterTex: "\\dfrac{x-8}{x-4}",
                excludedNote: "x\\neq -4"
              },
              {
                type: "result",
                tex: "\\dfrac{x-8}{x-4}",
                whenTex: "x\\neq -4"
              }
            ],
            resultTex: "\\dfrac{x-8}{x-4}",
            excluded: [-4],
            choices: [
              "\\dfrac{x-8}{x-4}",
              "\\dfrac{x-8}{x+4}",
              "\\dfrac{x+4}{x-4}",
              "\\dfrac{x^{2}-4x-32}{x^{2}-16}"
            ],
            answerIndex: 0
          }
        ],
        testPool: [
          {
            id: "at1",
            prompt: "จงหาผลลัพธ์ในรูปผลสำเร็จ",
            promptTex: "\\dfrac{2x+7}{x-1}+\\dfrac{x-4}{x-1}",
            skipCancel: true,
            resultTex: "\\dfrac{3x+3}{x-1}",
            excluded: [],
            choices: [
              "\\dfrac{3x+3}{x-1}",
              "\\dfrac{3x+11}{x-1}",
              "\\dfrac{x+3}{x-1}",
              "\\dfrac{3x+3}{2(x-1)}"
            ],
            answerIndex: 0,
            excludedChoices: []
          },
          {
            id: "at2",
            prompt: "จงหาผลลัพธ์ในรูปผลสำเร็จ",
            promptTex: "\\dfrac{4}{x+1}-\\dfrac{3-x}{x+1}",
            cancel: {
              num: [{ id: "n1", tex: "x+1", key: "x+1" }],
              den: [{ id: "d1", tex: "x+1", key: "x+1" }],
              pairs: [["n1", "d1"]],
              afterTex: "1",
              excludedNote: "x\\neq -1"
            },
            resultTex: "1",
            excluded: [-1],
            choices: ["1", "x+1", "\\dfrac{7-x}{x+1}", "\\dfrac{x+1}{x+1}"],
            answerIndex: 0,
            excludedChoices: [-1, 0, 1, 3]
          },
          {
            id: "at3",
            prompt: "จงหาผลลัพธ์ในรูปผลสำเร็จ",
            promptTex: "\\dfrac{x}{x+5}-\\dfrac{30}{x^{2}-25}",
            cancel: {
              num: [
                { id: "n1", tex: "x+5", key: "x+5" },
                { id: "n2", tex: "x-6", key: "x-6" }
              ],
              den: [
                { id: "d1", tex: "x+5", key: "x+5" },
                { id: "d2", tex: "x-5", key: "x-5" }
              ],
              pairs: [["n1", "d1"]],
              afterTex: "\\dfrac{x-6}{x-5}",
              excludedNote: "x\\neq -5"
            },
            resultTex: "\\dfrac{x-6}{x-5}",
            excluded: [-5],
            choices: [
              "\\dfrac{x-6}{x-5}",
              "\\dfrac{x-6}{x+5}",
              "\\dfrac{x+5}{x-5}",
              "\\dfrac{x^{2}-5x-30}{x^{2}-25}"
            ],
            answerIndex: 0,
            excludedChoices: [-5, 5, -6, 6]
          },
          {
            id: "at4",
            prompt: "จงหาผลลัพธ์ในรูปผลสำเร็จ",
            promptTex: "\\dfrac{5x-2}{x+3}+\\dfrac{x+5}{x+3}",
            skipCancel: true,
            resultTex: "\\dfrac{6x+3}{x+3}",
            excluded: [],
            choices: [
              "\\dfrac{6x+3}{x+3}",
              "\\dfrac{6x+3}{2(x+3)}",
              "\\dfrac{4x+3}{x+3}",
              "\\dfrac{6x-7}{x+3}"
            ],
            answerIndex: 0,
            excludedChoices: []
          },
          {
            id: "at5",
            prompt: "จงหาผลลัพธ์ในรูปผลสำเร็จ",
            promptTex: "\\dfrac{7}{x+2}-\\dfrac{5-x}{x+2}",
            cancel: {
              num: [{ id: "n1", tex: "x+2", key: "x+2" }],
              den: [{ id: "d1", tex: "x+2", key: "x+2" }],
              pairs: [["n1", "d1"]],
              afterTex: "1",
              excludedNote: "x\\neq -2"
            },
            resultTex: "1",
            excluded: [-2],
            choices: ["1", "x+2", "\\dfrac{12-x}{x+2}", "\\dfrac{x+2}{x+2}"],
            answerIndex: 0,
            excludedChoices: [-2, 0, 2, 5]
          },
          {
            id: "at6",
            prompt: "จงหาผลลัพธ์ในรูปผลสำเร็จ",
            promptTex: "\\dfrac{2}{x}+\\dfrac{3}{x+1}",
            skipCancel: true,
            resultTex: "\\dfrac{5x+2}{x(x+1)}",
            excluded: [],
            choices: [
              "\\dfrac{5x+2}{x(x+1)}",
              "\\dfrac{5}{x(x+1)}",
              "\\dfrac{5x+2}{x+1}",
              "\\dfrac{2(x+1)+3x}{x}"
            ],
            answerIndex: 0,
            excludedChoices: []
          },
          {
            id: "at7",
            prompt: "จงหาผลลัพธ์ในรูปผลสำเร็จ",
            promptTex: "\\dfrac{x}{x-3}-\\dfrac{18}{x^{2}-9}",
            cancel: {
              num: [
                { id: "n1", tex: "x-3", key: "x-3" },
                { id: "n2", tex: "x+6", key: "x+6" }
              ],
              den: [
                { id: "d1", tex: "x-3", key: "x-3" },
                { id: "d2", tex: "x+3", key: "x+3" }
              ],
              pairs: [["n1", "d1"]],
              afterTex: "\\dfrac{x+6}{x+3}",
              excludedNote: "x\\neq 3"
            },
            resultTex: "\\dfrac{x+6}{x+3}",
            excluded: [3],
            choices: [
              "\\dfrac{x+6}{x+3}",
              "\\dfrac{x+6}{x-3}",
              "\\dfrac{x-6}{x+3}",
              "\\dfrac{x^{2}+3x-18}{x^{2}-9}"
            ],
            answerIndex: 0,
            excludedChoices: [-3, 3, -6, 6]
          },
          {
            id: "at8",
            prompt: "จงหาผลลัพธ์ในรูปผลสำเร็จ",
            promptTex: "\\dfrac{4x+1}{x-5}+\\dfrac{x-6}{x-5}",
            skipCancel: true,
            resultTex: "\\dfrac{5x-5}{x-5}",
            excluded: [],
            choices: [
              "\\dfrac{5x-5}{x-5}",
              "\\dfrac{5x-5}{2(x-5)}",
              "\\dfrac{3x-5}{x-5}",
              "\\dfrac{5x+7}{x-5}"
            ],
            answerIndex: 0,
            excludedChoices: []
          },
          {
            id: "at9",
            prompt: "จงหาผลลัพธ์ในรูปผลสำเร็จ",
            promptTex: "\\dfrac{1}{x+4}+\\dfrac{3}{x}",
            skipCancel: true,
            resultTex: "\\dfrac{4x+12}{x(x+4)}",
            excluded: [],
            choices: [
              "\\dfrac{4x+12}{x(x+4)}",
              "\\dfrac{4}{x(x+4)}",
              "\\dfrac{4x+12}{x+4}",
              "\\dfrac{x+3(x+4)}{x}"
            ],
            answerIndex: 0,
            excludedChoices: []
          },
          {
            id: "at10",
            prompt: "จงหาผลลัพธ์ในรูปผลสำเร็จ",
            promptTex: "\\dfrac{x}{x-2}-\\dfrac{8}{x^{2}-4}",
            cancel: {
              num: [
                { id: "n1", tex: "x-2", key: "x-2" },
                { id: "n2", tex: "x+4", key: "x+4" }
              ],
              den: [
                { id: "d1", tex: "x-2", key: "x-2" },
                { id: "d2", tex: "x+2", key: "x+2" }
              ],
              pairs: [["n1", "d1"]],
              afterTex: "\\dfrac{x+4}{x+2}",
              excludedNote: "x\\neq 2"
            },
            resultTex: "\\dfrac{x+4}{x+2}",
            excluded: [2],
            choices: [
              "\\dfrac{x+4}{x+2}",
              "\\dfrac{x+4}{x-2}",
              "\\dfrac{x-4}{x+2}",
              "\\dfrac{x^{2}+2x-8}{x^{2}-4}"
            ],
            answerIndex: 0,
            excludedChoices: [-4, -2, 2, 4]
          }
        ]
      }
    }
  }
};
