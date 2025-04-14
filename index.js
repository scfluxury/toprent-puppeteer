const express = require('express');
const chromium = require('chrome-aws-lambda');
const puppeteer = require('puppeteer-core');
const bodyParser = require('body-parser');

const app = express();
app.use(bodyParser.json());

app.post('/toprent-auto', async (req, res) => {
  const {
    pickupCity,
    dropoffCity,
    pickupDate,
    dropoffDate,
    pickupTime,
    dropoffTime,
    requestedKm,
    requestedModel
  } = req.body;

  const browser = await puppeteer.launch({
    args: chromium.args,
    executablePath: await chromium.executablePath,
    headless: chromium.headless,
    defaultViewport: chromium.defaultViewport
  });

  try {
    const page = await browser.newPage();

    // LOGIN
    await page.goto('https://cloud.toprent.app', { waitUntil: 'networkidle2' });
    await page.type('input[type="email"]', 'tommaso@scaffei.com');
    await page.type('input[type="password"]', 'Luxury23!');
    await Promise.all([
      page.click('button[type="submit"]'),
      page.waitForNavigation({ waitUntil: 'networkidle2' })
    ]);

    // Vai al calculator
    await page.goto('https://cloud.toprent.app/calculator', { waitUntil: 'networkidle2' });
    await page.waitForSelector('input[name="start_date"]');

    await page.evaluate(({ pickupDate, pickupTime, dropoffDate, dropoffTime }) => {
      document.querySelector('input[name="start_date"]').value = pickupDate;
      if (pickupTime) document.querySelector('input[name="start_time"]').value = pickupTime;
      document.querySelector('input[name="end_date"]').value = dropoffDate;
      if (dropoffTime) document.querySelector('input[name="end_time"]').value = dropoffTime;
    }, { pickupDate, pickupTime, dropoffDate, dropoffTime });

    await page.click('button:has-text("Show all vehicles")').catch(() => {});
    await page.waitForTimeout(1500);
    await page.click('button:has-text("Select all availables")').catch(() => {});
    await page.waitForTimeout(1000);

    if (pickupCity && pickupCity.toLowerCase() !== 'milano') {
      await page.click('button:has-text("Add delivery")').catch(() => {});
      await page.type('input[placeholder="Start"]', 'Milano');
      await page.type('input[placeholder="End"]', pickupCity);
    }

    if (dropoffCity && dropoffCity.toLowerCase() !== 'milano') {
      await page.click('button:has-text("Add delivery")').catch(() => {});
      await page.type('input[placeholder="Start"]', dropoffCity);
      await page.type('input[placeholder="End"]', 'Milano');
    }

    await page.click('button:has-text("Confirm")').catch(() => {});
    await page.waitForTimeout(1000);

    await page.click('button:has-text("Calculate")').catch(() => {});
    await page.waitForTimeout(1500);

    if (requestedKm) {
      await page.evaluate((km) => {
        const kmInput = document.querySelector('input[placeholder="Included km"]');
        if (kmInput) kmInput.value = km;
      }, requestedKm);
    }

    await page.click('button:has-text("Copy result")').catch(() => {});
    await page.waitForTimeout(1000);

    const result = await page.evaluate(() => {
      const el = document.querySelector('textarea') || document.querySelector('pre');
      return el ? el.innerText : '❌ Nessun risultato disponibile';
    });

    await browser.close();

    res.send({
      message: "✅ Preventivo completato",
      parsedInput: {
        pickupCity,
        dropoffCity,
        pickupDate,
        dropoffDate,
        pickupTime,
        dropoffTime,
        requestedKm,
        requestedModel
      },
      preventivo: result
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
