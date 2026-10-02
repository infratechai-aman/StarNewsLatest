import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import admin from 'firebase-admin';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Read .env.local manually
const envPath = resolve(__dirname, '../.env.local');
const envContent = readFileSync(envPath, 'utf8');

const env = {};
envContent.split('\n').forEach(line => {
  const trimmed = line.trim();
  if (trimmed && !trimmed.startsWith('#')) {
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx !== -1) {
      const key = trimmed.slice(0, eqIdx).trim();
      let val = trimmed.slice(eqIdx + 1).trim();
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
        val = val.slice(1, -1);
      }
      env[key] = val;
    }
  }
});

let privateKey = env.FIREBASE_PRIVATE_KEY || '';
if (privateKey) {
  privateKey = privateKey.replace(/\\n/g, '\n');
}

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: env.FIREBASE_PROJECT_ID,
      clientEmail: env.FIREBASE_CLIENT_EMAIL,
      privateKey: privateKey,
    })
  });
}

const db = admin.firestore();

const PUNE_BUSINESSES = [
  // --- CAMP (PUNE) RESTAURANTS & CAFES ---
  {
    name: 'Kayani Bakery',
    businessName: 'Kayani Bakery',
    ownerName: 'Rustom Kayani',
    category: 'Cafe',
    phone: '+91 20 2636 0517',
    whatsapp: '+91 20 2636 0517',
    email: 'contact@kayanibakerypune.com',
    address: '6, East Street, Hulshur, Camp, Pune, Maharashtra 411001',
    city: 'Pune',
    area: 'Camp',
    description: 'Legendary Parsi bakery established in 1955 on East Street. World-renowned for authentic Shrewsbury biscuits, mawa cake, cheese papdi, and freshly baked walnut cakes.',
    coverImage: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=800&q=80',
    logo: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=200&q=80',
    website: 'https://www.kayanibakerypune.com',
    googleMapsLink: 'https://maps.google.com/?q=Kayani+Bakery+East+Street+Pune',
    rating: 4.8,
    reviewCount: 14200,
    featured: true,
    verified: true,
    approvalStatus: 'approved',
    active: true,
  },
  {
    name: 'George Restaurant',
    businessName: 'George Restaurant',
    ownerName: 'Darius Irani',
    category: 'Restaurant',
    phone: '+91 20 2613 1891',
    whatsapp: '+91 98220 12345',
    email: 'info@georgerestaurantpune.com',
    address: '2436, East Street, Camp, Pune, Maharashtra 411001',
    city: 'Pune',
    area: 'Camp',
    description: 'Iconic Mughlai and Persian culinary landmark in Pune Camp since 1936. Famous across India for authentic Mutton Dum Biryani, Chelo Kebab, Butter Chicken, and Roomali Roti.',
    coverImage: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=800&q=80',
    logo: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=200&q=80',
    website: 'https://www.georgerestaurant.in',
    googleMapsLink: 'https://maps.google.com/?q=George+Restaurant+East+Street+Camp+Pune',
    rating: 4.6,
    reviewCount: 8400,
    featured: true,
    verified: true,
    approvalStatus: 'approved',
    active: true,
  },
  {
    name: 'Marz-O-Rin',
    businessName: 'Marz-O-Rin',
    ownerName: 'Sheriar Sherif',
    category: 'Cafe',
    phone: '+91 20 2613 0774',
    whatsapp: '+91 20 2613 0774',
    email: 'orders@marzorin.com',
    address: '4, Bakthiar Plaza, MG Road, Camp, Pune, Maharashtra 411001',
    city: 'Pune',
    area: 'Camp',
    description: 'Heritage bakery cafe on MG Road operating in a 100-year-old colonial building. Iconic for mint chutney sandwiches, chicken cocktail rolls, macaroni bake, and cold coffee.',
    coverImage: 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=800&q=80',
    logo: 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=200&q=80',
    website: 'https://www.marzorin.com',
    googleMapsLink: 'https://maps.google.com/?q=Marz-O-Rin+MG+Road+Camp+Pune',
    rating: 4.7,
    reviewCount: 11500,
    featured: true,
    verified: true,
    approvalStatus: 'approved',
    active: true,
  },
  {
    name: 'Blue Nile Restaurant',
    businessName: 'Blue Nile Restaurant',
    ownerName: 'Ali Asghar',
    category: 'Restaurant',
    phone: '+91 20 2612 5238',
    whatsapp: '+91 98231 67890',
    email: 'bluenilepune@gmail.com',
    address: '4, Agakhan Compound, Bund Garden Road, Near Camp, Pune 411001',
    city: 'Pune',
    area: 'Camp',
    description: 'Pune premier Iranian & North Indian dining destination. Celebrated for Authentic Irani Biryani, Murgh Tandoori, Joojeh Kebab, and classic caramel custard.',
    coverImage: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=800&q=80',
    logo: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=200&q=80',
    website: 'https://www.bluenilepune.com',
    googleMapsLink: 'https://maps.google.com/?q=Blue+Nile+Bund+Garden+Camp+Pune',
    rating: 4.5,
    reviewCount: 7200,
    featured: false,
    verified: true,
    approvalStatus: 'approved',
    active: true,
  },
  {
    name: 'Camp Burger (King Burger)',
    businessName: 'Camp Burger',
    ownerName: 'Farhad Irani',
    category: 'Restaurant',
    phone: '+91 20 2613 7750',
    whatsapp: '+91 20 2613 7750',
    email: 'campburger@gmail.com',
    address: 'Phulgaon Road, East Street, Camp, Pune, Maharashtra 411001',
    city: 'Pune',
    area: 'Camp',
    description: 'The legendary student and youth favorite since 1989. Famous for massive King Beef & Chicken Burgers, crinkle-cut fries, and chilled homemade lemon iced tea.',
    coverImage: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=800&q=80',
    logo: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=200&q=80',
    website: 'https://www.campburger.in',
    googleMapsLink: 'https://maps.google.com/?q=Camp+Burger+East+Street+Pune',
    rating: 4.7,
    reviewCount: 12800,
    featured: true,
    verified: true,
    approvalStatus: 'approved',
    active: true,
  },

  // --- CAMP (PUNE) HEALTHCARE & CLINICS ---
  {
    name: 'Jehangir Hospital & Medical Centre',
    businessName: 'Jehangir Hospital',
    ownerName: 'Jehangir Healthcare Trust',
    category: 'Healthcare',
    phone: '+91 20 6681 9999',
    whatsapp: '+91 20 6681 1000',
    email: 'appointments@jehangirhospital.com',
    address: '32, Sassoon Road, Opposite Pune Railway Station, Near Camp, Pune 411001',
    city: 'Pune',
    area: 'Camp',
    description: 'NABH-accredited 350-bed tertiary care multi-speciality hospital serving Camp and Pune with state-of-the-art ICU, cardiology, neurology, and 24x7 trauma care.',
    coverImage: 'https://images.unsplash.com/photo-1586773860418-d37222d8fce3?w=800&q=80',
    logo: 'https://images.unsplash.com/photo-1586773860418-d37222d8fce3?w=200&q=80',
    website: 'https://www.jehangirhospital.com',
    googleMapsLink: 'https://maps.google.com/?q=Jehangir+Hospital+Sassoon+Road+Pune',
    rating: 4.6,
    reviewCount: 5600,
    featured: true,
    verified: true,
    approvalStatus: 'approved',
    active: true,
  },
  {
    name: "Dr. Batra's Positive Health Clinic (Camp)",
    businessName: "Dr. Batra's Positive Health Clinic",
    ownerName: "Dr. Mukesh Batra",
    category: 'Healthcare',
    phone: '+91 90330 01122',
    whatsapp: '+91 90330 01122',
    email: 'info@drbatras.com',
    address: '2nd Floor, Sterling Centre, Moledina Road, Camp, Pune, Maharashtra 411001',
    city: 'Pune',
    area: 'Camp',
    description: 'Specialized clinic for homeopathy treatments, hair loss restoration, dermatology, allergy management, and holistic lifestyle wellness.',
    coverImage: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=800&q=80',
    logo: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=200&q=80',
    website: 'https://www.drbatras.com',
    googleMapsLink: 'https://maps.google.com/?q=Dr+Batras+Sterling+Centre+Moledina+Road+Camp+Pune',
    rating: 4.7,
    reviewCount: 890,
    featured: false,
    verified: true,
    approvalStatus: 'approved',
    active: true,
  },
  {
    name: 'Camp Dental Clinic & Implant Centre',
    businessName: 'Camp Dental Clinic',
    ownerName: 'Dr. Rahul Kothari',
    category: 'Healthcare',
    phone: '+91 20 2613 4488',
    whatsapp: '+91 98222 34488',
    email: 'campdentalcare@gmail.com',
    address: 'Suite 102, Aurora Towers, MG Road, Camp, Pune, Maharashtra 411001',
    city: 'Pune',
    area: 'Camp',
    description: 'Advanced digital dentistry, painless root canal, cosmetic smile designing, and dental implants by senior dental surgeons with over 20 years of experience.',
    coverImage: 'https://images.unsplash.com/photo-1629909613654-28e377c37b09?w=800&q=80',
    logo: 'https://images.unsplash.com/photo-1629909613654-28e377c37b09?w=200&q=80',
    website: 'https://www.campdentalpune.com',
    googleMapsLink: 'https://maps.google.com/?q=Camp+Dental+Aurora+Towers+MG+Road+Pune',
    rating: 4.9,
    reviewCount: 640,
    featured: false,
    verified: true,
    approvalStatus: 'approved',
    active: true,
  },

  // --- KONDHWA (PUNE) RESTAURANTS & CAFES ---
  {
    name: 'PK Biryani House (Kondhwa)',
    businessName: 'PK Biryani House',
    ownerName: 'Pravin Kedari',
    category: 'Restaurant',
    phone: '+91 91580 07788',
    whatsapp: '+91 91580 07788',
    email: 'contact@pkbiryanihouse.com',
    address: 'Opp. Bizzbay Mall, NIBM Post Office Road, Kondhwa, Pune, Maharashtra 411048',
    city: 'Pune',
    area: 'Kondhwa',
    description: 'Authentic Maharashtrian Sajuk Tupatli Biryani and spicy Kolhapuri Tambda-Pandhra Rassa. One of Kondhwa most popular and highest rated biryani destinations.',
    coverImage: 'https://images.unsplash.com/photo-1589302168068-964664d93dc0?w=800&q=80',
    logo: 'https://images.unsplash.com/photo-1589302168068-964664d93dc0?w=200&q=80',
    website: 'https://www.pkbiryanihouse.com',
    googleMapsLink: 'https://maps.google.com/?q=PK+Biryani+House+NIBM+Kondhwa+Pune',
    rating: 4.5,
    reviewCount: 6800,
    featured: true,
    verified: true,
    approvalStatus: 'approved',
    active: true,
  },
  {
    name: 'Zeeshan Restaurant - Apna Hyderabadi Food',
    businessName: 'Zeeshan Restaurant',
    ownerName: 'Mohammed Zeeshan',
    category: 'Restaurant',
    phone: '+91 20 2685 1122',
    whatsapp: '+91 98900 78654',
    email: 'info@zeeshanrestaurant.com',
    address: 'Salunke Vihar Road, Near Jyoti Pure Veg, Kondhwa, Pune, Maharashtra 411048',
    city: 'Pune',
    area: 'Kondhwa',
    description: 'Authentic Hyderabadi Dum Biryani, slow-cooked aromatic Haleem, and Mughlai charcoal grills. A landmark dinner destination on Salunke Vihar Road.',
    coverImage: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=800&q=80',
    logo: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=200&q=80',
    website: 'https://www.zeeshanhyderabadi.com',
    googleMapsLink: 'https://maps.google.com/?q=Zeeshan+Restaurant+Salunke+Vihar+Kondhwa+Pune',
    rating: 4.6,
    reviewCount: 9300,
    featured: true,
    verified: true,
    approvalStatus: 'approved',
    active: true,
  },
  {
    name: 'Cafe Arabia',
    businessName: 'Cafe Arabia',
    ownerName: 'Tariq Mansoor',
    category: 'Restaurant',
    phone: '+91 88880 12345',
    whatsapp: '+91 88880 12345',
    email: 'arabia.kausarbaugh@gmail.com',
    address: 'Kausar Baugh Road, Kondhwa, Pune, Maharashtra 411048',
    city: 'Pune',
    area: 'Kondhwa',
    description: 'Premier Middle Eastern & Arabian restaurant in Kausar Baugh. Renowned for Al Faham chicken, Mutton Mandi platters, and authentic Lebanese shawarma rolls.',
    coverImage: 'https://images.unsplash.com/photo-1529042410759-befb1204b468?w=800&q=80',
    logo: 'https://images.unsplash.com/photo-1529042410759-befb1204b468?w=200&q=80',
    website: 'https://www.cafearabiapune.com',
    googleMapsLink: 'https://maps.google.com/?q=Cafe+Arabia+Kausar+Baugh+Kondhwa+Pune',
    rating: 4.7,
    reviewCount: 4100,
    featured: true,
    verified: true,
    approvalStatus: 'approved',
    active: true,
  },
  {
    name: 'The Brooklyn Bakery & Patisserie',
    businessName: 'The Brooklyn Bakery',
    ownerName: 'Sarah Deshmukh',
    category: 'Cafe',
    phone: '+91 98230 45678',
    whatsapp: '+91 98230 45678',
    email: 'orders@brooklynbakerypune.com',
    address: 'Shop 3, Bramha Avenue, Salunke Vihar Road, Kondhwa, Pune, Maharashtra 411048',
    city: 'Pune',
    area: 'Kondhwa',
    description: 'Artisan sourdough breads, French viennoiseries, handcrafted baked cheesecakes, and specialty Arabica pour-overs in a stylish European-inspired cafe setting.',
    coverImage: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=800&q=80',
    logo: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=200&q=80',
    website: 'https://www.brooklynbakerypune.com',
    googleMapsLink: 'https://maps.google.com/?q=Brooklyn+Bakery+Salunke+Vihar+Kondhwa+Pune',
    rating: 4.8,
    reviewCount: 1450,
    featured: false,
    verified: true,
    approvalStatus: 'approved',
    active: true,
  },

  // --- KONDHWA (PUNE) HEALTHCARE & CLINICS ---
  {
    name: 'Satyanand Hospital & Research Centre',
    businessName: 'Satyanand Hospital',
    ownerName: 'Dr. Satyanand Memorial Trust',
    category: 'Healthcare',
    phone: '+91 20 2693 2100',
    whatsapp: '+91 98230 22100',
    email: 'admin@satyanandhospital.com',
    address: 'Kondhwa Main Road, Near Khadi Machine Chowk, Kondhwa, Pune, Maharashtra 411048',
    city: 'Pune',
    area: 'Kondhwa',
    description: 'Leading 100-bed multi-specialty hospital with 24x7 emergency department, intensive care unit, advanced dialysis center, and maternity wing.',
    coverImage: 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=800&q=80',
    logo: 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=200&q=80',
    website: 'https://www.satyanandhospital.com',
    googleMapsLink: 'https://maps.google.com/?q=Satyanand+Hospital+Kondhwa+Pune',
    rating: 4.6,
    reviewCount: 2100,
    featured: true,
    verified: true,
    approvalStatus: 'approved',
    active: true,
  },
  {
    name: 'Lifeline Hospital & Critical Care Centre',
    businessName: 'Lifeline Hospital',
    ownerName: 'Dr. Rajesh Patil',
    category: 'Healthcare',
    phone: '+91 20 2693 4500',
    whatsapp: '+91 98900 44500',
    email: 'info@lifelinehospitalpune.com',
    address: 'Near Sheetla Devi Mandir, Kondhwa Budruk, Pune, Maharashtra 411048',
    city: 'Pune',
    area: 'Kondhwa',
    description: 'Comprehensive critical care center equipped with state-of-the-art ICU, neonatal pediatric unit, laparoscopic surgery suites, and round-the-clock pharmacy.',
    coverImage: 'https://images.unsplash.com/photo-1586773860418-d37222d8fce3?w=800&q=80',
    logo: 'https://images.unsplash.com/photo-1586773860418-d37222d8fce3?w=200&q=80',
    website: 'https://www.lifelinehospitalpune.com',
    googleMapsLink: 'https://maps.google.com/?q=Lifeline+Hospital+Kondhwa+Budruk+Pune',
    rating: 4.7,
    reviewCount: 1850,
    featured: false,
    verified: true,
    approvalStatus: 'approved',
    active: true,
  },
  {
    name: "Dr. Merchant's Family Clinic & Healthcare",
    businessName: "Dr. Merchant's Family Clinic",
    ownerName: "Dr. Asif Merchant",
    category: 'Healthcare',
    phone: '+91 20 2683 8899',
    whatsapp: '+91 98220 88899',
    email: 'merchantclinic.nibm@gmail.com',
    address: 'Ground Floor, Clover Highlands, NIBM Road, Kondhwa, Pune, Maharashtra 411048',
    city: 'Pune',
    area: 'Kondhwa',
    description: 'Trusted family healthcare clinic offering preventive wellness, chronic diabetes management, pediatric immunizations, and digital pathology laboratory.',
    coverImage: 'https://images.unsplash.com/photo-1631815589968-fdb09a223b1e?w=800&q=80',
    logo: 'https://images.unsplash.com/photo-1631815589968-fdb09a223b1e?w=200&q=80',
    website: 'https://www.merchanthealthcare.com',
    googleMapsLink: 'https://maps.google.com/?q=Dr+Merchants+Clinic+NIBM+Road+Kondhwa+Pune',
    rating: 4.9,
    reviewCount: 920,
    featured: false,
    verified: true,
    approvalStatus: 'approved',
    active: true,
  },
  {
    name: 'Apex Dental Care & Implant Clinic',
    businessName: 'Apex Dental Care',
    ownerName: 'Dr. Sneha Agrawal',
    category: 'Healthcare',
    phone: '+91 98900 11223',
    whatsapp: '+91 98900 11223',
    email: 'apexdental.salunke@gmail.com',
    address: '1st Floor, Kedari Icon, Salunke Vihar Road, Kondhwa, Pune, Maharashtra 411048',
    city: 'Pune',
    area: 'Kondhwa',
    description: 'Modern dental clinic specializing in pain-free single sitting root canals, clear invisible aligners, dental crowns, and dental tourism implants.',
    coverImage: 'https://images.unsplash.com/photo-1606811841689-23dfddce3e95?w=800&q=80',
    logo: 'https://images.unsplash.com/photo-1606811841689-23dfddce3e95?w=200&q=80',
    website: 'https://www.apexdentalpune.in',
    googleMapsLink: 'https://maps.google.com/?q=Apex+Dental+Salunke+Vihar+Kondhwa+Pune',
    rating: 4.9,
    reviewCount: 780,
    featured: false,
    verified: true,
    approvalStatus: 'approved',
    active: true,
  }
];

async function seed() {
  console.log(`Seeding ${PUNE_BUSINESSES.length} Pune businesses (Kondhwa & Camp) into Firestore...`);
  const batch = db.batch();
  const now = new Date().toISOString();

  for (const b of PUNE_BUSINESSES) {
    const docId = b.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 30);
    const docRef = db.collection('businesses').doc(docId);
    batch.set(docRef, {
      ...b,
      id: docId,
      createdAt: now,
      updatedAt: now,
      approvedAt: now,
      approvedBy: 'Admin (System Panel)',
    }, { merge: true });
  }

  await batch.commit();
  console.log('✅ Successfully seeded all 16 Kondhwa & Camp businesses into Firestore collection `businesses`!');
  process.exit(0);
}

seed().catch(err => {
  console.error('Seed error:', err);
  process.exit(1);
});
