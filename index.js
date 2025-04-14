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

    // Vai alla pagina di login TopRent
    await page.goto('https://cloud.toprent.app/', { waitUntil: 'networkidle2' });

    // Compila login
    await page.type('input[type="email"]', 'tommaso@scaffei.com');
    await page.type('input[type="password"]', 'Luxury23!');

    await Promise.all([
      page.click('button[type="submit"]'),
      page.waitForNavigation({ waitUntil: 'networkidle2' })
    ]);

    // Vai a una sezione del gestionale (puoi cambiarla)
    await page.goto('https://cloud.toprent.app/vehicles', { waitUntil: 'networkidle2' });

    // Screenshot (debug)
    await page.screenshot({ path: 'logged_in.png' });

    // Output di prova
    res.send({
      message: "✅ Login effettuato con successo su cloud.toprent.app",
      parsedInput: {
        pickupCity,
        dropoffCity,
        pickupDate,
        dropoffDate,
        requestedKm,
        requestedModel
      }
    });

    await browser.close();
  } catch (err) {
    await browser.close();
    res.status(500).send({
      error: 'Errore durante scraping',
      details: err.message
    });
  }
});

app.listen(process.env.PORT || 3000, () => {
  console.log('✅ Server attivo su /toprent-auto');
});
