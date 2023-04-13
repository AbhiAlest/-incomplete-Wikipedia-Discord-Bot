const Discord = require('discord.js');
const fetch = require('node-fetch');
const cheerio = require('cheerio');
const client = new Discord.Client();

const WIKI_API_URL = 'https://en.wikipedia.org/w/api.php';

// see api parameters above
const SEARCH_PARAMS = {
    action: 'query',
    list: 'search',
    format: 'json',
    srprop: 'snippet',
    srsearch: 'fun fact',
    utf8: 1,
    srlimit: 500,
};

const PAGE_PARAMS = {
    action: 'parse',
    format: 'json',
    prop: 'text',
    utf8: 1,
    redirects: 1,
};

// Wikipedia API's articles
const getArticles = async () => {
    const res = await fetch(`${WIKI_API_URL}?${new URLSearchParams(SEARCH_PARAMS)}`);
    const data = await res.json();
    return data.query.search.map((article) => article.title);
};

const getPageText = async (title) => {
    PAGE_PARAMS.page = title;
    const res = await fetch(`${WIKI_API_URL}?${new URLSearchParams(PAGE_PARAMS)}`);
    const data = await res.json();
    return data.parse.text['*'];
};

// random facts
const getFunFacts = (pageText) => {
    const $ = cheerio.load(pageText);
    const factList = [];
    $('ul').each((_, ul) => {
        $(ul)
            .find('li')
            .each((_, li) => {
                if (li.firstChild && li.firstChild.data.startsWith('In ')) {
                    return;
                }
                factList.push($(li).text().trim());
            });
    });
    return factList;
};

// push data to discord server every ~20 minutes
const factLoop = async () => {
    while (true) {
        const articles = await getArticles();
        const facts = [];
        for (const article of articles) {
            const pageText = await getPageText(article);
            facts.push(...getFunFacts(pageText));
        }
        const channel = client.channels.cache.get('DISCORD_CHANNEL_ID'); 
        const fact = facts[Math.floor(Math.random() * facts.length)];
        channel.send(fact);
        await new Promise((resolve) => setTimeout(resolve, 1200000)); 
    }
};

client.on('ready', () => {
    console.log(`Logged in as ${client.user.tag}!`);
    factLoop();
});

client.login('YOUR_DISCORD_BOT_TOKEN'); 
