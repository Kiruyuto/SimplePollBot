const { DateTime } = require('luxon');
const { default: mongoose } = require('mongoose');

const pollSchema = mongoose.Schema(
  {
    pollName: { type: String, required: true },
    messageId: {
      type: String,
      required: true,
      unique: true,
      default: 'NONE',
    },
    lastWednesdayUnix: {
      type: Number,
      required: true,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Poll', pollSchema);
