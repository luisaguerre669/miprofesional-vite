const mongoose = require("mongoose");

const PROMO_MAX = 700;

const promoSchema = new mongoose.Schema({
  key: { type: String, required: true, unique: true },
  count: { type: Number, default: 0 },
}, { timestamps: true });

const PromoCounter = mongoose.model("PromoCounter", promoSchema);

async function getRemainingSpots() {
  try {
    let doc = await PromoCounter.findOne({ key: "first_700" });
    if (!doc) {
      doc = await PromoCounter.create({ key: "first_700", count: 0 });
    }
    return Math.max(0, PROMO_MAX - doc.count);
  } catch {
    return 0;
  }
}

async function incrementPromo() {
  try {
    await PromoCounter.updateOne({ key: "first_700" }, { $inc: { count: 1 } }, { upsert: true });
  } catch {
    // best-effort
  }
}

async function getTrialDays() {
  const remaining = await getRemainingSpots();
  return remaining > 0 ? 60 : 30;
}

module.exports = PromoCounter;
module.exports.getRemainingSpots = getRemainingSpots;
module.exports.incrementPromo = incrementPromo;
module.exports.getTrialDays = getTrialDays;
