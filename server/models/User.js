const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    education: {
      type: String,
      required: true,
    },

    skills: {
      type: String,
      required: true,
    },

    interests: {
      type: String,
      required: true,
    },

    targetCareer: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

const User = mongoose.model("User", userSchema);

module.exports = User;
