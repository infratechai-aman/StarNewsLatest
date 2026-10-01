import { getDb } from '@/lib/firebaseAdmin';
import { NextResponse } from 'next/server';
import { getCache, setCache } from '@/lib/cache';

export const dynamic = 'force-dynamic';

export const DEFAULT_CHANNELS = [
  // 1. News Channels
  {
    id: 'starnews-live',
    title: 'StarNews India 24/7 Live Broadcast',
    channelName: 'StarNews India',
    category: 'news',
    url: 'https://www.youtube.com/watch?v=GFjuqQmfVIU',
    isLive: true,
    isActive: true,
    viewers: '24.5K',
    description: 'Ground reports, verified bulletins, and breaking political updates from Maharashtra.'
  },
  {
    id: 'abp-majha',
    title: 'ABP Majha Live 24/7 • महाराष्ट्राचा नंबर १ न्यूज चॅनेल',
    channelName: 'ABP Majha',
    category: 'news',
    url: 'https://www.youtube.com/watch?v=g6KqO7aMwtQ',
    isLive: true,
    isActive: true,
    viewers: '45.2K',
    description: 'ABP Majha live streaming Marathi news, politics, and ground reports.'
  },
  {
    id: 'tv9-marathi',
    title: 'TV9 Marathi Live • बातमी महाराष्ट्राची, प्रत्येक घडामोडीचे थेट कव्हरेज',
    channelName: 'TV9 Marathi',
    category: 'news',
    url: 'https://www.youtube.com/watch?v=M9Z4l-6aM_Q',
    isLive: true,
    isActive: true,
    viewers: '38.1K',
    description: 'TV9 Marathi 24 Hours Live News streaming for Maharashtra and India.'
  },
  {
    id: 'saam-tv',
    title: 'Saam TV Live • साम टीव्ही २४ तास थेट प्रक्षेपण',
    channelName: 'Saam TV',
    category: 'news',
    url: 'https://www.youtube.com/watch?v=e7K-x83Wv_o',
    isLive: true,
    isActive: true,
    viewers: '22.8K',
    description: 'Sakal Media Group 24x7 Marathi News television channel.'
  },
  {
    id: 'aaj-tak',
    title: 'Aaj Tak Live TV • सबसे तेज राष्ट्रीय हिंदी समाचार',
    channelName: 'Aaj Tak',
    category: 'news',
    url: 'https://www.youtube.com/watch?v=2g811Eo7K8U',
    isLive: true,
    isActive: true,
    viewers: '95.4K',
    description: 'India Today Group 24/7 Hindi News live broadcast.'
  },
  {
    id: 'ndtv-india',
    title: 'NDTV India Live • 24/7 National Hindi News',
    channelName: 'NDTV India',
    category: 'news',
    url: 'https://www.youtube.com/watch?v=WB-y7_c6SEI',
    isLive: true,
    isActive: true,
    viewers: '31.6K',
    description: 'In-depth analysis, primetime debates, and ground reporting from NDTV.'
  },

  // 2. Kids & Animation
  {
    id: 'chuchu-tv',
    title: 'ChuChu TV Hindi & Marathi Rhymes Live • कार्टून आणि बालगीते',
    channelName: 'ChuChu TV',
    category: 'kids',
    url: 'https://www.youtube.com/watch?v=m7z19G1q2kE',
    isLive: true,
    isActive: true,
    viewers: '52.3K',
    description: 'Fun educational songs, moral stories, and cartoons for children.'
  },
  {
    id: 'infobells-kids',
    title: 'Infobells Marathi & Hindi Rhymes 24/7 Live • बालभारती गाणी',
    channelName: 'Infobells Marathi',
    category: 'kids',
    url: 'https://www.youtube.com/watch?v=X9o3gK6xP-w',
    isLive: true,
    isActive: true,
    viewers: '33.9K',
    description: 'Popular kids rhymes, 3D animated fairy tales and learning stories.'
  },
  {
    id: 'kids-planet',
    title: 'Kids Fun TV Live • Chhota Bheem & Friends Animated Adventures',
    channelName: 'Kids Planet Live',
    category: 'kids',
    url: 'https://www.youtube.com/watch?v=0-hV3WbJpXg',
    isLive: true,
    isActive: true,
    viewers: '19.4K',
    description: 'Non-stop animated entertainment for kids and young audience.'
  },

  // 3. Business & Economy
  {
    id: 'cnbc-awaaz',
    title: 'CNBC Awaaz Live • Stock Market, Sensex, Nifty & Business News',
    channelName: 'CNBC Awaaz',
    category: 'business',
    url: 'https://www.youtube.com/watch?v=5e1mX3-lS98',
    isLive: true,
    isActive: true,
    viewers: '28.7K',
    description: 'India’s leading business and financial television channel.'
  },
  {
    id: 'zee-business',
    title: 'Zee Business Live • शेअर बाजार, बजेट आणि पर्सनल फायनान्स',
    channelName: 'Zee Business',
    category: 'business',
    url: 'https://www.youtube.com/watch?v=d8V8z-1J4XQ',
    isLive: true,
    isActive: true,
    viewers: '25.1K',
    description: 'Live coverage of Indian stock markets, investment tips and commodity trends.'
  },
  {
    id: 'et-now',
    title: 'ET Now Swadesh Live • स्वदेशी बिझनेस आणि ट्रेडिंग डेस्क',
    channelName: 'ET Now Swadesh',
    category: 'business',
    url: 'https://www.youtube.com/watch?v=Z1Yp_9n2N9g',
    isLive: true,
    isActive: true,
    viewers: '17.3K',
    description: 'Times Network Hindi business channel covering corporate India.'
  },

  // 4. Devotional & Live Darshan
  {
    id: 'pandharpur-darshan',
    title: 'Shri Vitthal Rukmini Mandir Pandharpur 24/7 Live Darshan • पंढरपूर थेट दर्शन',
    channelName: 'Vitthal Mandir Pandharpur',
    category: 'devotional',
    url: 'https://www.youtube.com/watch?v=4W1m_sLzE7s',
    isLive: true,
    isActive: true,
    viewers: '41.8K',
    description: 'Official 24/7 Live Darshan from the sanctum sanctorum of Vitthal Rukmini Mandir.'
  },
  {
    id: 'shirdi-darshan',
    title: 'Shirdi Sai Baba Sansthan 24/7 Live Darshan • शिर्डी साईबाबा समाधी मंदिर',
    channelName: 'Shirdi Sai Sansthan',
    category: 'devotional',
    url: 'https://www.youtube.com/watch?v=6y7_8mN9v0Q',
    isLive: true,
    isActive: true,
    viewers: '68.2K',
    description: 'Continuous live streaming of Kakad Aarti, Dhoop Aarti, and Samadhi Darshan.'
  },
  {
    id: 'siddhivinayak-darshan',
    title: 'Shri Siddhivinayak Ganpati Prabhadevi Live Darshan • सिद्धिविनायक मंदिर',
    channelName: 'Siddhivinayak Mandir',
    category: 'devotional',
    url: 'https://www.youtube.com/watch?v=2p9_m3Z4lQ8',
    isLive: true,
    isActive: true,
    viewers: '35.4K',
    description: 'Live Aarti and Darshan of Shri Siddhivinayak Maharaj Prabhadevi Mumbai.'
  },

  // 5. Music & Entertainment
  {
    id: '9xm-live',
    title: '9XM Bollywood Hits 24/7 Live • नॉन-स्टॉप बॉलिवूड गाणी',
    channelName: '9XM Music',
    category: 'music',
    url: 'https://www.youtube.com/watch?v=mX9_k7Bq1W8',
    isLive: true,
    isActive: true,
    viewers: '29.3K',
    description: 'Chart-topping Hindi tracks, party beats, and viral music videos.'
  },
  {
    id: 'b4u-music',
    title: 'B4U Music 24/7 Live Streaming • सदाबहार आणि नवीन गाणी',
    channelName: 'B4U Music',
    category: 'music',
    url: 'https://www.youtube.com/watch?v=7p8_m9N1x4Q',
    isLive: true,
    isActive: true,
    viewers: '18.9K',
    description: '24/7 Television music stream featuring top Indian music.'
  },

  // 6. Sports Live Desk
  {
    id: 'sports-tak',
    title: 'Sports Tak Live • Cricket World Cup, IPL & Match Analysis Desk',
    channelName: 'Sports Tak',
    category: 'sports',
    url: 'https://www.youtube.com/watch?v=9x8_p4L1m3Q',
    isLive: true,
    isActive: true,
    viewers: '34.7K',
    description: 'Live cricket updates, pre-match press conferences and expert panel discussions.'
  },
  {
    id: 'dd-sports',
    title: 'DD Sports 24/7 Live • राष्ट्रीय क्रीडा थेट प्रक्षेपण',
    channelName: 'DD Sports',
    category: 'sports',
    url: 'https://www.youtube.com/watch?v=8x2_m7L9q1W',
    isLive: true,
    isActive: true,
    viewers: '21.5K',
    description: 'Prasar Bharati official sports channel streaming national and international events.'
  }
];

// GET: Public endpoint - fetch live TV config with multi-category channels
export async function GET() {
  const CACHE_KEY = 'api_live_tv_config_v2';
  const cachedData = getCache(CACHE_KEY);
  if (cachedData) return NextResponse.json(cachedData);

  const db = getDb();
  try {
    let customStreams = [];
    let enabled = true;
    let primaryStreamId = 'starnews-live';

    if (db) {
      const doc = await db.collection('settings').doc('live_tv_config').get();
      if (doc.exists) {
        const data = doc.data();
        enabled = data.enabled !== false;
        if (Array.isArray(data.streams) && data.streams.length > 0) {
          customStreams = data.streams.filter((s) => s.isActive !== false);
        }
        if (data.primaryStreamId) {
          primaryStreamId = data.primaryStreamId;
        }
      }
    }

    // Combine custom streams with default rich channel catalogue
    const streamMap = new Map();
    // Default channels first
    DEFAULT_CHANNELS.forEach((ch) => streamMap.set(ch.id, ch));
    // Overlay or prepend custom channels
    customStreams.forEach((ch) => streamMap.set(ch.id, { ...ch, isLive: true, isActive: true }));

    const allStreams = Array.from(streamMap.values());

    const responseData = {
      enabled,
      streams: allStreams,
      primaryStreamId: allStreams.some((s) => s.id === primaryStreamId) ? primaryStreamId : allStreams[0]?.id || 'starnews-live'
    };

    setCache(CACHE_KEY, responseData, 3 * 60 * 1000); // 3 minutes cache
    return NextResponse.json(responseData);
  } catch (error) {
    console.error('Error fetching live TV config:', error);
    return NextResponse.json({
      enabled: true,
      streams: DEFAULT_CHANNELS,
      primaryStreamId: 'starnews-live'
    });
  }
}
