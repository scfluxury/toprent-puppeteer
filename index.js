const express = require('express');
const puppeteer = require('puppeteer');
const bodyParser = require('body-parser');

const app = express();
app.use(bodyParser.json());

app.post('/toprent-auto', async (req, res) => {
  const { pickupCity, dropoffCity, pickupDate, dropoffDate, requestedKm, requestedModel } = req.body;

  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  try {
    const page = await browser.newPage();

    await page.goto('https://cloud.toprent.app/', { waitUntil: 'networkidle2' });

    await page.type('input[type="email"]', 'tommaso@scaffei.com');
    await page.type('input[type="password"]', 'Luxury23!');

    await Promise.all([
      page.click('button[type="submit"]'),
      page.waitForNavigation({ waitUntil: 'networkidle2' })
    ]);

    await page.goto('https://cloud.toprent.app/vehicles', { waitUntil: 'networkidle2' });

    await page.screenshot({ path: 'logged_in.png' });

    await browser.close();

    res.send({
      message: "✅ Login effettuato",
      parsedInput: {
        pickupCity,
        dropoffCity,
        pickupDate,
        dropoffDate,
        requestedKm,
        requestedModel
      }
    });
  } catch (err) {
    await browser.close();
    res.status(500).send({
      error: 'Errore durante il login o scraping',
      details: err.message
    });
  }
});

app.listen(process.env.PORT || 3000, () => {
  console.log('✅ Server attivo su /toprent-auto');
});
