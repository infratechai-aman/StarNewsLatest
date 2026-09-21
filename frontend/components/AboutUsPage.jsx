'use client'

import { Building2, Users, Target, Mail, Phone, MapPin, Award, Newspaper, CheckCircle, Briefcase, BookOpen, Heart, FileText, Store, Globe, Smartphone } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { useLanguage } from '@/contexts/LanguageContext'

const AboutUsPage = () => {
    const { language } = useLanguage()

    const coverageAreas = [
        {
            icon: Building2,
            title: language === 'mr' ? 'प्रशासन आणि पायाभूत सुविधा' : language === 'hi' ? 'शासन और बुनियादी ढांचा' : 'Governance & Infrastructure',
            color: 'green'
        },
        {
            icon: BookOpen,
            title: language === 'mr' ? 'शिक्षण आणि आरोग्य' : language === 'hi' ? 'शिक्षा और स्वास्थ्य सेवा' : 'Education & Healthcare',
            color: 'blue'
        },
        {
            icon: Heart,
            title: language === 'mr' ? 'पर्यावरण आणि जनहित' : language === 'hi' ? 'पर्यावरण और जनहित' : 'Environment & Public Interest',
            color: 'red'
        },
        {
            icon: Briefcase,
            title: language === 'mr' ? 'व्यापार आणि तंत्रज्ञान' : language === 'hi' ? 'व्यापार और तकनीक' : 'Business & Technology',
            color: 'purple'
        },
        {
            icon: Award,
            title: language === 'mr' ? 'खेळ आणि मनोरंजन' : language === 'hi' ? 'खेल और मनोरंजन' : 'Sports & Entertainment',
            color: 'orange'
        },
        {
            icon: FileText,
            title: language === 'mr' ? 'गुन्हे आणि स्थानिक बातम्या' : language === 'hi' ? 'अपराध और स्थानीय समाचार' : 'Crime & Local News',
            color: 'pink'
        }
    ]

    return (
        <div className="max-w-6xl mx-auto px-4 py-8">
            {/* Hero Section with Image */}
            <div className="text-center mb-12">
                <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
                    {language === 'mr' ? (
                        <>स्टार न्यूज <span className="text-red-600">बद्दल</span></>
                    ) : language === 'hi' ? (
                        <>स्टार न्यूज़ के <span className="text-red-600">बारे में</span></>
                    ) : (
                        <>About <span className="text-red-600">Star News</span></>
                    )}
                </h1>
                <p className="text-lg text-gray-600 max-w-3xl mx-auto">
                    {language === 'mr'
                        ? 'विश्वसनीय, नैतिक आणि प्रभावी पत्रकारिता'
                        : language === 'hi'
                        ? 'विश्वसनीय, नैतिक और प्रभावशाली पत्रकारिता'
                        : 'Credible, Ethical, and Impactful Journalism'}
                </p>
            </div>

            {/* About Section with Image */}
            <section className="mb-12">
                <Card className="border-l-4 border-l-red-600 overflow-hidden">
                    <CardContent className="p-0">
                        <div className="md:flex">
                            <div className="md:w-1/3">
                                <img
                                    src="https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=600"
                                    alt="Star News Newsroom"
                                    className="w-full h-64 md:h-full object-cover"
                                />
                            </div>
                            <div className="md:w-2/3 p-6 md:p-8">
                                <div className="flex items-start gap-4">
                                    <div className="p-3 bg-red-100 rounded-lg">
                                        <Newspaper className="h-8 w-8 text-red-600" />
                                    </div>
                                    <div>
                                        <h2 className="text-2xl font-bold text-gray-900 mb-4">
                                            {language === 'mr' ? 'आम्ही कोण आहोत' : language === 'hi' ? 'हम कौन हैं' : 'Who We Are'}
                                        </h2>
                                        <p className="text-gray-700 leading-relaxed mb-4">
                                            {language === 'mr'
                                                ? "स्टार न्यूज हे एक आधुनिक डिजिटल मीडिया प्लॅटफॉर्म आहे जे विश्वसनीय, नैतिक आणि प्रभावी पत्रकारितेसाठी वचनबद्ध आहे. स्थानिक पत्रकारिता मजबूत करण्याच्या दृष्टीने स्थापन केलेले हे व्यासपीठ पुण्याच्या सामाजिक, सांस्कृतिक, आर्थिक आणि राजकीय परिस्थितीचे सर्वसमावेशक कव्हरेज प्रदान करते आणि राष्ट्रीय आणि जागतिक स्तरावर मजबूत उपस्थिती राखते."
                                                : language === 'hi'
                                                ? "स्टार न्यूज़ एक आधुनिक डिजिटल मीडिया प्लेटफ़ॉर्म है जो विश्वसनीय, नैतिक और प्रभावशाली पत्रकारिता के लिए प्रतिबद्ध है। स्थानीय पत्रकारिता को सुदृढ़ करने के दृष्टिकोण से स्थापित, यह मंच राष्ट्रीय और वैश्विक समाचारों में मजबूत उपस्थिति बनाए रखते हुए पुणे के सामाजिक, सांस्कृतिक, आर्थिक और राजनीतिक परिदृश्य का व्यापक कवरेज प्रदान करता है।"
                                                : "Star News is a modern digital media platform committed to credible, ethical, and impactful journalism. Established with a vision to strengthen local journalism, the platform delivers comprehensive coverage of Pune's social, cultural, economic, and political landscape while maintaining strong national and global news presence."}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </section>

            {/* Editorial Philosophy */}
            <section className="mb-12">
                <Card className="hover:shadow-lg transition-shadow bg-gradient-to-r from-blue-50 to-white">
                    <CardContent className="p-6">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-2 bg-blue-100 rounded-lg">
                                <Target className="h-6 w-6 text-blue-600" />
                            </div>
                            <h3 className="text-xl font-bold text-gray-900">
                                {language === 'mr' ? 'आमचे संपादकीय तत्त्वज्ञान' : language === 'hi' ? 'हमारा संपादकीय दर्शन' : 'Our Editorial Philosophy'}
                            </h3>
                        </div>
                        <p className="text-gray-700 leading-relaxed">
                            {language === 'mr'
                                ? 'आमचे संपादकीय तत्त्वज्ञान अचूकता, निष्पक्षता आणि वेग यावर आधारित आहे. आम्ही प्रशासन, पायाभूत सुविधा, शिक्षण, आरोग्य सेवा, पर्यावरण, गुन्हेगारी, व्यापार, तंत्रज्ञान, खेळ आणि मनोरंजन यासह अनेक श्रेणींमध्ये वस्तुस्थितीवर आधारित रिपोर्टिंग आणि सखोल विश्लेषणाला प्राधान्य देतो.'
                                : language === 'hi'
                                ? 'हमारा संपादकीय दर्शन सटीकता, तटस्थता और गति पर आधारित है। हम शासन, बुनियादी ढांचे, शिक्षा, स्वास्थ्य सेवा, पर्यावरण, अपराध, व्यापार, प्रौद्योगिकी, खेल और मनोरंजन सहित कई श्रेणियों में तथ्य-आधारित रिपोर्टिंग और गहन विश्लेषण को प्राथमिकता देते हैं।'
                                : 'Our editorial philosophy is built on accuracy, neutrality, and speed. We prioritize fact-based reporting and in-depth analysis across multiple categories including governance, infrastructure, education, healthcare, environment, crime, business, technology, sports, and entertainment.'}
                        </p>
                    </CardContent>
                </Card>
            </section>

            {/* Our Focus Areas */}
            <section className="mb-12">
                <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
                    {language === 'mr' ? 'आमचे कव्हरेज क्षेत्र' : language === 'hi' ? 'हमारे कवरेज क्षेत्र' : 'Our Coverage Areas'}
                </h2>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {coverageAreas.map((item, index) => (
                        <Card key={index} className="hover:shadow-lg transition-shadow">
                            <CardContent className="p-4 flex items-center gap-3">
                                <div className={`p-2 bg-${item.color}-100 rounded-lg`}>
                                    <item.icon className={`h-5 w-5 text-${item.color}-600`} />
                                </div>
                                <span className="font-medium text-gray-900">{item.title}</span>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </section>

            {/* Digital Presence */}
            <section className="mb-12">
                <Card className="bg-gradient-to-r from-purple-50 to-white border-l-4 border-l-purple-600">
                    <CardContent className="p-6 md:p-8">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-2 bg-purple-100 rounded-lg">
                                <Smartphone className="h-6 w-6 text-purple-600" />
                            </div>
                            <h2 className="text-2xl font-bold text-gray-900">
                                {language === 'mr' ? 'मोबाईल-प्रथम दृष्टिकोन' : language === 'hi' ? 'मोबाइल-प्रथम दृष्टिकोण' : 'Mobile-First Approach'}
                            </h2>
                        </div>
                        <p className="text-gray-700 leading-relaxed">
                            {language === 'mr'
                                ? 'मोबाईल-प्रथम दृष्टिकोन आणि आघाडीच्या सोशल मीडिया प्लॅटफॉर्मवर मजबूत उपस्थितीसह, स्टार न्यूज कधीही, कुठेही बातम्यांमध्ये अखंड प्रवेश सुनिश्चित करते. आम्ही संवादात्मक सामग्री, मत स्तंभ, सर्वेक्षण आणि समुदाय-चालित कथांद्वारे आमच्या वाचकांशी जोडले जातो.'
                                : language === 'hi'
                                ? 'मोबाइल-प्रथम दृष्टिकोण और अग्रणी सोशल मीडिया प्लेटफॉर्म पर मजबूत उपस्थिति के साथ, स्टार न्यूज़ कभी भी, कहीं भी समाचारों तक निर्बाध पहुंच सुनिश्चित करता है। हम इंटरैक्टिव सामग्री, राय कॉलम, पोल और समुदाय-संचालित कहानियों के माध्यम से अपने दर्शकों से सक्रिय रूप से जुड़ते हैं।'
                                : 'With a mobile-first approach and a strong presence across leading social media platforms, Star News ensures seamless access to news anytime, anywhere. We actively engage with our audience through interactive content, opinion columns, polls, and community-driven stories.'}
                        </p>
                    </CardContent>
                </Card>
            </section>

            {/* Community & Citizen Journalism */}
            <section className="mb-12">
                <Card className="bg-gradient-to-r from-green-50 to-white border-l-4 border-l-green-600">
                    <CardContent className="p-6 md:p-8">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-2 bg-green-100 rounded-lg">
                                <Users className="h-6 w-6 text-green-600" />
                            </div>
                            <h2 className="text-2xl font-bold text-gray-900">
                                {language === 'mr' ? 'नागरिक पत्रकारांचे सक्षमीकरण' : language === 'hi' ? 'नागरिक पत्रकारों का सशक्तिकरण' : 'Empowering Citizen Journalists'}
                            </h2>
                        </div>
                        <p className="text-gray-700 leading-relaxed">
                            {language === 'mr'
                                ? 'नागरिक पत्रकारांना सक्षम करून आणि आमचे बातमीदार नेटवर्क विस्तारून, आम्ही तळागाळातील आवाज वाढवण्याचा आणि जागतिक प्रेक्षकांपर्यंत अस्सल स्थानिक कथा आणण्याचा प्रयत्न करतो.'
                                : language === 'hi'
                                ? 'नागरिक पत्रकारों को सशक्त बनाकर और अपने संवाददाता नेटवर्क का विस्तार करके, हम जमीनी स्तर की आवाजों को बुलंद करने और वैश्विक दर्शकों तक प्रामाणिक स्थानीय कहानियां लाने का प्रयास करते हैं।'
                                : 'By empowering citizen journalists and expanding our correspondent network, we strive to amplify grassroots voices and bring authentic local stories to a global audience.'}
                        </p>
                    </CardContent>
                </Card>
            </section>

            {/* Our Mission Statement */}
            <section className="mb-12">
                <Card className="bg-gray-50 border-t-4 border-t-red-600">
                    <CardContent className="p-6 md:p-8 text-center">
                        <div className="flex justify-center mb-4">
                            <div className="p-3 bg-red-100 rounded-full">
                                <Globe className="h-8 w-8 text-red-600" />
                            </div>
                        </div>
                        <h2 className="text-2xl font-bold text-gray-900 mb-4">
                            {language === 'mr' ? 'आमची दृष्टी' : language === 'hi' ? 'हमारा दृष्टिकोण' : 'Our Vision'}
                        </h2>
                        <p className="text-xl text-gray-700 leading-relaxed italic">
                            {language === 'mr'
                                ? '"स्टार न्यूज जबाबदार पत्रकारिता, समुदाय सहभाग आणि पुण्याच्या खऱ्या भावनेचे प्रतिनिधित्व करते."'
                                : language === 'hi'
                                ? '"स्टार न्यूज़ जिम्मेदार पत्रकारिता, सामुदायिक जुड़ाव और पुणे की वास्तविक भावना का प्रतीक है।"'
                                : '"Star News stands for responsible journalism, community engagement, and the true spirit of Pune."'}
                        </p>
                    </CardContent>
                </Card>
            </section>

            {/* Contact Information */}
            <section>
                <Card className="border-t-4 border-t-red-600">
                    <CardContent className="p-6 md:p-8">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-2 bg-red-100 rounded-lg">
                                <Building2 className="h-6 w-6 text-red-600" />
                            </div>
                            <h2 className="text-2xl font-bold text-gray-900">
                                {language === 'mr' ? 'संपर्क साधा' : language === 'hi' ? 'संपर्क करें' : 'Contact Us'}
                            </h2>
                        </div>
                        <div className="grid md:grid-cols-3 gap-6">
                            <div className="flex items-start gap-3">
                                <MapPin className="h-5 w-5 text-red-600 mt-1 flex-shrink-0" />
                                <div>
                                    <p className="font-semibold text-gray-900">
                                        {language === 'mr' ? 'मुख्य कार्यालय' : language === 'hi' ? 'प्रधान कार्यालय' : 'Head Office'}
                                    </p>
                                    <p className="text-gray-600 text-sm">
                                        {language === 'mr' ? 'पुणे, महाराष्ट्र, भारत' : language === 'hi' ? 'पुणे, महाराष्ट्र, भारत' : 'Pune, Maharashtra, India'}
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-start gap-3">
                                <Phone className="h-5 w-5 text-red-600 mt-1 flex-shrink-0" />
                                <div>
                                    <p className="font-semibold text-gray-900">
                                        {language === 'mr' ? 'फोन' : language === 'hi' ? 'फ़ोन' : 'Phone'}
                                    </p>
                                    <p className="text-gray-600 text-sm">+91 70208 73300</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-3">
                                <Mail className="h-5 w-5 text-red-600 mt-1 flex-shrink-0" />
                                <div>
                                    <p className="font-semibold text-gray-900">
                                        {language === 'mr' ? 'ईमेल' : language === 'hi' ? 'ईमेल' : 'Email'}
                                    </p>
                                    <p className="text-gray-600 text-sm">contact@starnews.in</p>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </section>
        </div>
    )
}

export default AboutUsPage
