const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const helmet = require('helmet');
const PORT = 1347
const axios = require('axios')
const app = express();
const middlewares = require('./middlewares');
const fs = require('fs')

app.use(morgan('common'));
app.use(helmet());
app.use(cors({
	//origin: envVariables.REACT_APP_CORS_ORIGIN
}));



app.use(express.json());

app.get('/api/tickercount', async (req, res) => {
    let tickerFile = JSON.parse(fs.readFileSync('./return_List.json'))
	res.json({
		result: tickerFile
	})
});

app.use(middlewares.notFound);
app.use(middlewares.errorHandler);


const port = process.env.PORT || PORT;
app.listen(port, () => {
	console.log(`Listening at http://localhost:${port}`);
});