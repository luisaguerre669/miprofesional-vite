const express = require('express');
const { geocodeAddress, reverseGeocode } = require('../utils/geocode');
const logger = require('../utils/logger');

const router = express.Router();

router.get('/search', async (req, res) => {
  try {
    const { q, city, state, country } = req.query;
    if (!q && !city) {
      return res.status(400).json({ success: false, message: 'Query parameter "q" or "city" required' });
    }
    const result = await geocodeAddress({
      address: q || '',
      city: city || q || '',
      state: state || '',
      country: country || 'Argentina'
    });
    if (!result) {
      return res.json({ success: true, data: null, message: 'No se encontraron resultados' });
    }
    res.json({ success: true, data: result });
  } catch (err) {
    logger.error('Geocode search error:', err);
    res.status(500).json({ success: false, message: 'Error al geocodificar' });
  }
});

router.get('/reverse', async (req, res) => {
  try {
    const { lat, lng } = req.query;
    if (!lat || !lng) {
      return res.status(400).json({ success: false, message: 'lat and lng query params required' });
    }
    const latitude = parseFloat(lat);
    const longitude = parseFloat(lng);
    if (isNaN(latitude) || isNaN(longitude)) {
      return res.status(400).json({ success: false, message: 'Invalid lat/lng values' });
    }
    const result = await reverseGeocode({ latitude, longitude });
    if (!result) {
      return res.json({ success: true, data: null, message: 'No se pudo resolver la dirección' });
    }
    res.json({ success: true, data: result });
  } catch (err) {
    logger.error('Reverse geocode error:', err);
    res.status(500).json({ success: false, message: 'Error al resolver dirección' });
  }
});

module.exports = router;
