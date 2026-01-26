'use client'

import { Building2, Users, Target, Mail, Phone, MapPin, Award, Newspaper, CheckCircle, Briefcase, BookOpen, Heart, FileText, Store, Globe, Smartphone } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'

const AboutUsPage = () => {
    return (
        <div className="max-w-6xl mx-auto px-4 py-8">
            {/* Hero Section with Image */}
            <div className="text-center mb-12">
                <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
                    About <span className="text-red-600">Star News</span>
                </h1>
                <p className="text-lg text-gray-600 max-w-3xl mx-auto">
                    Credible, Ethical, and Impactful Journalism
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
                                        <h2 className="text-2xl font-bold text-gray-900 mb-4">Who We Are</h2>
                                        <p className="text-gray-700 leading-relaxed mb-4">
                                            Star News is a modern digital media platform committed to credible, ethical, and impactful journalism. Established with a vision to strengthen local journalism, the platform delivers comprehensive coverage of Pune's social, cultural, economic, and political landscape while maintaining strong national and global news presence.
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
                            <h3 className="text-xl font-bold text-gray-900">Our Editorial Philosophy</h3>
                        </div>
                        <p className="text-gray-700 leading-relaxed">
                            Our editorial philosophy is built on accuracy, neutrality, and speed. We prioritize fact-based reporting and in-depth analysis across multiple categories including governance, infrastructure, education, healthcare, environment, crime, business, technology, sports, and entertainment.
                        </p>
                    </CardContent>
                </Card>
            </section>

            {/* Our Focus Areas */}
            <section className="mb-12">
                <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">Our Coverage Areas</h2>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {[
                        { icon: Building2, title: 'Governance & Infrastructure', color: 'green' },
                        { icon: BookOpen, title: 'Education & Healthcare', color: 'blue' },
                        { icon: Heart, title: 'Environment & Public Interest', color: 'red' },
                        { icon: Briefcase, title: 'Business & Technology', color: 'purple' },
                        { icon: Award, title: 'Sports & Entertainment', color: 'orange' },
                        { icon: FileText, title: 'Crime & Local News', color: 'pink' }
                    ].map((item, index) => (
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
                            <h2 className="text-2xl font-bold text-gray-900">Mobile-First Approach</h2>
                        </div>
                        <p className="text-gray-700 leading-relaxed">
                            With a mobile-first approach and a strong presence across leading social media platforms, Star News ensures seamless access to news anytime, anywhere. We actively engage with our audience through interactive content, opinion columns, polls, and community-driven stories.
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
                            <h2 className="text-2xl font-bold text-gray-900">Empowering Citizen Journalists</h2>
                        </div>
                        <p className="text-gray-700 leading-relaxed">
                            By empowering citizen journalists and expanding our correspondent network, we strive to amplify grassroots voices and bring authentic local stories to a global audience.
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
                        <h2 className="text-2xl font-bold text-gray-900 mb-4">Our Vision</h2>
                        <p className="text-xl text-gray-700 leading-relaxed italic">
                            "Star News stands for responsible journalism, community engagement, and the true spirit of Pune."
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
                            <h2 className="text-2xl font-bold text-gray-900">Contact Us</h2>
                        </div>
                        <div className="grid md:grid-cols-3 gap-6">
                            <div className="flex items-start gap-3">
                                <MapPin className="h-5 w-5 text-red-600 mt-1 flex-shrink-0" />
                                <div>
                                    <p className="font-semibold text-gray-900">Head Office</p>
                                    <p className="text-gray-600 text-sm">Pune, Maharashtra, India</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-3">
                                <Phone className="h-5 w-5 text-red-600 mt-1 flex-shrink-0" />
                                <div>
                                    <p className="font-semibold text-gray-900">Phone</p>
                                    <p className="text-gray-600 text-sm">+91 70208 73300</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-3">
                                <Mail className="h-5 w-5 text-red-600 mt-1 flex-shrink-0" />
                                <div>
                                    <p className="font-semibold text-gray-900">Email</p>
                                    <p className="text-gray-600 text-sm">contact@punemajha.in</p>
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
