// Major Indian Cities for City News Feature
// Organized by state/region for better UX

export const INDIAN_CITIES = [
    // Metro Cities
    'Mumbai',
    'Delhi',
    'Bangalore',
    'Hyderabad',
    'Chennai',
    'Kolkata',
    'Pune',
    'Ahmedabad',

    // Maharashtra
    'Nagpur',
    'Nashik',
    'Aurangabad',
    'Solapur',
    'Thane',
    'Navi Mumbai',
    'Kalyan',
    'Vasai-Virar',
    'Amravati',
    'Kolhapur',
    'Sangli',
    'Akola',
    'Latur',
    'Dhule',
    'Ahmednagar',
    'Jalgaon',
    'Chandrapur',
    'Parbhani',
    'Jalna',
    'Bhiwandi',
    'Panvel',

    // Gujarat
    'Surat',
    'Vadodara',
    'Rajkot',
    'Gandhinagar',
    'Bhavnagar',
    'Jamnagar',
    'Junagadh',
    'Anand',
    'Mehsana',

    // Rajasthan
    'Jaipur',
    'Jodhpur',
    'Udaipur',
    'Kota',
    'Ajmer',
    'Bikaner',
    'Bhilwara',
    'Alwar',
    'Sikar',

    // Uttar Pradesh
    'Lucknow',
    'Kanpur',
    'Varanasi',
    'Agra',
    'Prayagraj',
    'Meerut',
    'Ghaziabad',
    'Noida',
    'Bareilly',
    'Aligarh',
    'Moradabad',
    'Saharanpur',
    'Gorakhpur',
    'Jhansi',
    'Mathura',
    'Firozabad',

    // Madhya Pradesh
    'Bhopal',
    'Indore',
    'Jabalpur',
    'Gwalior',
    'Ujjain',
    'Sagar',
    'Dewas',
    'Satna',
    'Rewa',

    // Tamil Nadu
    'Coimbatore',
    'Madurai',
    'Tiruchirappalli',
    'Salem',
    'Tirunelveli',
    'Erode',
    'Vellore',
    'Tiruppur',
    'Thanjavur',

    // Karnataka
    'Mysuru',
    'Mangaluru',
    'Hubli-Dharwad',
    'Belgaum',
    'Gulbarga',
    'Davanagere',
    'Bellary',
    'Shimoga',
    'Tumkur',

    // Andhra Pradesh & Telangana
    'Visakhapatnam',
    'Vijayawada',
    'Guntur',
    'Nellore',
    'Kurnool',
    'Rajahmundry',
    'Tirupati',
    'Kadapa',
    'Warangal',
    'Nizamabad',
    'Karimnagar',
    'Khammam',

    // Kerala
    'Kochi',
    'Thiruvananthapuram',
    'Kozhikode',
    'Thrissur',
    'Kollam',
    'Palakkad',
    'Alappuzha',
    'Kannur',

    // West Bengal
    'Howrah',
    'Asansol',
    'Siliguri',
    'Durgapur',
    'Bardhaman',
    'Malda',
    'Baharampur',
    'Kharagpur',

    // Bihar & Jharkhand
    'Patna',
    'Gaya',
    'Bhagalpur',
    'Muzaffarpur',
    'Darbhanga',
    'Ranchi',
    'Jamshedpur',
    'Dhanbad',
    'Bokaro',
    'Hazaribagh',

    // Odisha
    'Bhubaneswar',
    'Cuttack',
    'Rourkela',
    'Berhampur',
    'Sambalpur',
    'Puri',

    // Punjab & Haryana
    'Ludhiana',
    'Amritsar',
    'Jalandhar',
    'Patiala',
    'Bathinda',
    'Mohali',
    'Chandigarh',
    'Faridabad',
    'Gurugram',
    'Panipat',
    'Ambala',
    'Karnal',
    'Rohtak',
    'Hisar',

    // Chhattisgarh
    'Raipur',
    'Bhilai',
    'Bilaspur',
    'Korba',
    'Durg',

    // Assam & Northeast
    'Guwahati',
    'Silchar',
    'Dibrugarh',
    'Jorhat',
    'Imphal',
    'Shillong',
    'Agartala',
    'Aizawl',
    'Itanagar',
    'Kohima',
    'Gangtok',

    // Uttarakhand
    'Dehradun',
    'Haridwar',
    'Roorkee',
    'Haldwani',
    'Rishikesh',

    // Himachal Pradesh
    'Shimla',
    'Dharamshala',
    'Solan',
    'Mandi',
    'Kullu',

    // Jammu & Kashmir
    'Srinagar',
    'Jammu',
    'Anantnag',
    'Baramulla',

    // Goa
    'Panaji',
    'Margao',
    'Vasco da Gama',
    'Mapusa',

    // Union Territories
    'Puducherry',
    'Port Blair',
    'Daman',
    'Silvassa',
    'Leh',
]

// All cities sorted alphabetically for dropdown
export const INDIAN_CITIES_SORTED = [...INDIAN_CITIES].sort((a, b) => a.localeCompare(b))

// Popular cities to show first in city section
export const POPULAR_CITIES = [
    'Mumbai',
    'Delhi',
    'Bangalore',
    'Hyderabad',
    'Chennai',
    'Kolkata',
    'Pune',
    'Ahmedabad',
    'Jaipur',
    'Lucknow',
    'Surat',
    'Nagpur',
]

export default INDIAN_CITIES_SORTED
