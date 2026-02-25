const Parser = require('rss-parser');

async function testRSS() {
    const parser = new Parser({
        customFields: {
            item: [
                ['media:content', 'media'],
                ['fullimage', 'fullimage'],
                ['description', 'description'],
                ['content:encoded', 'content']
            ]
        }
    });

    // Top News RSS feed from AajTak
    const feedUrl = 'https://feeds.feedburner.com/aajtak/national';

    console.log(`Fetching RSS from: ${feedUrl}`);
    try {
        const feed = await parser.parseURL(feedUrl);
        console.log(`Found ${feed.items.length} items.`);

        if (feed.items.length > 0) {
            const item = feed.items[0];
            console.log('\n--- FIRST ITEM ---');
            console.log('TITLE:', item.title);
            console.log('LINK:', item.link);
            console.log('PUB_DATE:', item.pubDate);
            console.log('IMAGE:', item.fullimage || (item.media ? item.media.$?.url : 'None'));
            console.log('DESCRIPTION LEN:', item.description?.length);
            console.log('CONTENT LEN:', item.content?.length);

            console.log('\n--- DESCRIPTION PREVIEW ---');
            console.log(item.description?.substring(0, 300));
        }
    } catch (e) {
        console.error('RSS Scrape failed:', e);
    }
}

testRSS();
