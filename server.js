const express = require('express');
const axios = require('axios');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');

const app = express();
const port = 4000;

// Middleware
app.use(bodyParser.json());
app.use(cors());
app.use(express.static(path.join(__dirname, 'public')));

// MongoDB connection with Mongoose and authentication
const mongoURL = 'mongodb+srv://iska280601:SsiQkLXBbMuhxzaN@cluster1.yvdndxw.mongodb.net/apiDataDB';
mongoose.connect(mongoURL, { useNewUrlParser: true, useUnifiedTopology: true });

const db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', () => {
  console.log('Connected to Database');
});

// Define a schema and model for API data
const apiDataSchema = new mongoose.Schema({
  data1: mongoose.Schema.Types.Mixed,
  data2: mongoose.Schema.Types.Mixed,
  date: { type: Date, default: Date.now }
});

const ApiData = mongoose.model('ApiData', apiDataSchema);

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/fetch-and-save', async (req, res) => {
  const city = req.query.city;
  if (!city) {
    return res.status(400).json({ error: 'City name is required' });
  }

  try {
    // Keys are stored at .env file
    const weatherApiKey = '4917c12a51d4e7c71f02a04270311913';
    const newsApiKey = '76bf851a590e4982b536d95b46ade6aa';
    const weatherUrl = `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${weatherApiKey}`;
    const newsUrl = `https://newsapi.org/v2/everything?q=${city}&apiKey=${newsApiKey}`;

    // Call two web APIs
    const [response1, response2] = await Promise.all([
      axios.get(weatherUrl),
      axios.get(newsUrl)
    ]);

    const data1 = response1.data;
    let data2 = response2.data;

    // Filter news articles to include only those related to the city
    const filteredArticles = data2.articles.filter(article => {
      const titleIncludesCity = article.title.toLowerCase().includes(city.toLowerCase());
      const descriptionIncludesCity = article.description.toLowerCase().includes(city.toLowerCase());
      return titleIncludesCity || descriptionIncludesCity;
    });

    // Replace data2.articles with filteredArticles
    data2.articles = filteredArticles;

    // Save to MongoDB using Mongoose
    const apiData = new ApiData({ data1, data2 });
    await apiData.save();

    // Send response
    res.json({ data1, data2 });
  } catch (error) {
    console.error(error);
    res.status(500).send('An error occurred');
  }
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});