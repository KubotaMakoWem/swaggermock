import express from 'express';
import cors from 'cors';
import fetch, { Headers } from 'node-fetch';
import { IncomingHttpHeaders } from 'http';

const convertHeaders = (headers: IncomingHttpHeaders): Headers => {
    const converted: Headers = new Headers();
    Object.keys(headers).forEach(key => {
        if (headers[key]) {
            converted.set(key as string, headers[key] as string);
        }
    });
    return converted;
};

const setExample = (headers: Headers, example: string) => {
    headers.set('prefer', 'example=' + example);
};

const baseURL = 'http://localhost:'
const expressPort = 4011;
const prismPort = 4010;
const expressURL = baseURL + expressPort;
const prismURL = baseURL + prismPort;
const mes = 'Express is listening on ' + expressURL;

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());
app.listen(expressPort, () => console.log(mes));

const sampleApi = '/sampleApi';
app.post(sampleApi,
    async (req: express.Request, res: express.Response) => {
        const { headers: requestHeaders, body } = req;
        const headers: Headers = convertHeaders(requestHeaders);
        if (body['mode'] === 'modeA') {
            setExample(headers, 'modeA');
        }
        if (body['mode'] === 'modeB') {
            setExample(headers, 'modeB');
        }
        if (body['mode'] === 'modeC') {
            setExample(headers, 'modeC');
        }
        console.log(body);
        const response = await fetch(prismURL + sampleApi,
            { method: 'post', headers, body: JSON.stringify(body) });
        res.json(await response.json());
        res.end();
    });