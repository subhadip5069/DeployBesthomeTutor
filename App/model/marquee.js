const mongoose = require("mongoose");

const marqueeSchema = new mongoose.Schema({
    message: { type: String, required: true },
    createdAt: { type: Date, default: Date.now },
});

const Marquee = mongoose.model("Marquee", marqueeSchema);
module.exports = Marquee;