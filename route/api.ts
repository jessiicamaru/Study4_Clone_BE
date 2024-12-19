import express from 'express';
import { getLevelTest, getScore } from '../controller/apiController';

const router = express.Router();

const initAPIRoute = (app: express.Express) => {
    router.get('/level-test', getLevelTest);
    router.post('/level-test/get-score', getScore);

    return app.use('/api/v1/', router);
};

export default initAPIRoute;
