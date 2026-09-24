const mongoose = require("mongoose");

const roadmapSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    roadmap: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

const Roadmap = mongoose.model(
  "Roadmap",
  roadmapSchema
);

module.exports = Roadmap;
