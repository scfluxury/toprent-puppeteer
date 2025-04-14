const express = require('express');
const puppeteer = require('puppeteer');
process.env.PUPPETEER_EXECUTABLE_PATH = puppeteer.executablePath();
const bodyParser = require('body-parser');

const app = express();
app.use(bodyParser.json());

app.post('/toprent-auto', async (req, res) => {
  const { pickupCity, dropoffCity, pickupDate, dropoffDate, requestedKm, requestedModel, pickupTime, dropoffTime } = req.body;

  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  try {
    const page = await browser.newPage();
    await page.goto('https://cloud.toprent.app', { waitUntil: 'networkidle2' });

    await page.type('input[type="email"]', 'tommaso@scaffei.com');
    await page.type('input[type="password"]', 'Luxury23!');
    await Promise.all([
      page.click('button[type="submit"]'),
      page.waitForNavigation({ waitUntil: 'networkidle2' })
    ]);

    // Vai su calculator
    await page.goto('https://cloud.toprent.app/calculator', { waitUntil: 'networkidle2' });

    // Inserisci date e orari
    await page.waitForSelector('input[name="start_date"]');
    await page.evaluate(({ pickupDate, pickupTime }) => {
      document.querySelector('input[name="start_date"]').value = pickupDate;
      if (pickupTime) document.querySelector('input[name="start_time"]').value = pickupTime;
    }, { pickupDate, pickupTime });

    await page.evaluate(({ dropoffDate, dropoffTime }) => {
      document.querySelector('input[name="end_date"]').value = dropoffDate;
      if (dropoffTime) document.querySelector('input[name="end_time"]').value = dropoffTime;
    }, { dropoffDate, dropoffTime });

    // Mostra veicoli
    await Promise.all([
      page.click('button:has-text("Show all vehicles")'),
      page.waitForTimeout(2000)
    ]);

    await page.click('button:has-text("Select all availables")');
    await page.waitForTimeout(1000);

    // Delivery: riconsegna e consegna
    if (pickupCity && pickupCity.toLowerCase() !== 'milano') {
      await page.click('button:has-text("Add delivery")');
      await page.type('input[placeholder="Start"]', 'Milano');
      await page.type('input[placeholder="End"]', pickupCity);
    }

    if (dropoffCity && dropoffCity.toLowerCase() !== 'milano') {
      await page.click('button:has-text("Add delivery")');
      await page.type('input[placeholder="Start"]', dropoffCity);
      await page.type('input[placeholder="End"]', 'Milano');
    }

    // Conferma e copia risultato
    await page.click('button:has-text("Confirm")');
    await page.waitForTimeout(1000);
    await page.click('button:has-text("Copy result")');
    await page.waitForTimeout(1000);

    // Leggi risultato (clipboard virtuale → simuliamo come textarea)
    const result = await page.evaluate(() => {
      const textarea = document.querySelector('textarea') || document.querySelector('pre');
      return textarea ? textarea.innerText : 'Nessun risultato trovato.';
    });

    await browser.close();

    res.send({
      message: "✅ Preventivo completato",
      input: { pickupCity, dropoffCity, pickupDate, dropoffDate, requestedKm, requestedModel },
      result
    });

  } catch (error) {
    await browser.close();
    res.status(500).send({
      error: 'Errore durante il preventivo',
      details: error.message
    });
  }
});

app.listen(process.env.PORT || 3000, () => {
  console.log('✅ Server attivo su /toprent-auto');
});
