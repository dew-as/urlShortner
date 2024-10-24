const mongoose = require('mongoose');
const mongoosePaginate = require('mongoose-paginate-v2');


const urlSchema = new mongoose.Schema({
  email: {
    type: String,
    required: [true, 'Email field is required'],
  },
  url: {
    type: String,
    unique: [true, 'Url already exists'],
    required: true
  },
  title: {
    type: String,
    unique: [true, 'Title already exists'],
    required: true
  },
  shortUrl: {
    type : String,
    unique: [true, 'URL already exists'],
    required: true
  },
  submittedAt: {
    type: Date,
    default: Date.now
  }
});

urlSchema.plugin(mongoosePaginate);
const Url = mongoose.model('Url', urlSchema);

module.exports = Url;