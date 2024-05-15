import express from 'express';
import cors from 'cors';
import fetch, { Headers } from 'node-fetch';
import { IncomingHttpHeaders } from 'http';

// expressが受け取ったリクエストヘッダーを
// prismへ送信するリクエストヘッダーの形に変換する
const convertHeaders = (headers: IncomingHttpHeaders): Headers => {
    const converted: Headers = new Headers();
    Object.keys(headers).forEach(key => {
        if (headers[key]) {
            converted.set(key as string, headers[key] as string);
        }
    });
    return converted;
};

// preferを使ってレスポンスデータの中身をexampleで指定する
const setExample = (headers: Headers, example: string) => {
    headers.set('prefer', 'example=' + example);
};

// preferを使ってレスポンスコードを指定する
const setCode = (headers: Headers, code: number) => {
    headers.set('prefer', 'code=' + code);
};

const baseURL = 'http://localhost:'
const expressPort = 22222;
const prismPort = 22221;
const expressURL = baseURL + expressPort;
const prismURL = baseURL + prismPort;
const mes = 'Express is listening on ' + expressURL;

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());
app.listen(expressPort, () => console.log(mes));

// 各urlで共通となる処理
// 個別処理はprocessに指定した関数内で行う
const commonProcess = async (
    req: express.Request,
    res: express.Response,
    url: string,
    process: (headers: Headers, body: any) => Headers
) => {
    const { headers: requestHeaders, body } = req;

    // リクエストの内容に応じてヘッダーを加工
    const headers: Headers = process(convertHeaders(requestHeaders), body);

    // prismに送り直してその結果を得る
    const response = await fetch(prismURL + url,
        { method: 'post', headers, body: JSON.stringify(body) });

    // prismからのレスポンスヘッダーを全てそのまま返す
    [...response.headers].forEach(h => {
        res.setHeader(h[0], h[1]);
    });

    // prismからのステータスコードもそのまま返す
    res.status(response.status);

    // prismからのレスポンスがjsonならばjsonで、それ以外ならtextで返す
    if (response.headers.get('content-type') === 'application/json') {
        const responseJson = await response.json();
        res.json(responseJson);
    } else {
        res.send(await response.text());
    }
    res.end();
};

// appやwebで、投稿や店舗詳細が閲覧される度に日時を記録
// この処理はレスポンスボディーを返さない。
// preferの「example=」ではレスポンスボディーしか変えられないので、
// 「code=」によってHTTPステータスコードを変えている。
// 成功は200、パラメータ不正は400、不明なエラーで500が返るので、
// ここではパラメータチェックのみ擬似的に実行している。
const urlImpressions = '/impressions';
const urlImpressionsProcess = (headers: Headers, body: any): Headers => {
    console.log(body);
    if ((body['uids'] === undefined) ||
        (body['uids'].length < 1) ||
        (body['subject'] === undefined) ||
        (body['media'] === undefined)) {
        setCode(headers, 400);
    }
    return headers;
}
app.post(urlImpressions,
    async (req: express.Request, res: express.Response) =>
        commonProcess(req, res, urlImpressions, urlImpressionsProcess));

// appやwebで、投稿や店舗詳細が閲覧された回数を取得
const urlImpressionsCount = '/impressions/count';
const urlImpressionsCountProcess = (headers: Headers, body: any): Headers => {
    console.log(body);
    if ((body['uids'] === undefined) ||
        (body['uids'].length < 1)) {
        setCode(headers, 400);
    } else {
        if ((body['uids'].length === 1) &&
            (body['uids'][0] === '999999999999999999_xxxxxxxxxxx200Post01') &&
            (body['bymedia'] === undefined)) {
            setExample(headers, 'FoodApiImpression200ByMediaNonePost');
        }
        if ((body['uids'].length === 2) &&
            (body['uids'][0] === '999999999999999999_xxxxxxxxxxx200Post01') &&
            (body['uids'][1] === '999999999999999999_xxxxxxxxxxx200Post02') &&
            (body['bymedia'] === undefined)) {
            setExample(headers, 'FoodApiImpression200ByMediaNonePostMultiple');
        }
        if ((body['uids'].length === 1) &&
            (body['uids'][0] === '999999999999999999_xxxxxxxxxxx200Post01') &&
            (body['bymedia'] === false)) {
            setExample(headers, 'FoodApiImpression200ByMediaFalsePost');
        }
        if ((body['uids'].length === 1) &&
            (body['uids'][0] === '999999999999999999_xxxxxxxxxxx200Post01') &&
            (body['bymedia'] === true)) {
            setExample(headers, 'FoodApiImpression200ByMediaTruePost');
        }
        if ((body['uids'].length === 1) &&
            (body['uids'][0] === 'xxxxxxxxxxxx200Biz01') &&
            (body['bymedia'] === undefined)) {
            setExample(headers, 'FoodApiImpression200ByMediaNoneBiz');
        }
        if ((body['uids'].length === 1) &&
            (body['uids'][0] === 'xxxxxxxxxxxx200Biz01') &&
            (body['bymedia'] === false)) {
            setExample(headers, 'FoodApiImpression200ByMediaFalseBiz');
        }
        if ((body['uids'].length === 1) &&
            (body['uids'][0] === 'xxxxxxxxxxxx200Biz01') &&
            (body['bymedia'] === true)) {
            setExample(headers, 'FoodApiImpression200ByMediaTrueBiz');
        }
    }
    return headers;
}
app.post(urlImpressionsCount,
    async (req: express.Request, res: express.Response) =>
        commonProcess(req, res, urlImpressionsCount, urlImpressionsCountProcess));