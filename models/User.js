const mongoose = require('mongoose');

const {Schema, model} = mongoose;


const UserSchema = new Schema({
    username: {type: String, required: true, min: 4, unique:true},
    password: {type: String, required: true},
});

const UserModel = model('User', UserSchema);

module.exports = UserModel;


//myx6Er8HSbySijm7  mongo-pass

// mongodb+srv://devadarsh:myx6Er8HSbySijm7@cluster0.udoup1h.mongodb.net/?retryWrites=true&w=majority