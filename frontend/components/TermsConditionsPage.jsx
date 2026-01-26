'use client'

import { FileText, Shield, Users, AlertTriangle, Scale, Globe } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'

const TermsConditionsPage = () => {
    return (
        <div className="max-w-4xl mx-auto px-4 py-8">
            {/* Header */}
            <div className="text-center mb-10">
                <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3">
                    Terms & Conditions
                </h1>
                <p className="text-gray-600">
                    Last updated: January 2026
                </p>
            </div>

            {/* Introduction */}
            <Card className="mb-6 border-l-4 border-l-red-600">
                <CardContent className="p-6">
                    <p className="text-gray-700 leading-relaxed">
                        By accessing StarNews, you agree to the following terms. Please read these terms carefully before using our services.
                    </p>
                </CardContent>
            </Card>

            {/* Content Usage */}
            <section className="mb-8">
                <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-blue-100 rounded-lg">
                        <FileText className="h-5 w-5 text-blue-600" />
                    </div>
                    <h2 className="text-xl font-bold text-gray-900">1. Content Usage</h2>
                </div>
                <Card>
                    <CardContent className="p-6 space-y-4 text-gray-700">
                        <p>
                            All news content published on StarNews is for informational purposes only. Unauthorized reproduction is prohibited.
                        </p>
                        <ul className="list-disc list-inside space-y-2 ml-4">
                            <li>Content may not be reproduced without prior written permission</li>
                            <li>Personal, non-commercial use is permitted with proper attribution</li>
                            <li>Unauthorized commercial use is strictly prohibited</li>
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
                    <h2 className="text-xl font-bold text-gray-900">2. User Responsibility</h2>
                </div>
                <Card>
                    <CardContent className="p-6 text-gray-700">
                        <p>
                            Users are responsible for the accuracy of information submitted through forms, including business and advertisement details. Any false or misleading information may result in removal of the submitted content.
                        </p>
                    </CardContent>
                </Card>
            </section>

            {/* Advertisements & Business Listings */}
            <section className="mb-8">
                <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-yellow-100 rounded-lg">
                        <Globe className="h-5 w-5 text-yellow-600" />
                    </div>
                    <h2 className="text-xl font-bold text-gray-900">3. Advertisements & Business Listings</h2>
                </div>
                <Card>
                    <CardContent className="p-6 space-y-4 text-gray-700">
                        <p>
                            StarNews does not guarantee the accuracy or quality of advertised products or listed businesses. Users interact at their own discretion.
                        </p>
                        <ul className="list-disc list-inside space-y-2 ml-4">
                            <li>We are not responsible for third-party advertisement content</li>
                            <li>Advertisement placement does not constitute endorsement</li>
                            <li>Users should verify business information independently</li>
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
                    <h2 className="text-xl font-bold text-gray-900">4. Editorial Rights</h2>
                </div>
                <Card>
                    <CardContent className="p-6 text-gray-700">
                        <p>
                            StarNews reserves the right to edit, approve, reject, or remove any content without prior notice. This includes news articles, business listings, advertisements, and user-submitted content.
                        </p>
                    </CardContent>
                </Card>
            </section>

            {/* Limitation of Liability */}
            <section className="mb-8">
                <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-red-100 rounded-lg">
                        <AlertTriangle className="h-5 w-5 text-red-600" />
                    </div>
                    <h2 className="text-xl font-bold text-gray-900">5. Limitation of Liability</h2>
                </div>
                <Card className="border-l-4 border-l-yellow-500">
                    <CardContent className="p-6 space-y-4 text-gray-700">
                        <p>
                            StarNews is not liable for any loss or damage arising from the use of information available on this website. The information provided is for general informational purposes only.
                        </p>
                        <p>
                            Any reliance you place on such information is strictly at your own risk.
                        </p>
                    </CardContent>
                </Card>
            </section>

            {/* Changes to Terms */}
            <section className="mb-8">
                <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-orange-100 rounded-lg">
                        <Shield className="h-5 w-5 text-orange-600" />
                    </div>
                    <h2 className="text-xl font-bold text-gray-900">6. Changes to Terms</h2>
                </div>
                <Card>
                    <CardContent className="p-6 text-gray-700">
                        <p>
                            These terms may be updated at any time without notice. We encourage users to review this page periodically for any changes. Continued use of the website after changes constitutes acceptance of the new terms.
                        </p>
                    </CardContent>
                </Card>
            </section>

            {/* Contact */}
            <section>
                <Card className="bg-gray-50">
                    <CardContent className="p-6">
                        <h3 className="font-bold text-gray-900 mb-3">Questions About These Terms?</h3>
                        <p className="text-gray-700 text-sm">
                            If you have any questions about these Terms and Conditions, please contact us at:
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
