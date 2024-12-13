import express from 'express';

const app = express();
const port = 4000;

app.get('/', (req, res) => {
    res.send('Hello Study4');
});

app.listen(port, () => {
    console.log(`Example app listening on http://localhost:${port}/`);
});
