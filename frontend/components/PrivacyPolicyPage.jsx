'use client'

import { Shield, Database, Cookie, Link2, Lock, Mail, Image, Clock, FileText, User } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'

const PrivacyPolicyPage = () => {
    return (
        <div className="max-w-4xl mx-auto px-4 py-8">
            {/* Header */}
            <div className="text-center mb-10">
                <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3">
                    Privacy Policy Of <span className="text-red-600">Star News</span>
                </h1>
                <p className="text-gray-600">
                    Last updated: January 2026
                </p>
            </div>

            {/* What personal data we collect and why */}
            <section className="mb-8">
                <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-blue-100 rounded-lg">
                        <Database className="h-5 w-5 text-blue-600" />
                    </div>
                    <h2 className="text-xl font-bold text-gray-900">What personal data we collect and why we collect</h2>
                </div>
                <Card>
                    <CardContent className="p-6 space-y-4 text-gray-700">
                        <p>
                            When visitors leave comments on the site we collect the data shown in the comments form, and also the visitor's IP address and browser user agent string to help spam detection.
                        </p>
                        <p>
                            An anodized string created from your email address (also called a hash) may be provided to the Gr-avatar service to see if you are using it. The Gr-avatar service privacy policy is available here: <a href="https://automatic/privacy/" className="text-red-600 hover:underline">https://automatic/privacy/</a>. After approval of your comment, your profile picture is visible to the public in the context of your comment.
                        </p>
                    </CardContent>
                </Card>
            </section>

            {/* Media */}
            <section className="mb-8">
                <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-green-100 rounded-lg">
                        <Image className="h-5 w-5 text-green-600" />
                    </div>
                    <h2 className="text-xl font-bold text-gray-900">Media</h2>
                </div>
                <Card>
                    <CardContent className="p-6 text-gray-700">
                        <p>
                            If you upload images to the website, you should avoid uploading images with embedded location data (EXIT GPS) included. Visitors to the website can download and extract any location data from images on the website.
                        </p>
                    </CardContent>
                </Card>
            </section>

            {/* Contact forms Cookies */}
            <section className="mb-8">
                <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-orange-100 rounded-lg">
                        <Cookie className="h-5 w-5 text-orange-600" />
                    </div>
                    <h2 className="text-xl font-bold text-gray-900">Contact forms Cookies</h2>
                </div>
                <Card>
                    <CardContent className="p-6 space-y-4 text-gray-700">
                        <p>
                            If you leave a comment on our site you may opt-in to saving your name, email address and website in cookies. These are for your convenience so that you do not have to fill in your details again when you leave another comment. These cookies will last for one year.
                        </p>
                        <p>
                            If you have an account and you log in to this site, we will set a temporary cookie to determine if your browser accepts cookies. This cookie contains no personal data and is discarded when you close your browser.
                        </p>
                        <p>
                            When you log in, we will also set up several cookies to save your login information and your screen display choices. Login cookies last for two days, and screen options cookies last for a year.
                        </p>
                        <p>
                            If you select "Remember Me", your login will persist for two weeks. If you log out of your account, the login cookies will be removed.
                        </p>
                        <p>
                            If you edit or publish an article, an additional cookie will be saved in your browser. This cookie includes no personal data and simply indicates the post ID of the article you just edited. It expires after 1 day.
                        </p>
                    </CardContent>
                </Card>
            </section>

            {/* Embedded content from other websites */}
            <section className="mb-8">
                <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-purple-100 rounded-lg">
                        <Link2 className="h-5 w-5 text-purple-600" />
                    </div>
                    <h2 className="text-xl font-bold text-gray-900">Embedded content from other websites</h2>
                </div>
                <Card>
                    <CardContent className="p-6 space-y-4 text-gray-700">
                        <p>
                            Articles on this site may include embedded content (e.g. videos, images, articles, etc.). Embedded content from other websites behaves in the exact same way as if the visitor has visited the other website.
                        </p>
                        <p>
                            These websites may collect data about you, use cookies, embed additional third-party tracking, and monitor your interaction with that embedded content, including tracing your interaction with the embedded content if you have an account and are logged in to that website.
                        </p>
                    </CardContent>
                </Card>
            </section>

            {/* Analytics */}
            <section className="mb-8">
                <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-indigo-100 rounded-lg">
                        <FileText className="h-5 w-5 text-indigo-600" />
                    </div>
                    <h2 className="text-xl font-bold text-gray-900">Analytics</h2>
                </div>
                <Card>
                    <CardContent className="p-6 text-gray-700">
                        <p className="text-gray-500 italic">
                            Who we share your data with
                        </p>
                    </CardContent>
                </Card>
            </section>

            {/* How long we retain your data */}
            <section className="mb-8">
                <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-teal-100 rounded-lg">
                        <Clock className="h-5 w-5 text-teal-600" />
                    </div>
                    <h2 className="text-xl font-bold text-gray-900">How long we retain your data</h2>
                </div>
                <Card>
                    <CardContent className="p-6 space-y-4 text-gray-700">
                        <p>
                            If you leave a comment, the comment and its metadata are retained indefinitely. This is so we can recognize and approve any follow-up comments automatically instead of holding them in a moderation queue.
                        </p>
                        <p>
                            For users that register on our website (if any), we also store the personal information they provide in their user profile. All users can see, edit, or delete their personal information at any time (except they cannot change their username). Website administrators can also see and edit that information.
                        </p>
                    </CardContent>
                </Card>
            </section>

            {/* What rights you have over your data */}
            <section className="mb-8">
                <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-red-100 rounded-lg">
                        <User className="h-5 w-5 text-red-600" />
                    </div>
                    <h2 className="text-xl font-bold text-gray-900">What rights you have over your data</h2>
                </div>
                <Card className="border-l-4 border-l-red-500">
                    <CardContent className="p-6 text-gray-700">
                        <p>
                            If you have an account on this site, or have left comments, you can request to receive an exported file of the personal data we hold about you, including any data you have provided to us. You can also request that we erase any personal data we hold about you. This does not include any data we are obliged to keep for administrative, legal, or security purposes.
                        </p>
                    </CardContent>
                </Card>
            </section>

            {/* Contact */}
            <section>
                <Card className="bg-gray-50">
                    <CardContent className="p-6">
                        <div className="flex items-center gap-3 mb-3">
                            <Mail className="h-5 w-5 text-red-600" />
                            <h3 className="font-bold text-gray-900">Contact Us</h3>
                        </div>
                        <p className="text-gray-700 text-sm">
                            For privacy-related concerns or questions about this policy, please contact Star News through our website or email us at:
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
