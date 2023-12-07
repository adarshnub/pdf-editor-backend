const mongoose =  require('mongoose');
const {Schema,model} = mongoose;
const UserModel = require('./User');

const PdfSchema = new Schema({
    fileName : String,
    fileData : Buffer,
    userId:{type:Schema.Types.ObjectId, ref:'User'},
});

const PdfModel = model('Pdf',PdfSchema);

module.exports =  PdfModel;