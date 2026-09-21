'use client'

import { FileText, Shield, Users, AlertTriangle, Scale, Globe } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { useLanguage } from '@/contexts/LanguageContext'

const CONTENT = {
    en: {
        title: 'Terms & Conditions',
        lastUpdated: 'Last updated: January 2026',
        intro: 'By accessing StarNews, you agree to the following terms. Please read these terms carefully before using our services.',
        s1Title: '1. Content Usage',
        s1Desc: 'All news content published on StarNews is for informational purposes only. Unauthorized reproduction is prohibited.',
        s1Points: [
            'Content may not be reproduced without prior written permission',
            'Personal, non-commercial use is permitted with proper attribution',
            'Unauthorized commercial use is strictly prohibited'
        ],
        s2Title: '2. User Responsibility',
        s2Desc: 'Users are responsible for the accuracy of information submitted through forms, including business and advertisement details. Any false or misleading information may result in removal of the submitted content.',
        s3Title: '3. Advertisements & Business Listings',
        s3Desc: 'StarNews does not guarantee the accuracy or quality of advertised products or listed businesses. Users interact at their own discretion.',
        s3Points: [
            'We are not responsible for third-party advertisement content',
            'Advertisement placement does not constitute endorsement',
            'Users should verify business information independently'
        ],
        s4Title: '4. Editorial Rights',
        s4Desc: 'StarNews reserves the right to edit, approve, reject, or remove any content without prior notice. This includes news articles, business listings, advertisements, and user-submitted content.',
        s5Title: '5. Limitation of Liability',
        s5Desc1: 'StarNews is not liable for any loss or damage arising from the use of information available on this website. The information provided is for general informational purposes only.',
        s5Desc2: 'Any reliance you place on such information is strictly at your own risk.',
        s6Title: '6. Changes to Terms',
        s6Desc: 'These terms may be updated at any time without notice. We encourage users to review this page periodically for any changes. Continued use of the website after changes constitutes acceptance of the new terms.',
        contactTitle: 'Questions About These Terms?',
        contactDesc: 'If you have any questions about these Terms and Conditions, please contact us at:'
    },
    hi: {
        title: 'नियम एवं शर्तें',
        lastUpdated: 'अंतिम अद्यतन: जनवरी 2026',
        intro: 'StarNews का उपयोग करके, आप निम्नलिखित शर्तों से सहमत होते हैं। कृपया हमारी सेवाओं का उपयोग करने से पहले इन शर्तों को ध्यान से पढ़ें।',
        s1Title: '1. सामग्री का उपयोग',
        s1Desc: 'StarNews पर प्रकाशित सभी समाचार सामग्री केवल सूचनात्मक उद्देश्यों के लिए है। अनधिकृत पुनरुत्पादन प्रतिबंधित है।',
        s1Points: [
            'पूर्व लिखित अनुमति के बिना सामग्री को पुनरुत्पादित नहीं किया जा सकता',
            'उचित श्रेय के साथ व्यक्तिगत, गैर-व्यावसायिक उपयोग की अनुमति है',
            'अनधिकृत व्यावसायिक उपयोग सख्त वर्जित है'
        ],
        s2Title: '2. उपयोगकर्ता की जिम्मेदारी',
        s2Desc: 'उपयोगकर्ता फॉर्म के माध्यम से सबमिट की गई जानकारी की सटीकता के लिए जिम्मेदार हैं, जिसमें व्यापार और विज्ञापन विवरण शामिल हैं। किसी भी गलत या भ्रामक जानकारी के परिणामस्वरूप सबमिट की गई सामग्री को हटाया जा सकता है।',
        s3Title: '3. विज्ञापन और व्यापार लिस्टिंग',
        s3Desc: 'StarNews विज्ञापित उत्पादों या सूचीबद्ध व्यवसायों की सटीकता या गुणवत्ता की गारंटी नहीं देता है। उपयोगकर्ता अपने विवेक पर बातचीत करते हैं।',
        s3Points: [
            'हम तीसरे पक्ष की विज्ञापन सामग्री के लिए ज़िम्मेदार नहीं हैं',
            'विज्ञापन स्थान समर्थन का गठन नहीं करता है',
            'उपयोगकर्ताओं को व्यावसायिक जानकारी स्वतंत्र रूप से सत्यापित करनी चाहिए'
        ],
        s4Title: '4. संपादकीय अधिकार',
        s4Desc: 'StarNews बिना किसी पूर्व सूचना के किसी भी सामग्री को संपादित, स्वीकृत, अस्वीकार या हटाने का अधिकार सुरक्षित रखता है। इसमें समाचार लेख, व्यापार लिस्टिंग, विज्ञापन और उपयोगकर्ता द्वारा सबमिट की गई सामग्री शामिल है।',
        s5Title: '5. दायित्व की सीमा',
        s5Desc1: 'StarNews इस वेबसाइट पर उपलब्ध जानकारी के उपयोग से होने वाले किसी भी नुकसान या क्षति के लिए उत्तरदायी नहीं है। प्रदान की गई जानकारी केवल सामान्य सूचनात्मक उद्देश्यों के लिए है।',
        s5Desc2: 'ऐसी जानकारी पर आपके द्वारा किया गया कोई भी भरोसा पूरी तरह से आपके अपने जोखिम पर है।',
        s6Title: '6. शर्तों में परिवर्तन',
        s6Desc: 'इन शर्तों को बिना किसी सूचना के किसी भी समय अपडेट किया जा सकता है। हम उपयोगकर्ताओं को किसी भी बदलाव के लिए समय-समय पर इस पृष्ठ की समीक्षा करने के लिए प्रोत्साहित करते हैं।',
        contactTitle: 'इन शर्तों के बारे में कोई प्रश्न?',
        contactDesc: 'यदि आपके पास इन नियमों और शर्तों के बारे में कोई प्रश्न हैं, तो कृपया हमसे संपर्क करें:'
    },
    mr: {
        title: 'नियम आणि अटी',
        lastUpdated: 'शेवटचे अद्यतन: जानेवारी 2026',
        intro: 'StarNews मध्ये प्रवेश करून, आपण खालील अटींशी सहमत आहात. कृपया आमच्या सेवा वापरण्यापूर्वी या अटी काळजीपूर्वक वाचा.',
        s1Title: '1. मजकुराचा वापर',
        s1Desc: 'StarNews वर प्रकाशित सर्व बातम्या केवळ माहितीच्या उद्देशाने आहेत. अनधिकृत पुनर्निर्मितीस सक्त मनाई आहे.',
        s1Points: [
            'पूर्व लेखी परवानगीशिवाय मजकूर पुनर्निर्मित केला जाऊ शकत नाही',
            'योग्य श्रेय देऊन वैयक्तिक, गैर-व्यावसायिक वापरास अनुमती आहे',
            'अनधिकृत व्यावसायिक वापर सक्त वर्ज्य आहे'
        ],
        s2Title: '2. वापरकर्त्याची जबाबदारी',
        s2Desc: 'व्यवसाय आणि जाहिरात तपशीलांसह फॉर्मद्वारे सबमिट केलेल्या माहितीच्या अचूकतेसाठी वापरकर्ते जबाबदार आहेत. कोणत्याही खोट्या किंवा दिशाभूल करणाऱ्या माहितीमुळे सामग्री काढली जाऊ शकते.',
        s3Title: '3. जाहिराती आणि व्यवसाय यादी',
        s3Desc: 'StarNews जाहिरात केलेल्या उत्पादनांची किंवा सूचीबद्ध व्यवसायांची अचूकता किंवा गुणवत्तेची हमी देत नाही. वापरकर्ते स्वतःच्या विवेकबुद्धीने व्यवहार करतात.',
        s3Points: [
            'आम्ही तृतीय-पक्ष जाहिरात सामग्रीसाठी जबाबदार नाही',
            'जाहिरात स्थान देणे म्हणजे समर्थन नाही',
            'वापरकर्त्यांनी व्यवसाय माहिती स्वतंत्रपणे तपासावी'
        ],
        s4Title: '4. संपादकीय हक्क',
        s4Desc: 'कोणत्याही पूर्वसूचनेशिवाय कोणतीही सामग्री संपादित करण्याचा, मंजूर करण्याचा, नाकारण्याचा किंवा काढून टाकण्याचा अधिकार StarNews राखून ठेवते.',
        s5Title: '5. दायित्वाची मर्यादा',
        s5Desc1: 'या संकेतस्थळावरील माहितीच्या वापरामुळे होणाऱ्या कोणत्याही नुकसानीस StarNews जबाबदार राहणार नाही. प्रदान केलेली माहिती केवळ सामान्य माहितीच्या उद्देशाने आहे.',
        s5Desc2: 'अशा माहितीवर ठेवलेला कोणताही विश्वास पूर्णपणे आपल्या स्वतःच्या जोखमीवर असेल.',
        s6Title: '6. अटींमधील बदल',
        s6Desc: 'या अटी कोणत्याही वेळी सूचनेशिवाय अद्यतनित केल्या जाऊ शकतात. आम्ही वापरकर्त्यांना वेळोवेळी या पृष्ठाचे पुनरावलोकन करण्याचे आवाहन करतो.',
        contactTitle: 'या अटींबद्दल काही प्रश्न आहेत का?',
        contactDesc: 'आपल्याकडे या नियम आणि अटींबद्दल काही प्रश्न असल्यास, कृपया आमच्याशी संपर्क साधा:'
    }
}

const TermsConditionsPage = () => {
    const { language } = useLanguage()
    const c = CONTENT[language] || CONTENT.en

    return (
        <div className="max-w-4xl mx-auto px-4 py-8">
            {/* Header */}
            <div className="text-center mb-10">
                <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3">
                    {c.title}
                </h1>
                <p className="text-gray-600">
                    {c.lastUpdated}
                </p>
            </div>

            {/* Introduction */}
            <Card className="mb-6 border-l-4 border-l-red-600">
                <CardContent className="p-6">
                    <p className="text-gray-700 leading-relaxed">
                        {c.intro}
                    </p>
                </CardContent>
            </Card>

            {/* Content Usage */}
            <section className="mb-8">
                <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-blue-100 rounded-lg">
                        <FileText className="h-5 w-5 text-blue-600" />
                    </div>
                    <h2 className="text-xl font-bold text-gray-900">{c.s1Title}</h2>
                </div>
                <Card>
                    <CardContent className="p-6 space-y-4 text-gray-700">
                        <p>{c.s1Desc}</p>
                        <ul className="list-disc list-inside space-y-2 ml-4">
                            {c.s1Points.map((p, i) => <li key={i}>{p}</li>)}
                        </ul>
                    </CardContent>
                </Card>
            </section>

            {/* User Responsibility */}
            <section className="mb-8">
                <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-purple-100 rounded-lg">
                        <Users className="h-5 w-5 text-purple-600" />
                    </div>
                    <h2 className="text-xl font-bold text-gray-900">{c.s2Title}</h2>
                </div>
                <Card>
                    <CardContent className="p-6 text-gray-700">
                        <p>{c.s2Desc}</p>
                    </CardContent>
                </Card>
            </section>

            {/* Advertisements & Business Listings */}
            <section className="mb-8">
                <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-yellow-100 rounded-lg">
                        <Globe className="h-5 w-5 text-yellow-600" />
                    </div>
                    <h2 className="text-xl font-bold text-gray-900">{c.s3Title}</h2>
                </div>
                <Card>
                    <CardContent className="p-6 space-y-4 text-gray-700">
                        <p>{c.s3Desc}</p>
                        <ul className="list-disc list-inside space-y-2 ml-4">
                            {c.s3Points.map((p, i) => <li key={i}>{p}</li>)}
                        </ul>
                    </CardContent>
                </Card>
            </section>

            {/* Editorial Rights */}
            <section className="mb-8">
                <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-green-100 rounded-lg">
                        <Scale className="h-5 w-5 text-green-600" />
                    </div>
                    <h2 className="text-xl font-bold text-gray-900">{c.s4Title}</h2>
                </div>
                <Card>
                    <CardContent className="p-6 text-gray-700">
                        <p>{c.s4Desc}</p>
                    </CardContent>
                </Card>
            </section>

            {/* Limitation of Liability */}
            <section className="mb-8">
                <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-red-100 rounded-lg">
                        <AlertTriangle className="h-5 w-5 text-red-600" />
                    </div>
                    <h2 className="text-xl font-bold text-gray-900">{c.s5Title}</h2>
                </div>
                <Card className="border-l-4 border-l-yellow-500">
                    <CardContent className="p-6 space-y-4 text-gray-700">
                        <p>{c.s5Desc1}</p>
                        <p>{c.s5Desc2}</p>
                    </CardContent>
                </Card>
            </section>

            {/* Changes to Terms */}
            <section className="mb-8">
                <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-orange-100 rounded-lg">
                        <Shield className="h-5 w-5 text-orange-600" />
                    </div>
                    <h2 className="text-xl font-bold text-gray-900">{c.s6Title}</h2>
                </div>
                <Card>
                    <CardContent className="p-6 text-gray-700">
                        <p>{c.s6Desc}</p>
                    </CardContent>
                </Card>
            </section>

            {/* Contact */}
            <section>
                <Card className="bg-gray-50">
                    <CardContent className="p-6">
                        <h3 className="font-bold text-gray-900 mb-3">{c.contactTitle}</h3>
                        <p className="text-gray-700 text-sm">
                            {c.contactDesc}
                        </p>
                        <p className="text-red-600 font-medium mt-2">
                            legal@starnews.in | +91 70208 73300
                        </p>
                    </CardContent>
                </Card>
            </section>
        </div>
    )
}

export default TermsConditionsPage
