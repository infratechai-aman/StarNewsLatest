'use client'

import { Shield, Database, Cookie, Link2, Lock, Mail, Image, Clock, FileText, User } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { useLanguage } from '@/contexts/LanguageContext'

const CONTENT = {
    en: {
        title: 'Privacy Policy Of',
        lastUpdated: 'Last updated: January 2026',
        s1Title: 'What personal data we collect and why we collect',
        s1p1: "When visitors leave comments on the site we collect the data shown in the comments form, and also the visitor's IP address and browser user agent string to help spam detection.",
        s1p2: 'An anonymized string created from your email address (also called a hash) may be provided to the Gravatar service to see if you are using it. After approval of your comment, your profile picture is visible to the public in the context of your comment.',
        s2Title: 'Media',
        s2p1: 'If you upload images to the website, you should avoid uploading images with embedded location data (EXIF GPS) included. Visitors to the website can download and extract any location data from images on the website.',
        s3Title: 'Cookies',
        s3p1: 'If you leave a comment on our site you may opt-in to saving your name, email address and website in cookies. These are for your convenience so that you do not have to fill in your details again when you leave another comment. These cookies will last for one year.',
        s3p2: 'If you have an account and you log in to this site, we will set a temporary cookie to determine if your browser accepts cookies. This cookie contains no personal data and is discarded when you close your browser.',
        s3p3: 'When you log in, we will also set up several cookies to save your login information and your screen display choices. Login cookies last for two days, and screen options cookies last for a year.',
        s4Title: 'Embedded content from other websites',
        s4p1: 'Articles on this site may include embedded content (e.g. videos, images, articles, etc.). Embedded content from other websites behaves in the exact same way as if the visitor has visited the other website.',
        s4p2: 'These websites may collect data about you, use cookies, embed additional third-party tracking, and monitor your interaction with that embedded content.',
        s5Title: 'How long we retain your data',
        s5p1: 'If you leave a comment, the comment and its metadata are retained indefinitely. This is so we can recognize and approve any follow-up comments automatically instead of holding them in a moderation queue.',
        s5p2: 'For users that register on our website (if any), we also store the personal information they provide in their user profile. All users can see, edit, or delete their personal information at any time.',
        s6Title: 'What rights you have over your data',
        s6p1: 'If you have an account on this site, or have left comments, you can request to receive an exported file of the personal data we hold about you. You can also request that we erase any personal data we hold about you.',
        contactTitle: 'Contact Us',
        contactDesc: 'For privacy-related concerns or questions about this policy, please contact Star News through our website or email us at:'
    },
    hi: {
        title: 'गोपनीयता नीति -',
        lastUpdated: 'अंतिम अद्यतन: जनवरी 2026',
        s1Title: 'हम कौन सा व्यक्तिगत डेटा एकत्र करते हैं और क्यों',
        s1p1: 'जब आगंतुक साइट पर टिप्पणियां छोड़ते हैं तो हम टिप्पणी फ़ॉर्म में दिखाए गए डेटा को एकत्र करते हैं, और स्पैम का पता लगाने में मदद करने के लिए आगंतुक का आईपी पता और ब्राउज़र उपयोगकर्ता एजेंट स्ट्रिंग भी एकत्र करते हैं।',
        s1p2: 'आपकी टिप्पणी की स्वीकृति के बाद, आपकी टिप्पणी के संदर्भ में आपकी प्रोफ़ाइल तस्वीर जनता के लिए दृश्यमान होती है।',
        s2Title: 'मीडिया',
        s2p1: 'यदि आप वेबसाइट पर चित्र अपलोड करते हैं, तो आपको एम्बेडेड स्थान डेटा (EXIF GPS) शामिल छवियों को अपलोड करने से बचना चाहिए। वेबसाइट के आगंतुक वेबसाइट पर छवियों से किसी भी स्थान डेटा को डाउनलोड और निकाल सकते हैं।',
        s3Title: 'कुकीज़',
        s3p1: 'यदि आप हमारी साइट पर कोई टिप्पणी छोड़ते हैं तो आप कुकीज़ में अपना नाम, ईमेल पता और वेबसाइट सहेजने का विकल्प चुन सकते हैं। ये आपकी सुविधा के लिए हैं ताकि जब आप कोई अन्य टिप्पणी छोड़ें तो आपको अपना विवरण दोबारा न भरना पड़े।',
        s3p2: 'यदि आपके पास एक खाता है और आप इस साइट पर लॉग इन करते हैं, तो हम यह निर्धारित करने के लिए एक अस्थायी कुकी सेट करेंगे कि आपका ब्राउज़र कुकीज़ स्वीकार करता है या नहीं।',
        s3p3: 'लॉगिन कुकीज़ दो दिनों तक चलती हैं, और स्क्रीन विकल्प कुकीज़ एक वर्ष तक चलती हैं।',
        s4Title: 'अन्य वेबसाइटों से एम्बेडेड सामग्री',
        s4p1: 'इस साइट के लेखों में एम्बेडेड सामग्री (जैसे वीडियो, चित्र, लेख आदि) शामिल हो सकती है। अन्य वेबसाइटों से एम्बेडेड सामग्री ठीक उसी तरह व्यवहार करती है जैसे आगंतुक ने दूसरी वेबसाइट का दौरा किया हो।',
        s4p2: 'ये वेबसाइटें आपके बारे में डेटा एकत्र कर सकती हैं, कुकीज़ का उपयोग कर सकती हैं, और अतिरिक्त तृतीय-पक्ष ट्रैकिंग एम्बेड कर सकती हैं।',
        s5Title: 'हम आपके डेटा को कब तक बनाए रखते हैं',
        s5p1: 'यदि आप कोई टिप्पणी छोड़ते हैं, तो टिप्पणी और उसका मेटाडेटा अनिश्चित काल तक बनाए रखा जाता है। यह इसलिए है ताकि हम किसी भी अनुवर्ती टिप्पणी को स्वचालित रूप से पहचान और स्वीकृत कर सकें।',
        s5p2: 'जो उपयोगकर्ता हमारी वेबसाइट पर पंजीकरण करते हैं, हम उनके उपयोगकर्ता प्रोफ़ाइल में उनके द्वारा प्रदान की गई व्यक्तिगत जानकारी भी संग्रहीत करते हैं।',
        s6Title: 'आपके डेटा पर आपके क्या अधिकार हैं',
        s6p1: 'यदि आपके पास इस साइट पर एक खाता है, या आपने टिप्पणियां छोड़ी हैं, तो आप हमारे पास मौजूद अपने व्यक्तिगत डेटा की निर्यातित फ़ाइल प्राप्त करने का अनुरोध कर सकते हैं या डेटा मिटाने का अनुरोध कर सकते हैं।',
        contactTitle: 'संपर्क करें',
        contactDesc: 'गोपनीयता संबंधी चिंताओं या इस नीति के बारे में प्रश्नों के लिए, कृपया हमारी वेबसाइट के माध्यम से स्टार न्यूज़ से संपर्क करें:'
    },
    mr: {
        title: 'गोपनीयता धोरण -',
        lastUpdated: 'शेवटचे अद्यतन: जानेवारी 2026',
        s1Title: 'आम्ही कोणता वैयक्तिक डेटा गोळा करतो आणि का',
        s1p1: 'जेव्हा वापरकर्ते साइटवर टिप्पण्या देतात तेव्हा आम्ही कमेंट फॉर्ममध्ये दर्शविलेला डेटा, स्पॅम ओळखण्यासाठी आयपी पत्ता आणि ब्राउझर माहिती गोळा करतो.',
        s1p2: 'तुमची टिप्पणी मंजूर झाल्यानंतर, तुमच्या टिप्पणीच्या संदर्भात तुमचे प्रोफाइल चित्र लोकांसमोर दृश्यमान होते.',
        s2Title: 'मीडिया',
        s2p1: 'आपण वेबसाइटवर छायाचित्रे अपलोड केल्यास, एम्बेड केलेले स्थान डेटा (EXIF GPS) असलेल्या प्रतिमा अपलोड करणे टाळावे.',
        s3Title: 'कुकीज',
        s3p1: 'आपण आमच्या साइटवर टिप्पणी दिल्यास आपले नाव आणि ईमेल कुकीजमध्ये जतन करण्याचा पर्याय निवडू शकता. हे आपल्या सोयीसाठी आहे जेणेकरून पुढील वेळी आपल्याला तपशील पुन्हा भरावे लागणार नाहीत.',
        s3p2: 'आपल्याकडे खाते असल्यास आणि आपण या साइटवर लॉग इन केल्यास, आपला ब्राउझर कुकीज स्वीकारतो का हे तपासण्यासाठी आम्ही एक तात्पुरती कुकी सेट करतो.',
        s3p3: 'लॉगिन कुकीज दोन दिवस टिकतात आणि स्क्रीन पर्याय कुकीज एक वर्ष टिकतात.',
        s4Title: 'इतर वेबसाइट्सवरील एम्बेड केलेली सामग्री',
        s4p1: 'या साइटवरील लेखांमध्ये एम्बेड केलेली सामग्री समाविष्ट असू शकते (उदा. व्हिडिओ, प्रतिमा, लेख इ.). इतर वेबसाइट्सवरील एम्बेड केलेली सामग्री अशा प्रकारे वागते जणू काही आपण थेट त्या वेबसाइटला भेट दिली आहे.',
        s4p2: 'या वेबसाइट्स आपल्याबद्दल डेटा गोळा करू शकतात आणि कुकीज वापरू शकतात.',
        s5Title: 'आम्ही आपला डेटा किती काळ ठेवतो',
        s5p1: 'आपण टिप्पणी दिल्यास, ती टिप्पणी आणि मेटाडेटा अनिश्चित काळासाठी राखून ठेवला जातो जेणेकरून पुढील टिप्पण्या आपोआप मंजूर केल्या जाऊ शकतील.',
        s5p2: 'आमच्या वेबसाइटवर नोंदणी करणाऱ्या वापरकर्त्यांची माहिती त्यांच्या प्रोफाइलमध्ये सुरक्षित ठेवली जाते.',
        s6Title: 'आपल्या डेटावर आपले काय अधिकार आहेत',
        s6p1: 'आपले खाते असल्यास किंवा आपण टिप्पण्या दिल्या असल्यास, आपण आपल्या वैयक्तिक डेटाची निर्यात केलेली फाइल मागवू शकता किंवा डेटा हटवण्याची विनंती करू शकता.',
        contactTitle: 'आमच्याशी संपर्क साधा',
        contactDesc: 'गोपनीयतेशी संबंधित समस्या किंवा या धोरणाबद्दल प्रश्नांसाठी, कृपया आमच्या वेबसाइटद्वारे किंवा ईमेलद्वारे संपर्क साधा:'
    }
}

const PrivacyPolicyPage = () => {
    const { language } = useLanguage()
    const c = CONTENT[language] || CONTENT.en

    return (
        <div className="max-w-4xl mx-auto px-4 py-8">
            {/* Header */}
            <div className="text-center mb-10">
                <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3">
                    {c.title} <span className="text-red-600">Star News</span>
                </h1>
                <p className="text-gray-600">
                    {c.lastUpdated}
                </p>
            </div>

            {/* What personal data we collect and why */}
            <section className="mb-8">
                <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-blue-100 rounded-lg">
                        <Database className="h-5 w-5 text-blue-600" />
                    </div>
                    <h2 className="text-xl font-bold text-gray-900">{c.s1Title}</h2>
                </div>
                <Card>
                    <CardContent className="p-6 space-y-4 text-gray-700">
                        <p>{c.s1p1}</p>
                        <p>{c.s1p2}</p>
                    </CardContent>
                </Card>
            </section>

            {/* Media */}
            <section className="mb-8">
                <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-green-100 rounded-lg">
                        <Image className="h-5 w-5 text-green-600" />
                    </div>
                    <h2 className="text-xl font-bold text-gray-900">{c.s2Title}</h2>
                </div>
                <Card>
                    <CardContent className="p-6 text-gray-700">
                        <p>{c.s2p1}</p>
                    </CardContent>
                </Card>
            </section>

            {/* Contact forms Cookies */}
            <section className="mb-8">
                <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-orange-100 rounded-lg">
                        <Cookie className="h-5 w-5 text-orange-600" />
                    </div>
                    <h2 className="text-xl font-bold text-gray-900">{c.s3Title}</h2>
                </div>
                <Card>
                    <CardContent className="p-6 space-y-4 text-gray-700">
                        <p>{c.s3p1}</p>
                        <p>{c.s3p2}</p>
                        <p>{c.s3p3}</p>
                    </CardContent>
                </Card>
            </section>

            {/* Embedded content from other websites */}
            <section className="mb-8">
                <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-purple-100 rounded-lg">
                        <Link2 className="h-5 w-5 text-purple-600" />
                    </div>
                    <h2 className="text-xl font-bold text-gray-900">{c.s4Title}</h2>
                </div>
                <Card>
                    <CardContent className="p-6 space-y-4 text-gray-700">
                        <p>{c.s4p1}</p>
                        <p>{c.s4p2}</p>
                    </CardContent>
                </Card>
            </section>

            {/* How long we retain your data */}
            <section className="mb-8">
                <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-teal-100 rounded-lg">
                        <Clock className="h-5 w-5 text-teal-600" />
                    </div>
                    <h2 className="text-xl font-bold text-gray-900">{c.s5Title}</h2>
                </div>
                <Card>
                    <CardContent className="p-6 space-y-4 text-gray-700">
                        <p>{c.s5p1}</p>
                        <p>{c.s5p2}</p>
                    </CardContent>
                </Card>
            </section>

            {/* What rights you have over your data */}
            <section className="mb-8">
                <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-red-100 rounded-lg">
                        <User className="h-5 w-5 text-red-600" />
                    </div>
                    <h2 className="text-xl font-bold text-gray-900">{c.s6Title}</h2>
                </div>
                <Card className="border-l-4 border-l-red-500">
                    <CardContent className="p-6 text-gray-700">
                        <p>{c.s6p1}</p>
                    </CardContent>
                </Card>
            </section>

            {/* Contact */}
            <section>
                <Card className="bg-gray-50">
                    <CardContent className="p-6">
                        <div className="flex items-center gap-3 mb-3">
                            <Mail className="h-5 w-5 text-red-600" />
                            <h3 className="font-bold text-gray-900">{c.contactTitle}</h3>
                        </div>
                        <p className="text-gray-700 text-sm">
                            {c.contactDesc}
                        </p>
                        <p className="text-red-600 font-medium mt-2">
                            contact@punemajha.in | +91 70208 73300
                        </p>
                    </CardContent>
                </Card>
            </section>
        </div>
    )
}

export default PrivacyPolicyPage
