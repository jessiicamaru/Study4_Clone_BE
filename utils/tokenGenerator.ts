import crypto from 'crypto';
import 'dotenv/config';
import { LevelTestInformation } from '../props/props';

const JWTSecretKey: string | undefined = process.env.JWT_SECRET_KEY;
const base64url = (str: string) => {
    return btoa(str).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
};
export const tokenGenerator = (payload: LevelTestInformation) => {
    const header = {
        alg: 'HS256',
        typ: 'JWT',
    };
    const encodedHeader = base64url(JSON.stringify(header));
    const encodedPayload = base64url(JSON.stringify(payload));
    const tokenData = `${encodedHeader}.${encodedPayload}`;
    if (JWTSecretKey) {
        const hmac = crypto.createHmac('sha256', JWTSecretKey);
        const signature = hmac.update(tokenData).digest('base64url');
        return `${tokenData}.${signature}`;
    }
};
