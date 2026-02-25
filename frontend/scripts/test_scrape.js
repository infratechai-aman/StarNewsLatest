const cheerio = require('cheerio');

async function testArticleScrape() {
    try {
        const url = 'https://starnewsindia.in/no-time-limit-for-governors-no-endless-delay-supreme-courts-presidential-reference-opinion-explained-india-news/';
        console.log("Fetching:", url);
        const response = await fetch(url);
        const html = await response.text();
        const $ = cheerio.load(html);

        const title = $('h1').first().text().trim();
        const mainImage = $('meta[property="og:image"]').attr('content') || $('img').first().attr('src');

        // Let's grab category from breadcrumbs or meta tags
        let category = 'National'; // Default
        const metaCat = $('meta[property="article:section"]').attr('content');
        if (metaCat) category = metaCat;

        // Content. Usually in an article tag or a div with class like entry-content
        let contentHtml = $('.entry-content').html() || $('article').html() || '';

        console.log("--- RESULTS ---");
        console.log("Title:", title);
        console.log("Image:", mainImage);
        console.log("Category:", category);
        console.log("Content Length:", contentHtml.length);
        console.log("Content Snippet:", contentHtml.substring(0, 150));

    } catch (e) {
        console.error(e);
    }
}

testArticleScrape();
