import express from 'express';
import { getLevelTest } from '../controller/apiController';

const router = express.Router();

const initAPIRoute = (app: express.Express) => {
    router.get('/level-test', getLevelTest);

    return app.use('/api/v1/', router);
};

export default initAPIRoute;
