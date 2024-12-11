const mongoose= require("mongoose");
const connect= mongoose.connect("mongodb+srv://Faysal:1234@cluster1.ujvwf.mongodb.net/")

connect.then(() => {
    console.log("Database connected successfully.");
})
.catch(() => {
    console.log("Database can not connect.");
});

const loginschema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    department: {
        type: String,
        required: true
    },
    intake: {
        type: Number, // Integer field
        required: true
    },
    section: {
        type: Number, // Integer field
        required: true
    },
    email: {
        type: String,
        required: true,
        unique: true, // Ensure the email is unique
        match: [/^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/, 'Please enter a valid email address'] // Email format validation
    },
    phone: {
        type: String,
        required: true,
        match: [/^\d{10}$/, 'Please enter a valid phone number'] // Validates a 10-digit phone number
    },
    password: {
        type: String,
        required: true
    }
});


const collection= new mongoose.model("UserInfo", loginschema);
module.exports= collection;
