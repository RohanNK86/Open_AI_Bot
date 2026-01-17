const express = require('express');
const fs = require('fs')
const morgan = require('morgan');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const { resourceUsage } = require('process');
// const Data = JSON.parse(
//     fs.readFileSync('./data/user-data.json', 'utf-8')
// );
const cors = require('cors');
const userRouter = require('./routes/userRouter');
const globalErrorHandler = require('./controller/errorController');

const app = express();
app.use(cors());
app.use(express.json());
app.use(morgan('dev')); //prints in terminal which https method you used and with status code and time taken
app.use((req, res, next) => {
    req.requestTime = new Date().toISOString();
    next();
});


dotenv.config({ path : './.env'});
const DB = process.env.DATABASE_URL.replace('<PASSWORD>', process.env.DB_PASSWORD);

if (!DB) {
    console.error('DATABASE_URL is not defined. Please check your .env file.');
    process.exit(1);
}

mongoose.connect(DB)
    .then(() => console.log("Database Connected ✅"))
    .catch(err => {
        console.error("Database connection error: ❌", err);
        process.exit(1);
    });

//Router for the user authentication
app.use('/users', userRouter);

app.use(globalErrorHandler);

const port = process.env.PORT || 3002

app.listen(port, () => {
    console.log(`App running on Port ${port}`)
})
module.exports = app;


