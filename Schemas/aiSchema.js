const { model, Schema } = require('mongoose');

const aiConfig = new Schema({
    guildId: {
        type: String,
        required: true,
    },
    channelId: {
        type: String,
        required: true,
    },
    blacklists: {
        type: [String],
        required: false
    }
});

module.exports = model("aiConfig", aiConfig);