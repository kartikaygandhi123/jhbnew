export type Article = {
  id: string;
  kicker: string;
  title: string;
  summary: string;
  category: string;
  categorySlug: string;
  place: string;
  time: string;
  image?: string;
  tone?: "saffron" | "green" | "plain";
};

import market from "@/assets/news-market.jpg";
import metro from "@/assets/news-metro.jpg";
import monsoon from "@/assets/news-monsoon.jpg";
import parliament from "@/assets/news-parliament.jpg";

export const articleImageMap: Record<string, string> = {
  a1: parliament,
  a2: metro,
  a3: monsoon,
  b1: market,
  b2: parliament,
  b3: metro,
  c1: monsoon,
  c2: market,
  c3: parliament,
  c4: metro,
  c5: market,
  d1: market,
  d2: parliament,
  d3: monsoon,
  d4: metro,
  d5: market,
  d6: parliament,
  e1: monsoon,
  e2: parliament,
  e3: market,
  e4: metro,
  e5: monsoon,
};

export function getArticleContent(article: Article): string[] {
  if (article.summary) {
    return [
      `${article.place}, संवाददाता। ${article.summary}`,
      "विस्तृत जानकारी के अनुसार, इस घटनाक्रम से जुड़े तमाम पहलुओं पर चर्चा जारी है। प्रशासनिक सूत्रों का कहना है कि अगले कुछ दिनों में और अपडेट सामने आएंगे।",
      "विपक्ष ने इस मामले पर सरकार से स्पष्टीकरण मांगा है, जबकि समर्थकों का कहना है कि यह कदम दीर्घकालिक फायदे देगा। सोशल मीडिया पर भी इस पर मिश्रित प्रतिक्रियाएं देखने को मिल रही हैं।",
      "हम इस मामले की गहन निगरानी कर रहे हैं। जैसे ही कोई नई जानकारी आएगी, हमारे पाठक सबसे पहले जान पाएंगे।",
    ];
  }
  return [
    `${article.place}, संवाददाता। ${article.title}`,
    "इस खबर पर विस्तृत रिपोर्ट जल्द ही अपडेट की जाएगी।",
  ];
}

export const categories = [
  { slug: "desh", label: "देश" },
  { slug: "rajya", label: "शहर और राज्य" },
  { slug: "duniya", label: "दुनिया" },
  { slug: "karobar", label: "कारोबार" },
  { slug: "khel", label: "खेल" },
  { slug: "manoranjan", label: "मनोरंजन" },
];

export const trendingTags = [
  "सावन 2026",
  "विधानसभा सत्र",
  "मौसम अपडेट",
  "सक्षम भारत",
  "छात्रवृत्ति",
];

export const leadStory = {
  kicker: "आज के अहम घटनाक्रम",
  title: "'अब विकास की राजनीति चलेगी', संसद में गूंजा नया कानून; विपक्ष का वॉकआउट",
};

export const bigNews: Article[] = [
  {
    id: "a1",
    kicker: "संसद सत्र",
    title: "नए श्रम कानून पर घमासान: सरकार ने गिनाए फायदे, विपक्ष ने बताया जल्दबाजी",
    summary: "लोकसभा में छह घंटे चली बहस के बाद विधेयक पारित; राज्यसभा में कल पेश होगा।",
    category: "देश",
    categorySlug: "desh",
    place: "नई दिल्ली",
    time: "12 मिनट पहले",
    tone: "saffron",
  },
  {
    id: "a2",
    kicker: "दिल्ली एनसीआर",
    title: "मेट्रो फेज-5 को मंजूरी: 42 किलोमीटर नई लाइन, 31 स्टेशन और तीन इंटरचेंज",
    summary: "2029 तक पूरा होने का लक्ष्य, रोजाना नौ लाख यात्रियों को मिलेगी राहत।",
    category: "शहर और राज्य",
    categorySlug: "rajya",
    place: "नोएडा",
    time: "28 मिनट पहले",
    tone: "green",
  },
  {
    id: "a3",
    kicker: "मौसम",
    title: "पहाड़ों पर भारी बारिश का अलर्ट: चार जिलों में स्कूल बंद, यात्रा से पहले जांच लें रास्ता",
    summary: "मौसम विभाग ने अगले 48 घंटे के लिए ऑरेंज अलर्ट जारी किया है।",
    category: "देश",
    categorySlug: "desh",
    place: "देहरादून",
    time: "45 मिनट पहले",
    tone: "plain",
  },
];

export const deshNews: Article[] = [
  {
    id: "b1",
    kicker: "कानपुर",
    title: "किसानों को सीधा फायदा: मंडी शुल्क घटा, ई-नीलामी से मिलेगा बेहतर दाम",
    summary: "प्रदेश की 118 मंडियों में नया सिस्टम इस महीने से लागू।",
    category: "देश",
    categorySlug: "desh",
    place: "कानपुर",
    time: "1 घंटा पहले",
    tone: "saffron",
  },
  {
    id: "b2",
    kicker: "कारोबार",
    title: "सेंसेक्स 640 अंक चढ़ा: आईटी और बैंकिंग शेयरों में जोरदार खरीदारी",
    summary: "रुपया 12 पैसे मजबूत, विदेशी निवेशकों की वापसी से बाजार में जोश।",
    category: "कारोबार",
    categorySlug: "karobar",
    place: "मुंबई",
    time: "1 घंटा पहले",
    tone: "green",
  },
  {
    id: "b3",
    kicker: "क्रिकेट",
    title: "एशिया कप 2026: भारत का पूरा शेड्यूल जारी, पहला मुकाबला 12 सितंबर को",
    summary: "टीम इंडिया के तीन बड़े मुकाबले, टिकट बिक्री कल से शुरू।",
    category: "खेल",
    categorySlug: "khel",
    place: "कोलंबो",
    time: "2 घंटे पहले",
    tone: "plain",
  },
];

export const latestNews: Article[] = [
  {
    id: "c1",
    kicker: "पूर्णिमा 2026",
    title: "श्रावण पूर्णिमा व्रत: जानें स्नान और दान का सही समय",
    summary: "",
    category: "धर्म",
    categorySlug: "desh",
    place: "धर्म",
    time: "19 सेकंड पहले",
  },
  {
    id: "c2",
    kicker: "",
    title: "35 साल बाद विश्वविद्यालय में नया कुलपति, जानिए कौन दौड़ में सबसे आगे",
    summary: "",
    category: "शिक्षा",
    categorySlug: "rajya",
    place: "पटना",
    time: "1 मिनट पहले",
  },
  {
    id: "c3",
    kicker: "पश्चिम बंगाल",
    title: "छात्र संगठनों में झड़प, कैंपस में तनाव; पुलिस तैनात",
    summary: "",
    category: "शहर और राज्य",
    categorySlug: "rajya",
    place: "कोलकाता",
    time: "4 मिनट पहले",
  },
  {
    id: "c4",
    kicker: "हेल्थ अलर्ट",
    title: "बीपी की दवाएं किडनी के लिए न बढ़ा दें मुश्किल? ये बातें जरूर जान लें",
    summary: "",
    category: "सेहत",
    categorySlug: "desh",
    place: "हेल्थ",
    time: "5 मिनट पहले",
  },
  {
    id: "c5",
    kicker: "लाइव ब्रेकिंग",
    title: "पढ़ें 20 अगस्त के मुख्य और ताजा समाचार — लाइव अपडेट",
    summary: "",
    category: "देश",
    categorySlug: "desh",
    place: "नई दिल्ली",
    time: "14 मिनट पहले",
  },
];

export const feedNews: Article[] = [
  {
    id: "d1",
    kicker: "चीनी के दाम",
    title: "चाय की चुस्की हुई महंगी: 19 मिलों ने बढ़ाए दाम, 61 रुपये किलो पहुंची चीनी",
    summary:
      "कुछ व्यापारियों का मानना है कि आने वाले दिनों में चीनी की कीमत 80 रुपये प्रति किलो तक पहुंच सकती है। रोजाना बढ़ रहे दाम से बाजारों में दुकानदार-ग्राहक के बीच बहस भी शुरू हो गई है।",
    category: "कारोबार",
    categorySlug: "karobar",
    place: "अलीगढ़",
    time: "20 अगस्त 2026",
  },
  {
    id: "d2",
    kicker: "अंतरराष्ट्रीय",
    title: "सीमा वार्ता का नया दौर: दोनों देशों ने तनाव घटाने पर जताई सहमति",
    summary: "साझा बयान में कहा गया कि अगली बैठक अक्तूबर में होगी।",
    category: "दुनिया",
    categorySlug: "duniya",
    place: "जिनेवा",
    time: "20 अगस्त 2026",
  },
  {
    id: "d3",
    kicker: "स्कूल सुरक्षा",
    title: "स्कूल परिसर सुरक्षा पर सख्ती: सीसीटीवी और वेरिफिकेशन अनिवार्य",
    summary: "आदेश न मानने वाले संस्थानों की मान्यता पर होगा फैसला।",
    category: "देश",
    categorySlug: "desh",
    place: "लखनऊ",
    time: "20 अगस्त 2026",
  },
  {
    id: "d4",
    kicker: "बैडमिंटन",
    title: "वर्ल्ड चैंपियनशिप: भारतीय जोड़ी क्वार्टर फाइनल में, कल कड़ी चुनौती",
    summary: "सीधे गेमों में जीत के साथ अंतिम आठ में जगह पक्की।",
    category: "खेल",
    categorySlug: "khel",
    place: "पेरिस",
    time: "20 अगस्त 2026",
  },
  {
    id: "d5",
    kicker: "मनोरंजन",
    title: "बॉक्स ऑफिस पर नई फिल्म का दमदार आगाज, पहले दिन 34 करोड़",
    summary: "समीक्षकों ने कहानी और संगीत की तारीफ की।",
    category: "मनोरंजन",
    categorySlug: "manoranjan",
    place: "मुंबई",
    time: "20 अगस्त 2026",
  },
  {
    id: "d6",
    kicker: "तकनीक",
    title: "देश में बनेगी सेमीकंडक्टर यूनिट, 12 हजार नौकरियों का दावा",
    summary: "पहला उत्पादन 2028 की पहली तिमाही से शुरू होगा।",
    category: "कारोबार",
    categorySlug: "karobar",
    place: "अहमदाबाद",
    time: "20 अगस्त 2026",
  },
];

export const trendingNews: Article[] = [
  {
    id: "e1",
    kicker: "आज का राशिफल",
    title: "20 अगस्त: मेष और सिंह राशि वालों की बढ़ेगी तरक्की, मिलेंगे नए अवसर",
    summary: "",
    category: "भविष्यफल",
    categorySlug: "desh",
    place: "ज्योतिष",
    time: "20 अगस्त 2026",
  },
  {
    id: "e2",
    kicker: "एक्सप्लेनर",
    title: "कौन तय करता है पेट्रोल की कीमत? समझें पूरा गणित आसान भाषा में",
    summary: "",
    category: "एक्सप्लेनर",
    categorySlug: "karobar",
    place: "नई दिल्ली",
    time: "20 अगस्त 2026",
  },
  {
    id: "e3",
    kicker: "जांच",
    title: "सरकारी धन के दुरुपयोग पर शिकंजा, तीन ट्रस्टों के दस्तावेज खंगाले",
    summary: "",
    category: "देश",
    categorySlug: "desh",
    place: "लखनऊ",
    time: "20 अगस्त 2026",
  },
  {
    id: "e4",
    kicker: "वर्ल्ड",
    title: "प्रवासी नियमों में बदलाव की मांग, संसदीय समिति ने सौंपी रिपोर्ट",
    summary: "",
    category: "दुनिया",
    categorySlug: "duniya",
    place: "वाशिंगटन",
    time: "20 अगस्त 2026",
  },
  {
    id: "e5",
    kicker: "सितंबर राशिफल",
    title: "इन राशियों के लिए सितंबर लाएगा खुशखबरी, शुरू होंगे अच्छे दिन",
    summary: "",
    category: "भविष्यफल",
    categorySlug: "desh",
    place: "ज्योतिष",
    time: "20 अगस्त 2026",
  },
];

export type Video = {
  id: string;
  youtubeId: string;
  title: string;
  duration: string;
  category: string;
  time: string;
};

export const videos: Video[] = [
  {
    id: "v1",
    youtubeId: "0e3GPea1Tyg",
    title: "संसद में नया श्रम कानून: क्या बदलेगा आपकी नौकरी में? पूरी बहस",
    duration: "8:42",
    category: "देश",
    time: "20 अगस्त 2026",
  },
  {
    id: "v2",
    youtubeId: "hHW1oY26kxQ",
    title: "मेट्रो फेज-5 का रूट मैप: आपके इलाके से कहां गुजरेगी नई लाइन",
    duration: "5:12",
    category: "शहर और राज्य",
    time: "20 अगस्त 2026",
  },
  {
    id: "v3",
    youtubeId: "9bZkp7q19f0",
    title: "चीनी 61 रुपये किलो: बाजार से ग्राउंड रिपोर्ट",
    duration: "4:03",
    category: "कारोबार",
    time: "19 अगस्त 2026",
  },
  {
    id: "v4",
    youtubeId: "ScMzIvxBSi4",
    title: "एशिया कप शेड्यूल जारी: भारत के बड़े मुकाबले कब-कब",
    duration: "6:27",
    category: "खेल",
    time: "19 अगस्त 2026",
  },
  {
    id: "v5",
    youtubeId: "kJQP7kiw5Fk",
    title: "पहाड़ों में भारी बारिश: यात्रा पर निकलने से पहले देखें ये रिपोर्ट",
    duration: "3:48",
    category: "मौसम",
    time: "19 अगस्त 2026",
  },
  {
    id: "v6",
    youtubeId: "JGwWNGJdvx8",
    title: "एक्सप्लेनर: सेमीकंडक्टर यूनिट से देश को क्या मिलेगा",
    duration: "7:15",
    category: "कारोबार",
    time: "18 अगस्त 2026",
  },
];

export type Edition = {
  id: string;
  city: string;
  date: string;
  pages: number;
};

export const editions: Edition[] = [
  { id: "delhi", city: "नई दिल्ली", date: "20 अगस्त 2026", pages: 16 },
  { id: "lucknow", city: "लखनऊ", date: "20 अगस्त 2026", pages: 14 },
  { id: "patna", city: "पटना", date: "20 अगस्त 2026", pages: 12 },
  { id: "jaipur", city: "जयपुर", date: "20 अगस्त 2026", pages: 14 },
  { id: "bhopal", city: "भोपाल", date: "20 अगस्त 2026", pages: 12 },
  { id: "dehradun", city: "देहरादून", date: "20 अगस्त 2026", pages: 10 },
];
