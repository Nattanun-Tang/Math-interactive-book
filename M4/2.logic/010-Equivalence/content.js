window.CONTENT = {
  "th": {
    "landing": {
      "eyebrow": "INTERACTIVE MATHEMATICS",
      "title": "รูปแบบประพจน์ที่สมมูลกัน",
      "start": "เริ่ม"
    },
    "app": {
      "title": "รูปแบบประพจน์ที่สมมูลกัน"
    },
    "ui": {
      "methodLabel": "วิธีการตรวจสอบ",
      "methodTruth": "ตารางค่าความจริง",
      "methodForms": "ใช้รูปแบบประพจน์ที่สมมูลกัน",
      "formulasBtn": "รูปแบบประพจน์ที่สมมูลกัน",
      "infoLabel": "ความหมาย",
      "questionOf": "ข้อ {n}/{total}",
      "check": "ตรวจสอบ",
      "reveal": "เฉลย",
      "prev": "ก่อนหน้า",
      "next": "ถัดไป",
      "all": "ทั้งหมด",
      "checkIncomplete": "เติมคำตอบให้ครบถ้วน",
      "emptyStep": "กดปุ่ม “ถัดไป” เพื่อดูการแสดงวิธีทำทีละบรรทัด\nหรือกดปุ่ม “ทั้งหมด” เพื่อแสดงวิธีทำในครั้งเดียว",
      "defText": "รูปแบบประพจน์ที่สมมูลกัน คือ รูปแบบประพจน์ที่มีค่าความจริงเหมือนกันกรณีต่อกรณี",
      "formulasTitle": "รูปแบบของประพจน์ที่สมมูลกันที่ควรทราบมีดังนี้"
    },
    "formulas": [
      "$p \\equiv {\\sim}({\\sim}p)$",
      "$p \\land q \\equiv q \\land p$",
      "$p \\lor q \\equiv q \\lor p$",
      "$(p \\lor q) \\lor r \\equiv p \\lor (q \\lor r)$",
      "$(p \\land q) \\land r \\equiv p \\land (q \\land r)$",
      "${\\sim}(p \\land q) \\equiv {\\sim}p \\lor {\\sim}q$",
      "${\\sim}(p \\lor q) \\equiv {\\sim}p \\land {\\sim}q$",
      "$p \\rightarrow q \\equiv {\\sim}p \\lor q$",
      "$p \\rightarrow q \\equiv {\\sim}q \\rightarrow {\\sim}p$",
      "$p \\leftrightarrow q \\equiv (p \\rightarrow q) \\land (q \\rightarrow p)$",
      "$p \\land (q \\lor r) \\equiv (p \\land q) \\lor (p \\land r)$",
      "$p \\lor (q \\land r) \\equiv (p \\lor q) \\land (p \\lor r)$"
    ],
    "truthQuestions": [
      {
        "id": "t1",
        "atoms": [
          "p",
          "q"
        ],
        "columns": [
          "\\sim p",
          "p \\rightarrow q",
          "\\sim p \\lor q"
        ],
        "leftLatex": "p \\rightarrow q",
        "rightLatex": "\\sim p \\lor q",
        "prompt": "ให้ตรวจสอบว่า $p \\rightarrow q$ สมมูลกับ $\\sim p \\lor q$ หรือไม่",
        "equivalent": true
      },
      {
        "id": "t2",
        "atoms": [
          "p",
          "q"
        ],
        "columns": [
          "\\sim p",
          "\\sim q",
          "p \\rightarrow q",
          "\\sim q \\rightarrow \\sim p"
        ],
        "leftLatex": "p \\rightarrow q",
        "rightLatex": "\\sim q \\rightarrow \\sim p",
        "prompt": "ให้ตรวจสอบว่า $p \\rightarrow q$ สมมูลกับ $\\sim q \\rightarrow \\sim p$ หรือไม่",
        "equivalent": true
      },
      {
        "id": "t3",
        "atoms": [
          "p",
          "q",
          "r"
        ],
        "columns": [
          "p \\lor q",
          "(p \\lor q) \\rightarrow r",
          "p \\rightarrow q",
          "p \\rightarrow r",
          "(p \\rightarrow q) \\lor (p \\rightarrow r)"
        ],
        "leftLatex": "(p \\lor q) \\rightarrow r",
        "rightLatex": "(p \\rightarrow q) \\lor (p \\rightarrow r)",
        "prompt": "ให้ตรวจสอบว่า $(p \\lor q) \\rightarrow r$ สมมูลกับ $(p \\rightarrow q) \\lor (p \\rightarrow r)$ หรือไม่",
        "equivalent": false
      },
      {
        "id": "t4",
        "atoms": [
          "p",
          "q"
        ],
        "columns": [
          "\\sim p",
          "p \\leftrightarrow q",
          "\\sim(p \\leftrightarrow q)",
          "\\sim p \\leftrightarrow q"
        ],
        "leftLatex": "\\sim(p \\leftrightarrow q)",
        "rightLatex": "\\sim p \\leftrightarrow q",
        "prompt": "ให้ตรวจสอบว่า $\\sim(p \\leftrightarrow q)$ สมมูลกับ $\\sim p \\leftrightarrow q$ หรือไม่",
        "equivalent": true
      },
      {
        "id": "t5",
        "atoms": [
          "p",
          "q"
        ],
        "columns": [
          "p \\rightarrow q",
          "q \\rightarrow p",
          "p \\leftrightarrow q",
          "(p \\rightarrow q) \\land (q \\rightarrow p)"
        ],
        "leftLatex": "p \\leftrightarrow q",
        "rightLatex": "(p \\rightarrow q) \\land (q \\rightarrow p)",
        "prompt": "ให้ตรวจสอบว่า $p \\leftrightarrow q$ สมมูลกับ $(p \\rightarrow q) \\land (q \\rightarrow p)$ หรือไม่",
        "equivalent": true
      }
    ],
    "formQuestions": [
      {
        "id": "f1",
        "prompt": "ให้ตรวจสอบว่า $p \\rightarrow (q \\land r)$ สมมูลกับ $(p \\rightarrow q) \\land (p \\rightarrow r)$ หรือไม่",
        "steps": [
          {
            "expr": "$p \\rightarrow (q \\land r) \\equiv \\sim p \\lor (q \\land r)$",
            "reason": "จาก $p \\rightarrow q \\equiv \\sim p \\lor q$"
          },
          {
            "expr": "$\\equiv (\\sim p \\lor q) \\land (\\sim p \\lor r)$",
            "reason": "จาก $p \\lor (q \\land r) \\equiv (p \\lor q) \\land (p \\lor r)$"
          },
          {
            "expr": "$\\equiv (p \\rightarrow q) \\land (p \\rightarrow r)$",
            "reason": "จาก $p \\rightarrow q \\equiv \\sim p \\lor q$"
          }
        ],
        "conclusion": "ดังนั้น $p \\rightarrow (q \\land r)$ สมมูลกับ $(p \\rightarrow q) \\land (p \\rightarrow r)$"
      },
      {
        "id": "f2",
        "prompt": "ให้ตรวจสอบว่า $\\sim(p \\rightarrow q)$ สมมูลกับ $p \\land \\sim q$ หรือไม่",
        "steps": [
          {
            "expr": "$\\sim(p \\rightarrow q) \\equiv \\sim(\\sim p \\lor q)$",
            "reason": "จาก $p \\rightarrow q \\equiv \\sim p \\lor q$"
          },
          {
            "expr": "$\\equiv \\sim(\\sim p) \\land \\sim q$",
            "reason": "จาก $\\sim(p \\lor q) \\equiv \\sim p \\land \\sim q$"
          },
          {
            "expr": "$\\equiv p \\land \\sim q$",
            "reason": "จาก $p \\equiv \\sim(\\sim p)$"
          }
        ],
        "conclusion": "ดังนั้น $\\sim(p \\rightarrow q)$ สมมูลกับ $p \\land \\sim q$"
      },
      {
        "id": "f3",
        "prompt": "ให้ตรวจสอบว่า $(p \\land q) \\rightarrow r$ สมมูลกับ $p \\rightarrow (q \\rightarrow r)$ หรือไม่",
        "steps": [
          {
            "expr": "$(p \\land q) \\rightarrow r \\equiv \\sim(p \\land q) \\lor r$",
            "reason": "จาก $p \\rightarrow q \\equiv \\sim p \\lor q$"
          },
          {
            "expr": "$\\equiv (\\sim p \\lor \\sim q) \\lor r$",
            "reason": "จาก $\\sim(p \\land q) \\equiv \\sim p \\lor \\sim q$"
          },
          {
            "expr": "$\\equiv \\sim p \\lor (\\sim q \\lor r)$",
            "reason": "จาก $(p \\lor q) \\lor r \\equiv p \\lor (q \\lor r)$"
          },
          {
            "expr": "$\\equiv \\sim p \\lor (q \\rightarrow r)$",
            "reason": "จาก $p \\rightarrow q \\equiv \\sim p \\lor q$"
          },
          {
            "expr": "$\\equiv p \\rightarrow (q \\rightarrow r)$",
            "reason": "จาก $p \\rightarrow q \\equiv \\sim p \\lor q$"
          }
        ],
        "conclusion": "ดังนั้น $(p \\land q) \\rightarrow r$ สมมูลกับ $p \\rightarrow (q \\rightarrow r)$"
      },
      {
        "id": "f4",
        "prompt": "ให้ตรวจสอบว่า $(p \\rightarrow r) \\land (q \\rightarrow r)$ สมมูลกับ $\\sim(p \\lor q) \\lor r$ หรือไม่",
        "steps": [
          {
            "expr": "$(p \\rightarrow r) \\land (q \\rightarrow r) \\equiv (\\sim p \\lor r) \\land (\\sim q \\lor r)$",
            "reason": "จาก $p \\rightarrow q \\equiv \\sim p \\lor q$"
          },
          {
            "expr": "$\\equiv (\\sim p \\land \\sim q) \\lor r$",
            "reason": "จาก $(p \\lor r) \\land (q \\lor r) \\equiv (p \\land q) \\lor r$"
          },
          {
            "expr": "$\\equiv \\sim(p \\lor q) \\lor r$",
            "reason": "จาก $\\sim(p \\lor q) \\equiv \\sim p \\land \\sim q$"
          }
        ],
        "conclusion": "ดังนั้น $(p \\rightarrow r) \\land (q \\rightarrow r)$ สมมูลกับ $\\sim(p \\lor q) \\lor r$"
      },
      {
        "id": "f5",
        "prompt": "ให้ตรวจสอบว่า $(p \\land r) \\rightarrow (q \\lor s)$ สมมูลกับ $\\sim(q \\lor s) \\rightarrow (p \\rightarrow \\sim r)$ หรือไม่",
        "steps": [
          {
            "expr": "$(p \\land r) \\rightarrow (q \\lor s) \\equiv \\sim(q \\lor s) \\rightarrow \\sim(p \\land r)$",
            "reason": "จาก $p \\rightarrow q \\equiv \\sim q \\rightarrow \\sim p$"
          },
          {
            "expr": "$\\equiv \\sim(q \\lor s) \\rightarrow (\\sim p \\lor \\sim r)$",
            "reason": "จาก $\\sim(p \\land q) \\equiv \\sim p \\lor \\sim q$"
          },
          {
            "expr": "$\\equiv \\sim(q \\lor s) \\rightarrow (p \\rightarrow \\sim r)$",
            "reason": "จาก $p \\rightarrow q \\equiv \\sim p \\lor q$"
          }
        ],
        "conclusion": "ดังนั้น $(p \\land r) \\rightarrow (q \\lor s)$ สมมูลกับ $\\sim(q \\lor s) \\rightarrow (p \\rightarrow \\sim r)$"
      }
    ]
  }
};
