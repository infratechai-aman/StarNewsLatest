// Multilingual News Data with translations for EN, HI, MR
// This file provides news content in all three supported languages

export const newsData = [
    // Main 6 News Boxes - Updated with Latest News
    {
        id: 'news-1',
        slug: 'mumbai-bmc-elections-2026-voter-turnout',
        title: {
            en: 'Mumbai BMC Elections 2026: 41.08% Voter Turnout Recorded Till 3:30 PM',
            hi: 'मुंबई बीएमसी चुनाव 2026: 3:30 बजे तक 41.08% मतदान दर्ज',
            mr: 'मुंबई बीएमसी निवडणूक 2026: 3:30 वाजेपर्यंत 41.08% मतदान'
        },
        category: { en: 'City News', hi: 'शहर समाचार', mr: 'शहर बातम्या' },
        categoryColor: 'red',
        publishedAt: '2026-01-15T15:30:00',
        views: 15678,
        mainImage: 'https://picsum.photos/800/500?random=1001',
        images: ['https://picsum.photos/600/400?random=1001', 'https://picsum.photos/600/400?random=1002'],
        content: {
            en: `<p>Mumbai witnessed a significant voter turnout in the BMC Elections 2026, with 41.08% voters casting their votes till 3:30 PM.</p><p>The State Election Commission reported that voting was smooth across most polling stations.</p>`,
            hi: `<p>बीएमसी चुनाव 2026 में मुंबई में 3:30 बजे तक 41.08% मतदान हुआ।</p><p>राज्य निर्वाचन आयोग ने बताया कि अधिकांश मतदान केंद्रों पर मतदान सुचारू रूप से हुआ।</p>`,
            mr: `<p>बीएमसी निवडणूक 2026 मध्ये मुंबईत 3:30 वाजेपर्यंत 41.08% मतदान झाले.</p><p>राज्य निवडणूक आयोगाने सांगितले की बहुतेक मतदान केंद्रांवर मतदान सुरळीत झाले.</p>`
        },
        tags: ['BMC Elections', 'Mumbai', '2026', 'Voting'],
        author: { name: 'StarNews' }
    },
    {
        id: 'news-2',
        slug: 'india-u19-cricket-world-cup-2026',
        title: {
            en: "Henil Patel's 5-Wicket Haul Helps India Bowl Out USA for 107 in U19 World Cup",
            hi: 'हेनिल पटेल की 5 विकेट से भारत ने यूएसए को 107 पर किया ऑलआउट',
            mr: 'हेनिल पटेलच्या 5 विकेट्समुळे भारताने यूएसएला 107 वर ऑलआउट केले'
        },
        category: { en: 'Sports', hi: 'खेल', mr: 'खेळ' },
        categoryColor: 'green',
        publishedAt: '2026-01-15T14:00:00',
        views: 23456,
        mainImage: 'https://picsum.photos/800/500?random=1011',
        images: ['https://picsum.photos/600/400?random=1011', 'https://picsum.photos/600/400?random=1012'],
        content: {
            en: `<p>India's Henil Patel delivered a stunning bowling performance, taking 5 wickets to bowl out USA for just 107 runs.</p><p>India chased down the target with ease.</p>`,
            hi: `<p>भारत के हेनिल पटेल ने शानदार गेंदबाजी करते हुए 5 विकेट लेकर यूएसए को 107 रन पर ऑलआउट किया।</p><p>भारत ने आसानी से लक्ष्य हासिल किया।</p>`,
            mr: `<p>भारताच्या हेनिल पटेलने 5 विकेट्स घेत यूएसएला 107 धावांवर ऑलआउट केले.</p><p>भारताने सहजपणे लक्ष्य गाठले.</p>`
        },
        tags: ['Cricket', 'U19 World Cup', 'India'],
        author: { name: 'StarNews' }
    },
    {
        id: 'news-3',
        slug: 'uddhav-thackeray-removable-ink-controversy',
        title: {
            en: 'Uddhav Thackeray Raises Alarm Over Removable Ink in Mumbai Civic Polls',
            hi: 'उद्धव ठाकरे ने मुंबई नागरिक चुनाव में हटाने योग्य स्याही पर चिंता जताई',
            mr: 'उद्धव ठाकरेंनी मुंबई महानगरपालिका निवडणुकीत काढता येणाऱ्या शाईबद्दल चिंता व्यक्त केली'
        },
        category: { en: 'Politics', hi: 'राजनीति', mr: 'राजकारण' },
        categoryColor: 'blue',
        publishedAt: '2026-01-15T12:00:00',
        views: 18765,
        mainImage: 'https://picsum.photos/800/500?random=1021',
        images: ['https://picsum.photos/600/400?random=1021', 'https://picsum.photos/600/400?random=1022'],
        content: {
            en: `<p>Shiv Sena (UBT) chief Uddhav Thackeray raised serious concerns over the use of removable ink at polling booths.</p><p>"This is a serious issue," Thackeray stated.</p>`,
            hi: `<p>शिवसेना (यूबीटी) प्रमुख उद्धव ठाकरे ने मतदान केंद्रों पर हटाने योग्य स्याही के उपयोग पर गंभीर चिंता जताई।</p><p>"यह एक गंभीर मुद्दा है," ठाकरे ने कहा।</p>`,
            mr: `<p>शिवसेना (युबीटी) प्रमुख उद्धव ठाकरे यांनी मतदान केंद्रांवर काढता येणाऱ्या शाईच्या वापराबद्दल गंभीर चिंता व्यक्त केली.</p><p>"हा एक गंभीर मुद्दा आहे," ठाकरे म्हणाले.</p>`
        },
        tags: ['Uddhav Thackeray', 'BMC Elections', 'Mumbai'],
        author: { name: 'StarNews' }
    },
    {
        id: 'news-4',
        slug: 'cm-devendra-fadnavis-oil-paint-remark',
        title: {
            en: 'CM Devendra Fadnavis Reacts to Erasable Ink Claims: "Use Oil Paint"',
            hi: 'सीएम देवेंद्र फडणवीस ने मिटने वाली स्याही के दावों पर प्रतिक्रिया दी: "ऑयल पेंट लगाओ"',
            mr: 'मुख्यमंत्री देवेंद्र फडणवीस यांनी शाई मिटत असल्याच्या दाव्यांवर प्रतिक्रिया दिली: "ऑइल पेंट लावा"'
        },
        category: { en: 'Politics', hi: 'राजनीति', mr: 'राजकारण' },
        categoryColor: 'blue',
        publishedAt: '2026-01-15T11:00:00',
        views: 12340,
        mainImage: 'https://picsum.photos/800/500?random=1031',
        images: ['https://picsum.photos/600/400?random=1031'],
        content: {
            en: `<p>Maharashtra CM Devendra Fadnavis responded to allegations of erasable ink with a witty remark.</p><p>"If people are concerned about ink, they can use oil paint," the CM said.</p>`,
            hi: `<p>महाराष्ट्र के मुख्यमंत्री देवेंद्र फडणवीस ने मिटने वाली स्याही के आरोपों पर मजाकिया जवाब दिया।</p><p>"अगर लोग स्याही को लेकर चिंतित हैं, तो ऑयल पेंट लगा सकते हैं," मुख्यमंत्री ने कहा।</p>`,
            mr: `<p>महाराष्ट्राचे मुख्यमंत्री देवेंद्र फडणवीस यांनी शाई मिटत असल्याच्या आरोपांवर विनोदी प्रतिक्रिया दिली.</p><p>"शाईबद्दल चिंता असेल तर ऑइल पेंट लावा," मुख्यमंत्री म्हणाले.</p>`
        },
        tags: ['Devendra Fadnavis', 'Maharashtra', 'Elections'],
        author: { name: 'StarNews' }
    },
    {
        id: 'news-5',
        slug: 'pune-municipal-election-evm-irregularities',
        title: {
            en: 'PMC Election 2026: NCP MLA Rohit Pawar Alleges EVM Irregularities',
            hi: 'पीएमसी चुनाव 2026: एनसीपी विधायक रोहित पवार ने ईवीएम अनियमितताओं का आरोप लगाया',
            mr: 'पीएमसी निवडणूक 2026: राष्ट्रवादी आमदार रोहित पवार यांनी ईव्हीएम अनियमिततेचा आरोप केला'
        },
        category: { en: 'City News', hi: 'शहर समाचार', mr: 'शहर बातम्या' },
        categoryColor: 'red',
        publishedAt: '2026-01-15T10:00:00',
        views: 8901,
        mainImage: 'https://picsum.photos/800/500?random=1041',
        images: ['https://picsum.photos/600/400?random=1041', 'https://picsum.photos/600/400?random=1042'],
        content: {
            en: `<p>NCP MLA Rohit Pawar alleged irregularities in poll booth placement and EVM functioning during PMC elections.</p><p>The State Election Commission assured investigation.</p>`,
            hi: `<p>एनसीपी विधायक रोहित पवार ने पीएमसी चुनाव के दौरान मतदान केंद्र और ईवीएम में अनियमितताओं का आरोप लगाया।</p><p>राज्य निर्वाचन आयोग ने जांच का आश्वासन दिया।</p>`,
            mr: `<p>राष्ट्रवादी आमदार रोहित पवार यांनी पीएमसी निवडणुकीत मतदान केंद्र आणि ईव्हीएममध्ये अनियमिततेचा आरोप केला.</p><p>राज्य निवडणूक आयोगाने चौकशीचे आश्वासन दिले.</p>`
        },
        tags: ['Pune', 'PMC Elections', 'EVM'],
        author: { name: 'StarNews' }
    },
    {
        id: 'news-6',
        slug: 'nikhil-kamath-stock-market-shutdown',
        title: {
            en: 'Nikhil Kamath Slams Stock Market Shutdown for Mumbai Civic Polls',
            hi: 'निखिल कामथ ने मुंबई नागरिक चुनाव के लिए शेयर बाजार बंद करने की आलोचना की',
            mr: 'निखिल कामथ यांनी मुंबई महानगरपालिका निवडणुकीसाठी शेअर बाजार बंद केल्याबद्दल टीका केली'
        },
        category: { en: 'Business', hi: 'व्यापार', mr: 'व्यापार' },
        categoryColor: 'orange',
        publishedAt: '2026-01-15T09:00:00',
        views: 6789,
        mainImage: 'https://picsum.photos/800/500?random=1051',
        images: ['https://picsum.photos/600/400?random=1051'],
        content: {
            en: `<p>Zerodha co-founder Nikhil Kamath criticized the decision to shut down stock markets for municipal elections.</p><p>"This shows poor planning," Kamath posted.</p>`,
            hi: `<p>ज़ेरोधा के सह-संस्थापक निखिल कामथ ने नगरपालिका चुनावों के लिए शेयर बाजार बंद करने के फैसले की आलोचना की।</p><p>"यह खराब योजना दर्शाता है," कामथ ने लिखा।</p>`,
            mr: `<p>झिरोधाचे सह-संस्थापक निखिल कामथ यांनी महानगरपालिका निवडणुकीसाठी शेअर बाजार बंद करण्याच्या निर्णयावर टीका केली.</p><p>"हे खराब नियोजन दर्शवते," कामथ यांनी लिहिले.</p>`
        },
        tags: ['Nikhil Kamath', 'Stock Market', 'Mumbai'],
        author: { name: 'StarNews' }
    },
    // Trending Section
    {
        id: 'news-7',
        slug: 'nia-isis-arrest',
        title: {
            en: 'NIA Arrests 7 ISIS Suspects, Major Revelations Expected',
            hi: 'एनआईए ने 7 आईएसआईएस संदिग्धों को गिरफ्तार किया, बड़े खुलासे की संभावना',
            mr: 'एनआयएने 7 आयसिस संशयितांना अटक केली, मोठे खुलासे अपेक्षित'
        },
        category: { en: 'Nation', hi: 'देश', mr: 'देश' },
        categoryColor: 'red',
        publishedAt: '2026-01-15T12:00:00',
        views: 15678,
        mainImage: 'https://picsum.photos/800/500?random=201',
        images: ['https://picsum.photos/600/400?random=201'],
        content: {
            en: `<p>The National Investigation Agency (NIA) arrested 7 ISIS suspects. Major weapons seized during the operation.</p>`,
            hi: `<p>राष्ट्रीय जांच एजेंसी (NIA) ने 7 ISIS संदिग्धों को गिरफ्तार किया। ऑपरेशन के दौरान बड़ी मात्रा में हथियार जब्त।</p>`,
            mr: `<p>राष्ट्रीय तपास संस्थेने (NIA) 7 ISIS संशयितांना अटक केली. कारवाईत मोठ्या प्रमाणात शस्त्रे जप्त.</p>`
        },
        tags: ['NIA', 'ISIS', 'Security'],
        author: { name: 'StarNews' }
    },
    {
        id: 'news-8',
        slug: 'ai-technology-revolution',
        title: {
            en: 'AI Technology Revolution: Millions of Jobs at Risk',
            hi: 'एआई तकनीकी क्रांति: लाखों नौकरियां खतरे में',
            mr: 'एआय तंत्रज्ञान क्रांती: लाखो नोकऱ्या धोक्यात'
        },
        category: { en: 'Technology', hi: 'तकनीक', mr: 'तंत्रज्ञान' },
        categoryColor: 'blue',
        publishedAt: '2026-01-15T10:00:00',
        views: 18765,
        mainImage: 'https://picsum.photos/800/500?random=203',
        images: ['https://picsum.photos/600/400?random=203'],
        content: {
            en: `<p>AI technology is rapidly expanding, causing major changes across industries.</p><p>Experts predict millions of jobs will be affected in the next 5 years.</p>`,
            hi: `<p>एआई तकनीक तेजी से विस्तार कर रही है, जिससे उद्योगों में बड़े बदलाव हो रहे हैं।</p><p>विशेषज्ञों का अनुमान है कि अगले 5 वर्षों में लाखों नौकरियां प्रभावित होंगी।</p>`,
            mr: `<p>एआय तंत्रज्ञान वेगाने विस्तारत आहे, ज्यामुळे उद्योगांमध्ये मोठे बदल होत आहेत.</p><p>तज्ञांच्या मते पुढच्या 5 वर्षांत लाखो नोकऱ्यांवर परिणाम होईल.</p>`
        },
        tags: ['AI', 'Technology', 'Jobs'],
        author: { name: 'StarNews' }
    },
    {
        id: 'news-9',
        slug: 'sensex-record-high',
        title: {
            en: 'Stock Market Boom: Sensex Crosses 76,000 Mark',
            hi: 'शेयर बाजार में तेजी: सेंसेक्स 76,000 के पार',
            mr: 'शेअर बाजारात तेजी: सेन्सेक्स 76,000 पार'
        },
        category: { en: 'Business', hi: 'व्यापार', mr: 'व्यापार' },
        categoryColor: 'green',
        publishedAt: '2026-01-15T15:00:00',
        views: 11234,
        mainImage: 'https://picsum.photos/800/500?random=301',
        images: ['https://picsum.photos/600/400?random=301'],
        content: {
            en: `<p>Stock market witnessed major bullish trend with Sensex crossing the historic 76,000 mark.</p><p>Banking and IT sectors showed significant gains.</p>`,
            hi: `<p>शेयर बाजार में बड़ी तेजी आई, सेंसेक्स ने ऐतिहासिक 76,000 का आंकड़ा पार किया।</p><p>बैंकिंग और आईटी सेक्टर में बड़ी बढ़त दर्ज।</p>`,
            mr: `<p>शेअर बाजारात मोठी तेजी आली, सेन्सेक्सने ऐतिहासिक 76,000 चा टप्पा पार केला.</p><p>बँकिंग आणि आयटी क्षेत्रात मोठी वाढ नोंदवली.</p>`
        },
        tags: ['Sensex', 'Stock Market', 'Investment'],
        author: { name: 'StarNews' }
    },
    {
        id: 'news-10',
        slug: 'ipl-2025-mega-auction',
        title: {
            en: 'IPL 2025 Mega Auction: New Records Set',
            hi: 'आईपीएल 2025 मेगा नीलामी: नए रिकॉर्ड बने',
            mr: 'आयपीएल 2025 मेगा लिलाव: नवीन विक्रम'
        },
        category: { en: 'Sports', hi: 'खेल', mr: 'खेळ' },
        categoryColor: 'purple',
        publishedAt: '2026-01-15T16:00:00',
        views: 25678,
        mainImage: 'https://picsum.photos/800/500?random=401',
        images: ['https://picsum.photos/600/400?random=401'],
        content: {
            en: `<p>IPL 2025 mega auction set new records with a player fetching highest-ever 25 crore bid.</p><p>All 10 teams made aggressive purchases.</p>`,
            hi: `<p>आईपीएल 2025 मेगा नीलामी में नए रिकॉर्ड बने, एक खिलाड़ी को 25 करोड़ की सबसे बड़ी बोली मिली।</p><p>सभी 10 टीमों ने आक्रामक खरीदारी की।</p>`,
            mr: `<p>आयपीएल 2025 मेगा लिलावात नवीन विक्रम झाले, एका खेळाडूला 25 कोटींची सर्वाधिक बोली मिळाली.</p><p>सर्व 10 संघांनी आक्रमक खरेदी केली.</p>`
        },
        tags: ['IPL', 'Cricket', 'Auction'],
        author: { name: 'StarNews' }
    },
    {
        id: 'news-11',
        slug: 'bollywood-new-movie',
        title: {
            en: 'Bollywood: New Movie Creates Box Office Storm',
            hi: 'बॉलीवुड: नई फिल्म ने बॉक्स ऑफिस पर धूम मचाई',
            mr: 'बॉलिवूड: नवीन चित्रपटाने बॉक्स ऑफिसवर धमाल केली'
        },
        category: { en: 'Entertainment', hi: 'मनोरंजन', mr: 'मनोरंजन' },
        categoryColor: 'pink',
        publishedAt: '2026-01-15T18:00:00',
        views: 18765,
        mainImage: 'https://picsum.photos/800/500?random=601',
        images: ['https://picsum.photos/600/400?random=601'],
        content: {
            en: `<p>New Bollywood movie created a storm at the box office with 200 crore collection in the first week.</p>`,
            hi: `<p>नई बॉलीवुड फिल्म ने पहले हफ्ते में 200 करोड़ की कमाई के साथ बॉक्स ऑफिस पर धूम मचा दी।</p>`,
            mr: `<p>नवीन बॉलिवूड चित्रपटाने पहिल्या आठवड्यात 200 कोटींच्या कमाईसह बॉक्स ऑफिसवर धमाल केली.</p>`
        },
        tags: ['Bollywood', 'Movies', 'Box Office'],
        author: { name: 'StarNews' }
    },
    {
        id: 'news-12',
        slug: 'parliament-winter-session',
        title: {
            en: 'Parliament Winter Session: Important Bills to be Tabled',
            hi: 'संसद का शीतकालीन सत्र: महत्वपूर्ण विधेयक पेश होंगे',
            mr: 'संसदेचे हिवाळी अधिवेशन: महत्त्वाची विधेयके मांडली जाणार'
        },
        category: { en: 'Nation', hi: 'देश', mr: 'देश' },
        categoryColor: 'indigo',
        publishedAt: '2026-01-15T17:00:00',
        views: 9876,
        mainImage: 'https://picsum.photos/800/500?random=501',
        images: ['https://picsum.photos/600/400?random=501'],
        content: {
            en: `<p>Parliament winter session will see several important bills including Women's Reservation Bill and One Nation One Election.</p>`,
            hi: `<p>संसद के शीतकालीन सत्र में महिला आरक्षण विधेयक और एक देश एक चुनाव सहित कई महत्वपूर्ण विधेयक पेश होंगे।</p>`,
            mr: `<p>संसदेच्या हिवाळी अधिवेशनात महिला आरक्षण विधेयक आणि एक देश एक निवडणूक यासह अनेक महत्त्वाची विधेयके मांडली जाणार आहेत.</p>`
        },
        tags: ['Parliament', 'Bills', 'Politics'],
        author: { name: 'StarNews' }
    }
];

// Breaking news headlines - Multilingual
export const breakingHeadlines = {
    en: [
        'BMC Elections 2026: Voting underway across Mumbai • ',
        'India U19 dominates USA in World Cup opener • ',
        'Stock Market: Sensex at all-time high • ',
        'Weather Update: Cold wave continues in Maharashtra • ',
    ],
    hi: [
        'बीएमसी चुनाव 2026: मुंबई भर में मतदान जारी • ',
        'भारत अंडर-19 ने विश्व कप के पहले मैच में यूएसए को हराया • ',
        'शेयर बाजार: सेंसेक्स सर्वकालिक उच्च स्तर पर • ',
        'मौसम अपडेट: महाराष्ट्र में शीत लहर जारी • ',
    ],
    mr: [
        'बीएमसी निवडणूक 2026: मुंबईभर मतदान सुरू • ',
        'भारत अंडर-19 ने विश्वचषक सामन्यात यूएसएला पराभूत केले • ',
        'शेअर बाजार: सेन्सेक्स सर्वकालीन उच्चांकावर • ',
        'हवामान अपडेट: महाराष्ट्रात थंडीची लाट सुरू • ',
    ]
};

// Helper function to get localized text from multilingual object
export const getLocalizedText = (obj, lang = 'en') => {
    if (typeof obj === 'string') return obj;
    if (typeof obj === 'object' && obj !== null) {
        return obj[lang] || obj.en || obj.mr || obj.hi || '';
    }
    return '';
};

// Helper functions for data access
export const getNewsById = (id) => newsData.find(news => news.id === id);
export const getNewsBySlug = (slug) => newsData.find(news => news.slug === slug);
export const getMainNewsBoxes = () => newsData.slice(0, 6);
export const getTrendingNews = () => newsData.slice(6, 12);
export const getBusinessNews = () => newsData.filter(n => getLocalizedText(n.category, 'en') === 'Business').slice(0, 3);
export const getSportsNews = () => newsData.filter(n => getLocalizedText(n.category, 'en') === 'Sports').slice(0, 3);
export const getNationNews = () => newsData.filter(n => getLocalizedText(n.category, 'en') === 'Nation').slice(0, 3);
export const getEntertainmentNews = () => newsData.filter(n => getLocalizedText(n.category, 'en') === 'Entertainment').slice(0, 3);
