async function testApi() {
    try {
        const res = await fetch('http://localhost:3000/api/news');
        const data = await res.json();
        console.log('Total articles count in response:', data.total);
        console.log('Articles received:', data.articles.length);
        if (data.articles.length > 0) {
            console.log('First article title:', JSON.stringify(data.articles[0].title));
            console.log('First article content type:', typeof data.articles[0].content);
        }
    } catch (e) {
        console.error('API call failed. Is the server running?', e.message);
    }
}
testApi();
