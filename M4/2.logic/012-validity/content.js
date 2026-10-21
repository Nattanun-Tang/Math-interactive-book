window.CONTENT = {
  "th": {
    "landing": {
      "eyebrow": "INTERACTIVE MATHEMATICS",
      "title": "การอ้างเหตุผล",
      "start": "เริ่ม"
    },
    "app": {
      "title": "การอ้างเหตุผล"
    },
    "ui": {
      "infoLabel": "ความหมาย",
      "questionOf": "ข้อ {n}/{total}",
      "check": "ตรวจสอบ",
      "reveal": "เฉลย",
      "checkIncomplete": "เติมคำตอบให้ครบถ้วน",
      "promptAsk": "การอ้างเหตุผลต่อไปนี้สมเหตุสมผลหรือไม่",
      "premiseTag": "เหตุ",
      "conclusionTag": "ผล",
      "formLabel": "รูปแบบสำหรับตรวจสอบ",
      "defText": "การอ้างเหตุผลจะสมเหตุสมผล ก็ต่อเมื่อถ้าเหตุทุกข้อเป็นจริงแล้ว ผลต้องเป็นจริงด้วย\nวิธีตรวจสอบความสมเหตุสมผล\n1. เชื่อมเหตุทุกข้อด้วย $\\land$\n2. นำมา $\\rightarrow$ กับผล ได้รูปแบบประพจน์\n3. ตรวจสอบว่าเป็นสัจนิรันดร์หรือไม่ โดยหาข้อขัดแย้ง\n   • กำหนดให้รูปแบบประพจน์เป็นเท็จ แล้วย้อนหาค่าความจริง\n   • ถ้ามีข้อขัดแย้ง รูปแบบเป็นสัจนิรันดร์ การอ้างเหตุผลสมเหตุสมผล\n   • ถ้าไม่มีข้อขัดแย้ง รูปแบบไม่เป็นสัจนิรันดร์ การอ้างเหตุผลไม่สมเหตุสมผล",
      "assumeTemplate": "สมมติว่า ${expr} มีค่าความจริงเป็นเท็จ",
      "yesValid": "ดังนั้น การอ้างเหตุผลนี้สมเหตุสมผล (มีข้อขัดแย้ง รูปแบบเป็นสัจนิรันดร์)",
      "noValid": "ดังนั้น การอ้างเหตุผลนี้ไม่สมเหตุสมผล (ไม่มีข้อขัดแย้ง รูปแบบไม่เป็นสัจนิรันดร์)"
    },
    "questions": [
      {
        "id": "v1",
        "premises": ["p \\rightarrow q", "p"],
        "conclusion": "q",
        "formLatex": "[(p \\rightarrow q) \\land p] \\rightarrow q",
        "tokens": [
          "lbrack", "lparen", "p", "implies", "q", "rparen", "and", "p", "rbrack", "implies", "q"
        ],
        "valid": true,
        "expected": {
          "2": "T",
          "3": "T",
          "4": "T",
          "6": "T",
          "7": "T",
          "9": "F",
          "10": "F"
        },
        "conflicts": [[4, 10]]
      },
      {
        "id": "v2",
        "premises": ["p \\rightarrow q", "q"],
        "conclusion": "p",
        "formLatex": "[(p \\rightarrow q) \\land q] \\rightarrow p",
        "tokens": [
          "lbrack", "lparen", "p", "implies", "q", "rparen", "and", "q", "rbrack", "implies", "p"
        ],
        "valid": false,
        "expected": {
          "2": "F",
          "3": "T",
          "4": "T",
          "6": "T",
          "7": "T",
          "9": "F",
          "10": "F"
        },
        "conflicts": []
      },
      {
        "id": "v3",
        "premises": ["p \\lor q", "\\sim p"],
        "conclusion": "q",
        "formLatex": "[(p \\lor q) \\land \\sim p] \\rightarrow q",
        "tokens": [
          "lbrack", "lparen", "p", "or", "q", "rparen", "and", "not", "p", "rbrack", "implies", "q"
        ],
        "valid": true,
        "expected": {
          "2": "F",
          "3": "T",
          "4": "T",
          "6": "T",
          "7": "T",
          "8": "F",
          "10": "F",
          "11": "F"
        },
        "conflicts": [[4, 11]]
      },
      {
        "id": "v4",
        "premises": ["p \\rightarrow q", "q \\rightarrow r", "p"],
        "conclusion": "r",
        "formLatex": "[(p \\rightarrow q) \\land (q \\rightarrow r) \\land p] \\rightarrow r",
        "tokens": [
          "lbrack", "lparen", "p", "implies", "q", "rparen", "and",
          "lparen", "q", "implies", "r", "rparen", "and", "p", "rbrack", "implies", "r"
        ],
        "valid": true,
        "expected": {
          "2": "T",
          "3": "T",
          "4": "T",
          "6": "T",
          "8": "T",
          "9": "T",
          "10": "T",
          "12": "T",
          "13": "T",
          "15": "F",
          "16": "F"
        },
        "conflicts": [[10, 16]]
      },
      {
        "id": "v5",
        "premises": ["p \\rightarrow q", "q \\rightarrow r", "r"],
        "conclusion": "p",
        "formLatex": "[(p \\rightarrow q) \\land (q \\rightarrow r) \\land r] \\rightarrow p",
        "tokens": [
          "lbrack", "lparen", "p", "implies", "q", "rparen", "and",
          "lparen", "q", "implies", "r", "rparen", "and", "r", "rbrack", "implies", "p"
        ],
        "valid": false,
        "expected": {
          "2": "F",
          "3": "T",
          "4": "F",
          "6": "T",
          "8": "F",
          "9": "T",
          "10": "T",
          "12": "T",
          "13": "T",
          "15": "F",
          "16": "F"
        },
        "conflicts": []
      },
      {
        "id": "v6",
        "premises": ["p \\rightarrow q", "\\sim p \\rightarrow r", "\\sim q"],
        "conclusion": "r",
        "formLatex": "[(p \\rightarrow q) \\land (\\sim p \\rightarrow r) \\land \\sim q] \\rightarrow r",
        "tokens": [
          "lbrack", "lparen", "p", "implies", "q", "rparen", "and",
          "lparen", "not", "p", "implies", "r", "rparen", "and", "not", "q",
          "rbrack", "implies", "r"
        ],
        "valid": true,
        "expected": {
          "2": "F",
          "3": "T",
          "4": "F",
          "6": "T",
          "8": "T",
          "9": "F",
          "10": "T",
          "11": "T",
          "13": "T",
          "14": "T",
          "15": "F",
          "17": "F",
          "18": "F"
        },
        "conflicts": [[11, 18]]
      },
      {
        "id": "v7",
        "premises": ["p \\rightarrow q", "r \\rightarrow q", "\\sim p"],
        "conclusion": "\\sim r",
        "formLatex": "[(p \\rightarrow q) \\land (r \\rightarrow q) \\land \\sim p] \\rightarrow \\sim r",
        "tokens": [
          "lbrack", "lparen", "p", "implies", "q", "rparen", "and",
          "lparen", "r", "implies", "q", "rparen", "and", "not", "p",
          "rbrack", "implies", "not", "r"
        ],
        "valid": false,
        "expected": {
          "2": "F",
          "3": "T",
          "4": "T",
          "6": "T",
          "8": "T",
          "9": "T",
          "10": "T",
          "12": "T",
          "13": "T",
          "14": "F",
          "16": "F",
          "17": "F",
          "18": "T"
        },
        "conflicts": []
      },
      {
        "id": "v8",
        "premises": ["p \\lor q", "\\sim p", "q \\rightarrow r", "p \\rightarrow r"],
        "conclusion": "r",
        "formLatex": "[(p \\lor q) \\land \\sim p \\land (q \\rightarrow r) \\land (p \\rightarrow r)] \\rightarrow r",
        "tokens": [
          "lbrack", "lparen", "p", "or", "q", "rparen", "and", "not", "p", "and",
          "lparen", "q", "implies", "r", "rparen", "and",
          "lparen", "p", "implies", "r", "rparen", "rbrack", "implies", "r"
        ],
        "valid": true,
        "expected": {
          "2": "F",
          "3": "T",
          "4": "T",
          "6": "T",
          "7": "T",
          "8": "F",
          "9": "T",
          "11": "T",
          "12": "T",
          "13": "T",
          "15": "T",
          "17": "F",
          "18": "T",
          "19": "T",
          "22": "F",
          "23": "F"
        },
        "conflicts": [[13, 23]]
      },
      {
        "id": "v9",
        "premises": ["p \\rightarrow q", "q \\rightarrow r", "r \\rightarrow p", "\\sim p"],
        "conclusion": "q",
        "formLatex": "[(p \\rightarrow q) \\land (q \\rightarrow r) \\land (r \\rightarrow p) \\land \\sim p] \\rightarrow q",
        "tokens": [
          "lbrack", "lparen", "p", "implies", "q", "rparen", "and",
          "lparen", "q", "implies", "r", "rparen", "and",
          "lparen", "r", "implies", "p", "rparen", "and", "not", "p",
          "rbrack", "implies", "q"
        ],
        "valid": false,
        "expected": {
          "2": "F",
          "3": "T",
          "4": "F",
          "6": "T",
          "8": "F",
          "9": "T",
          "10": "F",
          "12": "T",
          "14": "F",
          "15": "T",
          "16": "F",
          "18": "T",
          "19": "T",
          "20": "F",
          "22": "F",
          "23": "F"
        },
        "conflicts": []
      },
      {
        "id": "v10",
        "premises": ["p \\rightarrow q", "\\sim p \\rightarrow r", "\\sim q", "\\sim r \\rightarrow p"],
        "conclusion": "r",
        "formLatex": "[(p \\rightarrow q) \\land (\\sim p \\rightarrow r) \\land \\sim q \\land (\\sim r \\rightarrow p)] \\rightarrow r",
        "tokens": [
          "lbrack", "lparen", "p", "implies", "q", "rparen", "and",
          "lparen", "not", "p", "implies", "r", "rparen", "and", "not", "q", "and",
          "lparen", "not", "r", "implies", "p", "rparen", "rbrack", "implies", "r"
        ],
        "valid": true,
        "expected": {
          "2": "F",
          "3": "T",
          "4": "F",
          "6": "T",
          "8": "T",
          "9": "F",
          "10": "T",
          "11": "T",
          "13": "T",
          "14": "T",
          "15": "F",
          "16": "T",
          "18": "F",
          "19": "T",
          "20": "T",
          "21": "F",
          "24": "F",
          "25": "F"
        },
        "conflicts": [[11, 25]]
      }
    ]
  }
};
