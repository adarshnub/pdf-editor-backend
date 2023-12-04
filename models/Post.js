const mongoose =  require('mongoose');
const {Schema,model} = mongoose;

const PostSchema = new Schema({
    cover : String,
    author:{type:Schema.Types.ObjectId, ref:'User'},
});

const PostModel = model('Post',PostSchema);

module.exports =  PostModel;