window.CONTENT = {
  "th": {
    "landing": {
      "eyebrow": "INTERACTIVE MATHEMATICS",
      "title": "สัจนิรันดร์",
      "start": "เริ่ม"
    },
    "app": {
      "title": "สัจนิรันดร์"
    },
    "ui": {
      "modeLabel": "โหมด",
      "study": "ศึกษา",
      "test": "ทดสอบ",
      "methodLabel": "วิธีการตรวจสอบ",
      "methodTruth": "ตารางค่าความจริง",
      "methodContra": "หาข้อขัดแย้ง",
      "infoLabel": "ความหมาย",
      "questionOf": "ข้อ {n}/{total}",
      "check": "ตรวจสอบ",
      "reveal": "เฉลย",
      "checkIncomplete": "เติมคำตอบให้ครบถ้วน",
      "tilesLabel": "สร้างรูปแบบประพจน์ด้วยแผ่นป้าย",
      "exprLabel": "นิพจน์ :",
      "exprBackspace": "ลบ",
      "exprClear": "ล้างนิพจน์",
      "exprShow": "สร้าง",
      "exprInvalid": "เขียนนิพจน์ไม่ถูกต้องตามหลักการ",
      "exprEmptyHint": "เลือกแผ่นป้ายเพื่อสร้างรูปแบบประพจน์",
      "exerciseReset": "รีเฟรช",
      "defText": "สัจนิรันดร์ คือ รูปแบบประพจน์ที่มีค่าความจริงเป็นจริงทุกกรณี",
      "defTextContra": "การตรวจสอบสัจนิรันดร์โดยหาข้อขัดแย้งทำได้ดังนี้\n1. กำหนดให้รูปแบบประพจน์เป็นเท็จ\n2. ย้อนหาค่าความจริงของแต่ละประพจน์\n3. ถ้ามีข้อขัดแย้ง สรุปว่ารูปแบบประพจน์นั้นเป็นสัจนิรันดร์\nถ้าไม่มีข้อขัดแย้ง สรุปว่ารูปแบบประพจน์นั้นไม่เป็นสัจนิรันดร์",
      "assumeTemplate": "สมมติว่า ${expr} มีค่าความจริงเป็นเท็จ",
      "yesTautology": "ดังนั้น ${expr} เป็นสัจนิรันดร์",
      "noTautology": "ดังนั้น ${expr} ไม่เป็นสัจนิรันดร์",
      "yesTautologyContra": "ดังนั้น ${expr} เป็นสัจนิรันดร์ (มีข้อขัดแย้ง)",
      "noTautologyContra": "ดังนั้น ${expr} ไม่เป็นสัจนิรันดร์ (ไม่มีข้อขัดแย้ง)"
    },
    "truthQuestions": [
      {
        "id": "t1",
        "atoms": ["p"],
        "columns": ["\\sim p", "p \\lor \\sim p"],
        "exprLatex": "p \\lor \\sim p",
        "prompt": "ให้ตรวจสอบว่า $p \\lor \\sim p$ เป็นสัจนิรันดร์หรือไม่",
        "tautology": true
      },
      {
        "id": "t2",
        "atoms": ["p", "q"],
        "columns": ["p \\land q", "(p \\land q) \\rightarrow q"],
        "exprLatex": "(p \\land q) \\rightarrow q",
        "prompt": "ให้ตรวจสอบว่า $(p \\land q) \\rightarrow q$ เป็นสัจนิรันดร์หรือไม่",
        "tautology": true
      },
      {
        "id": "t3",
        "atoms": ["p", "q"],
        "columns": ["p \\lor q", "(p \\lor q) \\rightarrow p"],
        "exprLatex": "(p \\lor q) \\rightarrow p",
        "prompt": "ให้ตรวจสอบว่า $(p \\lor q) \\rightarrow p$ เป็นสัจนิรันดร์หรือไม่",
        "tautology": false
      },
      {
        "id": "t4",
        "atoms": ["p", "q"],
        "columns": [
          "\\sim q",
          "p \\rightarrow \\sim q",
          "\\sim p",
          "q \\rightarrow \\sim p",
          "(p \\rightarrow \\sim q) \\lor (q \\rightarrow \\sim p)"
        ],
        "exprLatex": "(p \\rightarrow \\sim q) \\lor (q \\rightarrow \\sim p)",
        "prompt": "ให้ตรวจสอบว่า $(p \\rightarrow \\sim q) \\lor (q \\rightarrow \\sim p)$ เป็นสัจนิรันดร์หรือไม่",
        "tautology": false
      },
      {
        "id": "t5",
        "atoms": ["p", "q"],
        "columns": [
          "p \\rightarrow q",
          "\\sim (p \\rightarrow q)",
          "\\sim q",
          "p \\land \\sim q",
          "\\sim (p \\rightarrow q) \\leftrightarrow (p \\land \\sim q)"
        ],
        "exprLatex": "\\sim (p \\rightarrow q) \\leftrightarrow (p \\land \\sim q)",
        "prompt": "ให้ตรวจสอบว่า $\\sim (p \\rightarrow q) \\leftrightarrow (p \\land \\sim q)$ เป็นสัจนิรันดร์หรือไม่",
        "tautology": true
      }
    ],
    "contraQuestions": [
      {
        "id": "c1",
        "exprLatex": "p \\rightarrow (p \\lor q)",
        "prompt": "ให้ตรวจสอบว่า $p \\rightarrow (p \\lor q)$ เป็นสัจนิรันดร์หรือไม่",
        "tokens": ["p", "implies", "lparen", "p", "or", "q", "rparen"],
        "tautology": true,
        "expected": {
          "0": "T",
          "1": "F",
          "3": "F",
          "4": "F",
          "5": "F"
        },
        "conflicts": [[0, 3]]
      },
      {
        "id": "c2",
        "exprLatex": "(p \\land \\sim q) \\lor p",
        "prompt": "ให้ตรวจสอบว่า $(p \\land \\sim q) \\lor p$ เป็นสัจนิรันดร์หรือไม่",
        "tokens": ["lparen", "p", "and", "not", "q", "rparen", "or", "p"],
        "tautology": false,
        "expected": {
          "1": "F",
          "2": "F",
          "3": "F",
          "4": "T",
          "6": "F",
          "7": "F"
        },
        "conflicts": []
      },
      {
        "id": "c3",
        "exprLatex": "[p \\rightarrow (q \\lor r)] \\lor [q \\leftrightarrow (p \\land r)]",
        "prompt": "ให้ตรวจสอบว่า $[p \\rightarrow (q \\lor r)] \\lor [q \\leftrightarrow (p \\land r)]$ เป็นสัจนิรันดร์หรือไม่",
        "tokens": [
          "lbrack",
          "p",
          "implies",
          "lparen",
          "q",
          "or",
          "r",
          "rparen",
          "rbrack",
          "or",
          "lbrack",
          "q",
          "iff",
          "lparen",
          "p",
          "and",
          "r",
          "rparen",
          "rbrack"
        ],
        "tautology": true,
        "expected": {
          "1": "T",
          "2": "F",
          "4": "F",
          "5": "F",
          "6": "F",
          "9": "F",
          "11": "F",
          "12": "F",
          "14": "T",
          "15": "T",
          "16": "T"
        },
        "conflicts": [[6, 16]]
      },
      {
        "id": "c4",
        "exprLatex": "[p \\land (p \\rightarrow q)] \\rightarrow q",
        "prompt": "ให้ตรวจสอบว่า $[p \\land (p \\rightarrow q)] \\rightarrow q$ เป็นสัจนิรันดร์หรือไม่",
        "tokens": [
          "lbrack",
          "p",
          "and",
          "lparen",
          "p",
          "implies",
          "q",
          "rparen",
          "rbrack",
          "implies",
          "q"
        ],
        "tautology": true,
        "expected": {
          "1": "T",
          "2": "T",
          "4": "F",
          "5": "T",
          "6": "F",
          "9": "F",
          "10": "F"
        },
        "conflicts": [[1, 4]]
      },
      {
        "id": "c5",
        "exprLatex": "(p \\land q) \\rightarrow (p \\rightarrow q)",
        "prompt": "ให้ตรวจสอบว่า $(p \\land q) \\rightarrow (p \\rightarrow q)$ เป็นสัจนิรันดร์หรือไม่",
        "tokens": [
          "lparen",
          "p",
          "and",
          "q",
          "rparen",
          "implies",
          "lparen",
          "p",
          "implies",
          "q",
          "rparen"
        ],
        "tautology": true,
        "expected": {
          "1": "T",
          "2": "T",
          "3": "T",
          "5": "F",
          "7": "T",
          "8": "F",
          "9": "F"
        },
        "conflicts": [[3, 9]]
      }
    ]
  }
};
