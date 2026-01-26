'use client'

import { useLanguage } from '@/contexts/LanguageContext'

const Footer = ({ setCurrentView }) => {
  const { t } = useLanguage()

  return (
    <footer className="bg-gray-900 text-gray-300 mt-12">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <h3 className="font-bold text-xl text-white mb-4">StarNews</h3>
            <p className="text-sm mb-4">
              {t('language') === 'भाषा' ? 'भारत भर से ब्रेकिंग न्यूज़, स्थानीय अपडेट और व्यापार समाचार का आपका विश्वसनीय स्रोत।' :
                t('language') === 'भाषा' ? 'भारतभरातील ब्रेकिंग न्यूज, स्थानिक अपडेट्स आणि व्यावसायिक बातम्यांचा तुमचा विश्वासू स्त्रोत.' :
                  'Your trusted source for breaking news, local updates, and business stories from across India.'}
            </p>
            <div className="flex gap-3">
              <a href="https://www.facebook.com/share/1Fd1BR94tW/" target="_blank" rel="noopener noreferrer" className="w-8 h-8 bg-gray-800 rounded-full flex items-center justify-center hover:bg-blue-600 transition-colors">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" /></svg>
              </a>
              <a href="https://wa.me/917020873300" target="_blank" rel="noopener noreferrer" className="w-8 h-8 bg-gray-800 rounded-full flex items-center justify-center hover:bg-green-500 transition-colors">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" /></svg>
              </a>
              <a href="https://www.instagram.com/star_news__india?igsh=YWE2Z2FkeGV6cXA3" target="_blank" rel="noopener noreferrer" className="w-8 h-8 bg-gray-800 rounded-full flex items-center justify-center hover:bg-pink-600 transition-colors">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 0C8.74 0 8.333.015 7.053.072 5.775.132 4.905.333 4.14.63c-.789.306-1.459.717-2.126 1.384S.935 3.35.63 4.14C.333 4.905.131 5.775.072 7.053.012 8.333 0 8.74 0 12s.015 3.667.072 4.947c.06 1.277.261 2.148.558 2.913.306.788.717 1.459 1.384 2.126.667.666 1.336 1.079 2.126 1.384.766.296 1.636.499 2.913.558C8.333 23.988 8.74 24 12 24s3.667-.015 4.947-.072c1.277-.06 2.148-.262 2.913-.558.788-.306 1.459-.718 2.126-1.384.666-.667 1.079-1.335 1.384-2.126.296-.765.499-1.636.558-2.913.06-1.28.072-1.687.072-4.947s-.015-3.667-.072-4.947c-.06-1.277-.262-2.149-.558-2.913-.306-.789-.718-1.459-1.384-2.126C21.319 1.347 20.651.935 19.86.63c-.765-.297-1.636-.499-2.913-.558C15.667.012 15.26 0 12 0zm0 2.16c3.203 0 3.585.016 4.85.071 1.17.055 1.805.249 2.227.415.562.217.96.477 1.382.896.419.42.679.819.896 1.381.164.422.36 1.057.413 2.227.057 1.266.07 1.646.07 4.85s-.015 3.585-.074 4.85c-.061 1.17-.256 1.805-.421 2.227-.224.562-.479.96-.899 1.382-.419.419-.824.679-1.38.896-.42.164-1.065.36-2.235.413-1.274.057-1.649.07-4.859.07-3.211 0-3.586-.015-4.859-.074-1.171-.061-1.816-.256-2.236-.421-.569-.224-.96-.479-1.379-.899-.421-.419-.69-.824-.9-1.38-.165-.42-.359-1.065-.42-2.235-.045-1.26-.061-1.649-.061-4.844 0-3.196.016-3.586.061-4.861.061-1.17.255-1.814.42-2.234.21-.57.479-.96.9-1.381.419-.419.81-.689 1.379-.898.42-.166 1.051-.361 2.221-.421 1.275-.045 1.65-.06 4.859-.06l.045.03zm0 3.678c-3.405 0-6.162 2.76-6.162 6.162 0 3.405 2.76 6.162 6.162 6.162 3.405 0 6.162-2.76 6.162-6.162 0-3.405-2.76-6.162-6.162-6.162zM12 16c-2.21 0-4-1.79-4-4s1.79-4 4-4 4 1.79 4 4-1.79 4-4 4zm7.846-10.405c0 .795-.646 1.44-1.44 1.44-.795 0-1.44-.646-1.44-1.44 0-.794.646-1.439 1.44-1.439.793-.001 1.44.645 1.44 1.439z" /></svg>
              </a>
              <a href="https://youtube.com/@starnewsindialive?si=RT7VECpD5H4HiyP2" target="_blank" rel="noopener noreferrer" className="w-8 h-8 bg-gray-800 rounded-full flex items-center justify-center hover:bg-red-600 transition-colors">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" /></svg>
              </a>
            </div>
          </div>

          <div>
            <h4 className="font-semibold text-white mb-4">{t('quickLinks')}</h4>
            <ul className="space-y-2 text-sm">
              <li><button onClick={() => setCurrentView('home')} className="hover:text-white transition-colors">{t('home')}</button></li>
              <li><button onClick={() => setCurrentView('news')} className="hover:text-white transition-colors">{t('cityNews')}</button></li>
              <li><button onClick={() => setCurrentView('about')} className="hover:text-white transition-colors">{t('aboutUs')}</button></li>
              <li><button className="hover:text-white transition-colors">{t('politics')}</button></li>
              <li><button className="hover:text-white transition-colors">{t('sports')}</button></li>
              <li><button className="hover:text-white transition-colors">{t('entertainment')}</button></li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-white mb-4">{t('categories')}</h4>
            <ul className="space-y-2 text-sm">
              <li><button className="hover:text-white transition-colors">{t('crime')}</button></li>
              <li><button className="hover:text-white transition-colors">{t('education')}</button></li>
              <li><button onClick={() => setCurrentView('classifieds')} className="hover:text-white transition-colors">{t('jobs')}</button></li>
              <li><button className="hover:text-white transition-colors">{t('trending')}</button></li>
              <li><button className="hover:text-white transition-colors">{t('specialReports')}</button></li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-white mb-4">{t('contactUs')}</h4>
            <ul className="space-y-2 text-sm">
              <li className="flex items-start gap-2">
                <span>📍</span>
                <span>123 MG Road, Pune, Maharashtra 411001</span>
              </li>
              <li className="flex items-center gap-2">
                <span>📞</span>
                <span>+91 70208 73300</span>
              </li>
              <li className="flex items-center gap-2">
                <span>✉️</span>
                <span>contact@starnews.in</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-8 pt-8 text-center text-sm">
          <p>© 2025 StarNews. {t('allRightsReserved')}.</p>
          <div className="mt-3 flex items-center justify-center gap-4 text-xs">
            <button onClick={() => setCurrentView('terms')} className="text-gray-400 hover:text-white transition-colors">
              {t('termsConditions')}
            </button>
            <span className="text-gray-600">|</span>
            <button onClick={() => setCurrentView('privacy')} className="text-gray-400 hover:text-white transition-colors">
              {t('privacyPolicy')}
            </button>
            <span className="text-gray-600">|</span>
            <button onClick={() => setCurrentView('about')} className="text-gray-400 hover:text-white transition-colors">
              {t('aboutUs')}
            </button>
          </div>
          <p className="mt-2 flex items-center justify-center gap-1 text-xs text-gray-500">
            Made by InfraTech.AI
          </p>
        </div>
      </div>
    </footer>
  )
}

export default Footer

