import os
import json
import requests
import re
import argparse
from datetime import datetime
from bs4 import BeautifulSoup
import firebase_admin
from firebase_admin import credentials, firestore
from dotenv import load_dotenv

# Load Environment Variables from next.js .env.local
load_dotenv(dotenv_path='./frontend/.env.local')

# Setup Firebase Admin
def init_firebase():
    if not firebase_admin._apps:
        private_key = os.environ.get('FIREBASE_PRIVATE_KEY', '')
        if private_key:
            private_key = private_key.replace('\\n', '\n')
        
        cred = credentials.Certificate({
            "type": "service_account",
            "project_id": os.environ.get('FIREBASE_PROJECT_ID'),
            "private_key_id": os.environ.get('FIREBASE_PRIVATE_KEY_ID', ''),
            "private_key": private_key,
            "client_email": os.environ.get('FIREBASE_CLIENT_EMAIL'),
            "client_id": os.environ.get('FIREBASE_CLIENT_ID', ''),
            "auth_uri": "https://accounts.google.com/o/oauth2/auth",
            "token_uri": "https://oauth2.googleapis.com/token",
            "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
            "client_x509_cert_url": os.environ.get('FIREBASE_CLIENT_CERT_URL', '')
        })
        firebase_admin.initialize_app(cred)
    return firestore.client()

db = init_firebase()

# Category Mapping Logic
def get_categories_map():
    print("Loading existing categories from Firestore...")
    snapshot = db.collection('news_categories').stream()
    cat_map = {}
    for doc in snapshot:
        data = doc.to_dict()
        name = data.get('name', '')
        if isinstance(name, dict):
            name = name.get('en', '')
        cat_map[name.lower()] = doc.id
    return cat_map

def determine_category(blogger_labels, existing_cats):
    # Fallback to Pune News or City News
    default_cat_name = "Pune News"
    if default_cat_name.lower() in existing_cats:
        cat_id = existing_cats[default_cat_name.lower()]
    elif "city news" in existing_cats:
        default_cat_name = "City News"
        cat_id = existing_cats["city news"]
    else:
        # Fallback to first available category
        default_cat_name = list(existing_cats.keys())[0].title() if existing_cats else "General"
        cat_id = list(existing_cats.values())[0] if existing_cats else "unknown"

    label_str = " ".join(blogger_labels).lower()
    
    # Simple keyword mapping
    if "crime" in label_str or "क्राईम" in label_str:
        cat_name = "Crime"
    elif "politics" in label_str or "राजकीय" in label_str or "election" in label_str:
        cat_name = "Politics"
    elif "kondhwa" in label_str or "कोंढवा" in label_str:
        cat_name = "Pune News" # Or specific if it exists
    elif "maharashtra" in label_str or "महाराष्ट्र" in label_str:
        cat_name = "Maharashtra"
    else:
        cat_name = default_cat_name

    # Check if mapped category exists
    if cat_name.lower() in existing_cats:
        return existing_cats[cat_name.lower()], cat_name
    return cat_id, default_cat_name

# Translation Helper
def translate_text(text, source_lang='mr', max_chunk_size=3000):
    if not text:
        return {'en': '', 'hi': '', 'mr': ''}

    import time
    results = {'mr': text} # Source is Marathi
    
    for target_lang in ['en', 'hi']:
        # Google Translate Free API endpoint
        url = f"https://translate.googleapis.com/translate_a/single?client=gtx&sl={source_lang}&tl={target_lang}&dt=t"
        
        # Very large HTML contents need to be chunked. 
        # For simplicity in this script, we'll translate the whole string if it's small, 
        # or strip some HTML safely if it's too large, but typically Blogger posts fit in one go.
        # It's better to chunk by paragraphs if doing robustly.
        try:
            # Sleep slightly to avoid being ratelimited
            time.sleep(0.5) 
            response = requests.post(url, data={'q': text})
            if response.status_code == 200:
                data = response.json()
                translated = "".join([chunk[0] for chunk in data[0] if chunk[0]])
                results[target_lang] = translated
            else:
                print(f"  [!] Translation to {target_lang} failed with status {response.status_code}")
                results[target_lang] = text # Fallback
        except Exception as e:
            print(f"  [!] Translation error: {str(e)}")
            results[target_lang] = text # Fallback

    return results

def extract_content_data(html_content):
    soup = BeautifulSoup(html_content, 'html.parser')
    
    # Extract images
    images = []
    for img in soup.find_all('img'):
        src = img.get('src')
        if src and src.startswith('http'):
            # Convert Blogger thumbnail URLs to high-res if possible
            if '/s72-c/' in src:
                src = src.replace('/s72-c/', '/s1600/')
            images.append(src)
            
    # Extract YouTube links
    youtube_url = ""
    for iframe in soup.find_all('iframe'):
        src = iframe.get('src', '')
        if 'youtube.com' in src or 'youtu.be' in src:
            youtube_url = src
            break
            
    # Clean text for meta description
    clean_text = soup.get_text(separator=' ', strip=True)
    meta_desc = (clean_text[:197] + "...") if len(clean_text) > 200 else clean_text
    
    return images, youtube_url, meta_desc

def fetch_all_blogger_posts():
    base_url = "https://www.punemajhanews.in/feeds/posts/default"
    params = {
        'alt': 'json',
        'max-results': 50,
        'start-index': 1
    }
    
    all_entries = []
    while True:
        print(f"Fetching articles start-index: {params['start-index']}...")
        response = requests.get(base_url, params=params)
        if response.status_code != 200:
            print(f"Failed to fetch feed: {response.status_code}")
            break
            
        data = response.json()
        feed = data.get('feed', {})
        entries = feed.get('entry', [])
        
        if not entries:
            break
            
        all_entries.extend(entries)
        
        # Check if we've fetched all
        total_results = int(feed.get('openSearch$totalResults', {}).get('$t', 0))
        if len(all_entries) >= total_results:
            break
            
        params['start-index'] += 50
        
    return all_entries

def run_scraper(dry_run=False):
    print("=" * 60)
    print("🚀 PUNE MAJHA NEWS BLOGGER SCRAPER")
    print("=" * 60)
    
    existing_cats = get_categories_map()
    print(f"Loaded {len(existing_cats)} categories: {list(existing_cats.keys())[:5]}...")

    # Load previously added originalUrls to avoid duplicates
    print("Loading existing articles to avoid duplicates...")
    existing_urls = set()
    docs = db.collection('news_articles').select(['originalUrl']).stream()
    for doc in docs:
        url = doc.to_dict().get('originalUrl')
        if url:
            existing_urls.add(url)
    
    entries = fetch_all_blogger_posts()
    print(f"Found {len(entries)} articles in Blogger feed.\n")
    
    added_count = 0
    skipped_count = 0
    error_count = 0
    
    for idx, entry in enumerate(entries, 1):
        try:
            # Basic info
            title = entry.get('title', {}).get('$t', '')
            content_html = entry.get('content', {}).get('$t', '')
            published = entry.get('published', {}).get('$t', '')
            
            # Original Link
            original_url = ""
            for link in entry.get('link', []):
                if link.get('rel') == 'alternate' and link.get('type') == 'text/html':
                    original_url = link.get('href')
                    break
                    
            print(f"[{idx}/{len(entries)}] Processing: {title[:50]}...")
            
            if original_url in existing_urls:
                print("  -> Skipped (Already exists in Firestore)")
                skipped_count += 1
                continue
                
            # Labels / Categories
            labels = [c.get('term', '') for c in entry.get('category', [])]
            cat_id, cat_name = determine_category(labels, existing_cats)
            
            # Images
            inline_images, yt_url, meta_desc = extract_content_data(content_html)
            
            main_image = ""
            if 'media$thumbnail' in entry:
                main_image = entry['media$thumbnail']['url'].replace('/s72-c/', '/s1600/')
            elif inline_images:
                main_image = inline_images[0]
                
            # Translations
            print("  -> Translating content...")
            translated_title = translate_text(title)
            translated_content = translate_text(content_html)
            
            # Construct Document
            article_doc = {
                "title": translated_title,
                "content": translated_content,
                "categoryId": cat_id,
                "category": cat_name,
                "city": "Pune",
                "mainImage": main_image,
                "galleryImages": inline_images,
                "videoUrl": yt_url,
                "youtubeUrl": yt_url,
                "tags": labels,
                "metaDescription": meta_desc,
                "thumbnailUrl": main_image,
                "thumbnails": [main_image] if main_image else [],
                "authorId": "system-scraper",
                "authorName": "Pune Majha News",
                "approvalStatus": "approved",
                "active": True,
                "featured": False,
                "showOnHome": True,
                "views": 0,
                "originalUrl": original_url,
                "createdAt": published,
                "updatedAt": datetime.utcnow().isoformat() + "Z",
                "publishedAt": published
            }
            
            if dry_run:
                print("  -> [DRY RUN] Would save document:")
                print(f"     Cat: {cat_name}, Title(en): {translated_title.get('en', '')[:30]}...")
                added_count += 1
            else:
                db.collection('news_articles').add(article_doc)
                existing_urls.add(original_url)
                print("  -> Successfully added to Firestore!")
                added_count += 1
                
        except Exception as e:
            print(f"  -> [ERROR] Failed to process article: {str(e)}")
            error_count += 1

    print("=" * 60)
    print("📊 SCRAPE SUMMARY")
    print(f"Total Found: {len(entries)}")
    print(f"Added:       {added_count}")
    print(f"Skipped:     {skipped_count}")
    print(f"Errors:      {error_count}")
    print("=" * 60)

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Scrape Blogger site into Firestore")
    parser.add_argument("--dry-run", action="store_true", help="Fetch and process without saving to Firestore")
    args = parser.parse_args()
    
    run_scraper(dry_run=args.dry_run)
