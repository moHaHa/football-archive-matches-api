
const express = require('express')
const app = express()
const fs = require('fs');
const axios = require('axios');
const cheerio = require('cheerio');
const mysql = require('mysql');
const URL = 'https://www.footarchives.com/';
const PORT = process.env.PORT || 5000;


app.use(express.json());

// Database connection configuration
const dbConn = mysql.createConnection({
  host: '92.205.4.117',
  user: 'f_api',
  password: 'PASSword.f.1',
  database: 'f_api'
});


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
async function update() {
  try {
    const array = await scrape();
    dbConn.connect(function (err) {
      if (err) throw err;
      console.log("Connected!");
      const updatedJsonString = JSON.stringify(array)
      const idToUpdate = 2
      const sql = 'UPDATE json_data SET data = ? WHERE id = ?';
      dbConn.query(sql, [updatedJsonString, idToUpdate], function (err, result) {
        if (err) throw err;
        console.log("Result: " + result);
        res.json({ data: result })
      });
    });
  } catch (error) {
    console.log(error);
  }
}


app.get('/api/update', async (req, res) => {
  update()
  res.json({ message: 'run is inprogress' })
})

app.get('/api/matches', (req, res) => {
  dbConn.connect(function (err) {
    if (err) throw err;
    console.log("Connected!");
    sql = 'SELECT * FROM json_data WHERE id = 2'
    dbConn.query(sql, function (err, result) {
      if (err) throw err;
      console.log("Result: " + result);
      res.json({ data: result })
    });
  });
});

app.listen(PORT, () => {
  console.log(`run on ${PORT}`)
})


