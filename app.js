const express = require('express')
const app = express()
const fs = require('fs');
const axios = require('axios');
const cheerio = require('cheerio');
const URL = 'https://www.footarchives.com/';
const PORT = process.env.PORT || 5000;

async function fetchMatchSource(match) {
  let response = await axios.get(match['link']);
  let urls = [];
  const html = response.data;
  const $ = cheerio.load(html);
  $('.postEntry iframe').each((index, element) => {
    const s = $(element).attr('src');
    urls.push(s);
  });
  const src = { one: urls[0], tow: urls[1], ...match };
  console.log(src);
  return src;
}
async function scrape() {
  try {
    let response = await axios.get(URL);
    const html = response.data;
    const $ = cheerio.load(html);
    const blogPosts = [];
    $('.blogPosts article').each((index, element) => {
      const postThumbnail = $(element).find('.postThumbnail img').attr('data-src');
      const postTitle = $(element).find('.postTitle a[data-text]').attr('data-text');
      const postLink = $(element).find('.postTitle a[href]').attr('href');

      const post = {
        thumbnail: postThumbnail,
        title: postTitle,
        link: postLink
      };

      blogPosts.push(post);
    });
    let array = [];
    for (let i = 0; i < blogPosts.length; i++) {
      const match = blogPosts[i];
      const updatedMatch = await fetchMatchSource(match);
      array.push(updatedMatch);
    }
    console.log(array);
    arr = array
    return array;
  } catch (error) {
    console.log(error);
    throw error;
  }
}

async function run() {
  try {
    const array = await scrape();
    fs.writeFile('football.json', JSON.stringify(array), 'utf8', (err) => {
      if (err) {
        console.log('error in write');
      } else {
        console.log('done');
      }
    });
  } catch (error) {
    console.log(error);
  }
}


app.get('/run-update-data', async (req, res)=> {
  run()
  res.json({message: 'run is inprogress'})
})

app.get('/api/matches', (req, res) => {
  fs.readFile('football.json', 'utf8', (err, data) => {
    if (err) {
      console.log('error in read');
      res.status(500).json({ message: 'Internal server error' });
    } else {
      const jsonData = JSON.parse(data);
      res.json(jsonData);
    }
  });
});

app.listen(PORT, ()=> {
  console.log(`run on ${PORT}`)
})


