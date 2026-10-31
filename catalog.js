/**
 * สารบัญหนังสือเรียนรายวิชาเพิ่มเติมคณิตศาสตร์ สสวท.
 * ตามหลักสูตรแกนกลางฯ (ฉบับปรับปรุง พ.ศ. 2560)
 *
 * เพิ่มชิ้นงานใหม่: ใส่ object ใน units[].items ของหน่วยที่ต้องการ
 * { id, title, href }
 */
window.BOOK_CATALOG = [
  {
    id: "m4-b1",
    label: "ม.4 เล่ม 1",
    grade: "ม.4",
    book: 1,
    units: [
      {
        id: "set",
        label: "เซต",
        items: [
          {
            id: "001",
            title: "สับเซตและพาวเวอร์เซต",
            href: "M4/1.set/001-subset and powerset/index.html"
          },
          {
            id: "002",
            title: "สมบัติของสับเซตและพาวเวอร์เซต",
            href: "M4/1.set/002-subset and powerset properties/index.html"
          },
          {
            id: "003",
            title: "การดำเนินการของเซต",
            href: "M4/1.set/003-set operation/index.html"
          },
          {
            id: "004",
            title: "แผนภาพเวนน์ (Venn diagram)",
            href: "M4/1.set/004-venn diagram/index.html"
          },
          {
            id: "005",
            title: "พื้นที่แรเงาบนแผนภาพเวนน์",
            href: "M4/1.set/005-shade area/index.html"
          },
          {
            id: "006",
            title: "สมบัติของการดำเนินการของเซต",
            href: "M4/1.set/006-operation properties/index.html"
          },
          {
            id: "007",
            title: "จำนวนสมาชิกของเซตจำกัด",
            href: "M4/1.set/007-set apply/index.html"
          }
        ]
      },
      {
        id: "logic",
        label: "ตรรกศาสตร์",
        items: [
          {
            id: "008",
            title: "การเชื่อมประพจน์",
            href: "M4/2.logic/008-logic connective/index.html"
          },
          {
            id: "009",
            title: "ตารางค่าความจริง",
            href: "M4/2.logic/009-truth table/index.html"
          },
          {
            id: "010",
            title: "รูปแบบประพจน์ที่สมมูลกัน",
            href: "M4/2.logic/010-Equivalence/index.html"
          },
          {
            id: "011",
            title: "สัจนิรันดร์",
            href: "M4/2.logic/011-tautology/index.html"
          },
          {
            id: "012",
            title: "การอ้างเหตุผล",
            href: "M4/2.logic/012-validity/index.html"
          },
          {
            id: "013",
            title: "ค่าความจริงของประโยคที่มีตัวบ่งปริมาณตัวเดียว",
            href: "M4/2.logic/013-quantifier/index.html"
          }
        ]
      },
      {
        id: "real-numbers",
        label: "จำนวนจริง",
        items: [
          {
            id: "014",
            title: "จำนวนจริง",
            href: "M4/3.real number/014-real number/index.html"
          },
          {
            id: "015",
            title: "สมบัติของจำนวนจริง",
            href: "M4/3.real number/015-properties of real numbers/index.html"
          },
          {
            id: "016",
            title: "พหุนาม",
            href: "M4/3.real number/016-polynomials/index.html"
          },
          {
            id: "017",
            title: "การหารพหุนาม",
            href: "M4/3.real number/017-polynomial division/index.html"
          },
          {
            id: "018",
            title: "ทฤษฎีบทที่เกี่ยวกับการแยกตัวประกอบพหุนาม",
            href: "M4/3.real number/018-polynomial factorization theorems/index.html"
          },
          {
            id: "019",
            title: "การแยกตัวประกอบพหุนาม",
            href: "M4/3.real number/019-polynomial factorization/index.html"
          },
          {
            id: "020",
            title: "การแก้สมการพหุนามตัวแปรเดียว",
            href: "M4/3.real number/020-solving polynomial equations/index.html"
          },
          {
            id: "021",
            title: "แบบจำลองการแยกตัวประกอบด้วยทฤษฎีบท",
            href: "M4/3.real number/021-factorization theorem model/index.html"
          }
        ]
      }
    ]
  },
  {
    id: "m4-b2",
    label: "ม.4 เล่ม 2",
    grade: "ม.4",
    book: 2,
    units: [
      { id: "relation-function", label: "ความสัมพันธ์และฟังก์ชัน", items: [] },
      { id: "exp-log", label: "ฟังก์ชันเอกซ์โพเนนเชียลและฟังก์ชันลอการิทึม", items: [] },
      { id: "analytic-geometry", label: "เรขาคณิตวิเคราะห์", items: [] }
    ]
  },
  {
    id: "m5-b1",
    label: "ม.5 เล่ม 1",
    grade: "ม.5",
    book: 1,
    units: [
      { id: "trig", label: "ฟังก์ชันตรีโกณมิติ", items: [] },
      { id: "matrix", label: "เมทริกซ์", items: [] },
      { id: "vector", label: "เวกเตอร์", items: [] }
    ]
  },
  {
    id: "m5-b2",
    label: "ม.5 เล่ม 2",
    grade: "ม.5",
    book: 2,
    units: [
      { id: "complex", label: "จำนวนเชิงซ้อน", items: [] },
      { id: "counting", label: "หลักการนับเบื้องต้น", items: [] },
      { id: "probability", label: "ความน่าจะเป็น", items: [] }
    ]
  },
  {
    id: "m6-b1",
    label: "ม.6 เล่ม 1",
    grade: "ม.6",
    book: 1,
    units: [
      { id: "sequence-series", label: "ลำดับและอนุกรม", items: [] },
      { id: "calculus", label: "แคลคูลัสเบื้องต้น", items: [] }
    ]
  },
  {
    id: "m6-b2",
    label: "ม.6 เล่ม 2",
    grade: "ม.6",
    book: 2,
    units: [
      { id: "stats-intro", label: "ความหมายของสถิติศาสตร์และข้อมูล", items: [] },
      { id: "qualitative", label: "การวิเคราะห์และนำเสนอข้อมูลเชิงคุณภาพ", items: [] },
      { id: "quantitative", label: "การวิเคราะห์และนำเสนอข้อมูลเชิงปริมาณ", items: [] },
      { id: "random-var", label: "ตัวแปรสุ่มและการแจกแจงความน่าจะเป็น", items: [] }
    ]
  }
];
