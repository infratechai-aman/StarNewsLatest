const puppeteer = require('puppeteer');
const cheerio = require('cheerio');

async function scrapeWithPuppeteer() {
    console.log('Launching browser...');
    const browser = await puppeteer.launch({
        headless: 'new',
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();

    // Set a normal looking user agent
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36');
    await page.setViewport({ width: 1280, height: 800 });

    const url = 'https://www.aajtak.in/national/story/no-time-limit-for-governors-no-endless-delay-supreme-courts-presidential-reference-opinion-explained-india-news-ntc-2466723-2026-02-13';
    console.log('Navigating to:', url);

    try {
        await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });

        // Wait just a moment for potential JS frameworks to settle
        await new Promise(r => setTimeout(r, 2000));

        const html = await page.content();
        const $ = cheerio.load(html);

        const title = $('h1').text().trim() || $('meta[property="og:title"]').attr('content');
        console.log('\n--- EXTRACTED TITLE ---');
        console.log(title);

        $('script, style, nav, header, footer, .ad-section, .social-share, .also-read').remove();

        let contentHtml = '';
        $('.story-details p').each((_, p) => {
            const text = $(p).text().trim();
            if (text.length > 20 && !text.includes('ये भी पढ़ें') && !text.includes('Related')) {
                contentHtml += `<p>${$(p).html()}</p>\n`;
            }
        });

        console.log('\n--- EXTRACTED CONTENT LENGTH ---');
        console.log(contentHtml.length);
        console.log('\n--- CONTENT PREVIEW ---');
        console.log(contentHtml.substring(0, 300));

    } catch (e) {
        console.error('Scrape failed:', e);
    } finally {
        await browser.close();
    }
}

scrapeWithPuppeteer();
