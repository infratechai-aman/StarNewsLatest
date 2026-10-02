import { getDb } from '@/lib/firebaseAdmin';
import { NextResponse } from 'next/server';
import { getCache, setCache } from '@/lib/cache';

export const dynamic = 'force-dynamic';

export const DEFAULT_CHANNELS = [
  // 1. News Channels
  {
    id: 'starnews-live',
    title: 'StarNews India 24/7 Live Broadcast • ग्राउंड रिपोर्ट व ताज्या घडामोडी',
    channelName: 'StarNews India',
    category: 'news',
    url: 'https://www.youtube.com/watch?v=GFjuqQmfVIU',
    thumbnail: 'https://img.youtube.com/vi/GFjuqQmfVIU/hqdefault.jpg',
    isLive: true,
    isActive: true,
    viewers: '24.5K',
    description: 'Ground reports, verified bulletins, and breaking political updates from Maharashtra.'
  },
  {
    id: 'aaj-tak',
    title: 'Aaj Tak Live TV • सबसे तेज राष्ट्रीय हिंदी समाचार 24x7',
    channelName: 'Aaj Tak',
    category: 'news',
    url: 'https://www.youtube.com/watch?v=2g811Eo7K8U',
    thumbnail: 'https://img.youtube.com/vi/2g811Eo7K8U/hqdefault.jpg',
    isLive: true,
    isActive: true,
    viewers: '95.4K',
    description: 'India Today Group 24/7 Hindi News live broadcast.'
  },
  {
    id: 'abp-majha',
    title: 'ABP Majha Live 24/7 • महाराष्ट्राचा नंबर १ मराठी न्यूज चॅनेल',
    channelName: 'ABP Majha',
    category: 'news',
    url: 'https://www.youtube.com/watch?v=_443H7ZgR5Y',
    thumbnail: 'https://img.youtube.com/vi/_443H7ZgR5Y/hqdefault.jpg',
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
    url: 'https://www.youtube.com/watch?v=r8Fm-zX_7lI',
    thumbnail: 'https://img.youtube.com/vi/r8Fm-zX_7lI/hqdefault.jpg',
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
    url: 'https://www.youtube.com/watch?v=Xl8cK48s7mY',
    thumbnail: 'https://img.youtube.com/vi/Xl8cK48s7mY/hqdefault.jpg',
    isLive: true,
    isActive: true,
    viewers: '22.8K',
    description: 'Sakal Media Group 24x7 Marathi News television channel.'
  },
  {
    id: 'ndtv-india',
    title: 'NDTV India Live • 24/7 National Hindi News & Primetime',
    channelName: 'NDTV India',
    category: 'news',
    url: 'https://www.youtube.com/watch?v=l9ViEIip9ao',
    thumbnail: 'https://img.youtube.com/vi/l9ViEIip9ao/hqdefault.jpg',
    isLive: true,
    isActive: true,
    viewers: '31.6K',
    description: 'In-depth analysis, primetime debates, and ground reporting from NDTV.'
  },
  {
    id: 'zee-24-taas',
    title: 'Zee 24 Taas Live • झी २४ तास थेट बातमीपत्र',
    channelName: 'Zee 24 Taas',
    category: 'news',
    url: 'https://www.youtube.com/watch?v=h7iR9fQ3iG8',
    thumbnail: 'https://img.youtube.com/vi/h7iR9fQ3iG8/hqdefault.jpg',
    isLive: true,
    isActive: true,
    viewers: '29.1K',
    description: 'First 24-hour Marathi news channel bringing accurate breaking news.'
  },
  {
    id: 'dd-news',
    title: 'DD News Live • दूरदर्शन राष्ट्रीय समाचार 24x7',
    channelName: 'DD News',
    category: 'news',
    url: 'https://www.youtube.com/watch?v=sF7Q8Z4Yt70',
    thumbnail: 'https://img.youtube.com/vi/sF7Q8Z4Yt70/hqdefault.jpg',
    isLive: true,
    isActive: true,
    viewers: '18.4K',
    description: 'Official national public broadcaster of India.'
  },

  // 2. Business & Economy
  {
    id: 'cnbc-awaaz',
    title: 'CNBC Awaaz Live • Stock Market, Sensex, Nifty & Business News',
    channelName: 'CNBC Awaaz',
    category: 'business',
    url: 'https://www.youtube.com/watch?v=p3yY9uV3k2I',
    thumbnail: 'https://img.youtube.com/vi/p3yY9uV3k2I/hqdefault.jpg',
    isLive: true,
    isActive: true,
    viewers: '28.7K',
    description: 'India’s leading business and financial television channel.'
  },
  {
    id: 'et-now',
    title: 'ET Now Swadesh Live • स्वदेशी बिझनेस आणि ट्रेडिंग डेस्क',
    channelName: 'ET Now Swadesh',
    category: 'business',
    url: 'https://www.youtube.com/watch?v=n_0l9U6L_dY',
    thumbnail: 'https://img.youtube.com/vi/n_0l9U6L_dY/hqdefault.jpg',
    isLive: true,
    isActive: true,
    viewers: '17.3K',
    description: 'Times Network Hindi business channel covering corporate India.'
  },

  // 3. Kids & Animation
  {
    id: 'chuchu-tv',
    title: 'ChuChu TV Hindi & Marathi Rhymes Live • कार्टून आणि बालगीते',
    channelName: 'ChuChu TV',
    category: 'kids',
    url: 'https://www.youtube.com/watch?v=WdQ9k4Q5mFE',
    thumbnail: 'https://img.youtube.com/vi/WdQ9k4Q5mFE/hqdefault.jpg',
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
    url: 'https://www.youtube.com/watch?v=_b1Ld7-hP8k',
    thumbnail: 'https://img.youtube.com/vi/_b1Ld7-hP8k/hqdefault.jpg',
    isLive: true,
    isActive: true,
    viewers: '33.9K',
    description: 'Popular kids rhymes, 3D animated fairy tales and learning stories.'
  },

  // 4. Devotional & Live Darshan
  {
    id: 'shirdi-darshan',
    title: 'Shirdi Sai Baba Sansthan 24/7 Live Darshan • शिर्डी साईबाबा समाधी मंदिर',
    channelName: 'Shirdi Sai Sansthan',
    category: 'devotional',
    url: 'https://www.youtube.com/watch?v=0gM9R0rPz_A',
    thumbnail: 'https://img.youtube.com/vi/0gM9R0rPz_A/hqdefault.jpg',
    isLive: true,
    isActive: true,
    viewers: '68.2K',
    description: 'Continuous live streaming of Kakad Aarti, Dhoop Aarti, and Samadhi Darshan.'
  },

  // 5. Music & Entertainment
  {
    id: '9xm-live',
    title: '9XM Bollywood Hits 24/7 Live • नॉन-स्टॉप बॉलिवूड गाणी',
    channelName: '9XM Music',
    category: 'music',
    url: 'https://www.youtube.com/watch?v=t0Q2otsqC4I',
    thumbnail: 'https://img.youtube.com/vi/t0Q2otsqC4I/hqdefault.jpg',
    isLive: true,
    isActive: true,
    viewers: '29.3K',
    description: 'Chart-topping Hindi tracks, party beats, and viral music videos.'
  },

  // 6. Sports Live Desk
  {
    id: 'sports-tak',
    title: 'Sports Tak Live • Cricket World Cup, IPL & Match Analysis Desk',
    channelName: 'Sports Tak',
    category: 'sports',
    url: 'https://www.youtube.com/watch?v=_4zKj3G8gW8',
    thumbnail: 'https://img.youtube.com/vi/_4zKj3G8gW8/hqdefault.jpg',
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
    url: 'https://www.youtube.com/watch?v=_v3a9Z7r0b8',
    thumbnail: 'https://img.youtube.com/vi/_v3a9Z7r0b8/hqdefault.jpg',
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
