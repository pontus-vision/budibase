"use strict";
// need to load environment first
// import { ExtendableContext } from "koa"
// import * as lambda from 'aws-lambda';
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.handler = void 0;
const serverless = require('aws-serverless-koa');
const awsServerlessKoaMiddleware = require('aws-serverless-koa/middleware');
const CouchDB = require("@budibase/server/dist/db");
const api = require("@budibase/server/dist/api");
const eventEmitter = require("@budibase/server/dist/events");
const automations = require("@budibase/server/dist/automations/index");
const fileSystem = require("@budibase/server/dist/utilities/fileSystem");
const bullboard = require("@budibase/server/dist/automations/bullboard");
const redis = require("@budibase/server/dist/utilities/redis");
// const {api,CouchDB,eventEmitter,automations,fileSystem, bullboard,redis} = require ('@budibase/server');
// import {api,CouchDB,eventEmitter,automations,fileSystem, bullboard,redis} from '@budibase/server'
// import {init as couchdbInit} from '@budibase/auth';
require("@budibase/auth").init(CouchDB);
const koa_1 = __importDefault(require("koa"));
// import destroyable from "server-destroy";
const koa_body_1 = __importDefault(require("koa-body"));
const koa_session_1 = __importDefault(require("koa-session"));
// const pino = require ("koa-pino-logger");
// import http from "http";
// import api from "../../server/src/api";
const { passport } = require("@budibase/auth").auth;
// const { workerApi, workerRedis } = require("@budibase/worker")
// const workerRedis = require("@budibase/worker/src/utilities/redis")
// const { workerApi,workerRedis } = require("@budibase/worker");
// import eventEmitter from "../../server/src/events";
// import * as automations from "../../server/src/automations/index";
// import Sentry from "@sentry/node";
// import {init as initfs} from "../../server/src/utilities/fileSystem";
// import * as bullboard from "../../server/src/automations/bullboard";
// import * as redis from "../../server/src/utilities/redis";
// import { AddressInfo } from "net";
const app = new koa_1.default();
app.use(awsServerlessKoaMiddleware());
// set up top level koa middleware
app.use((0, koa_body_1.default)({
    multipart: true,
    formLimit: "10mb",
    jsonLimit: "10mb",
    textLimit: "10mb",
    json: true,
    text: true,
    // enableTypes: ["json", "form", "text"],
    parsedMethods: ["POST", "PUT", "PATCH", "DELETE", "GET"],
}));
app.keys = ["secret", "key"];
// set up top level koa middleware
// app.use(koaBody({ multipart: true }))
app.use((0, koa_session_1.default)(app));
// authentication
app.use(passport.initialize());
app.use(passport.session());
// api routes
console.log('setting up server routes');
try {
    app.use(api.routes());
}
catch (e) {
    console.log(`got this error setting up workerAPI routes: ${e}`);
}
console.log('setting up worker routes');
// try {
//   app.use(workerApi.routes())
// }
// catch (e){
//   console.log (`got this error setting up workerAPI routes: ${e}`)
// }
// app.use(
//   pino({
//     prettyPrint: {
//       levelFirst: true,
//     },
//     level: env.LOG_LEVEL || "error",
//   })
// )
const plugin = bullboard.init();
app.use(plugin);
app.context.eventEmitter = eventEmitter;
app.context.auth = {};
// api routes
// app.use(api.routes())
// if (env.isProd()) {
//   env._set("NODE_ENV", "production")
//   // Sentry.init()
//   // app.on("error", (err: any, ctx: ExtendableContext) => {
//   //   Sentry.withScope(function (scope: any) {
//   //     scope.addEventProcessor(function (event: any) {
//   //       return Sentry.Handlers.parseRequest(event, ctx.request)
//   //     })
//   //     Sentry.captureException(err)
//   //   })
//   // })
// }
// module.exports.handler = serverless(app)
console.log('init filesystem');
fileSystem.init();
console.log('init redis');
redis.init();
console.log('init workerRedis');
// workerRedis.init()
console.log('init automations');
automations.init();
// export const handler =  serverless(app)
const PouchDB = require('pouchdb');
// const { call } = require('pouchdb-adapter-leveldb-core');
const aws_sdk_1 = require("aws-sdk");
// const CoreLevelPouch = require('pouchdb-adapter-leveldb-core')
const ExpressPouchDB = require('express-pouchdb');
const { create, simpleRequestHeaders } = require('corser');
const aws_serverless_express_1 = require("aws-serverless-express");
const pv_dynamodb_leveldown_1 = require("pv-dynamodb-leveldown");
const cors = () => {
    const corsMiddleware = create({
        methods: ['GET', 'HEAD', 'POST', 'PUT', 'DELETE', 'COPY'],
        supportsCredentials: true,
        requestHeaders: simpleRequestHeaders.concat(['Authorization', 'Origin', 'Referer'])
    });
    return (req, res, next) => {
        corsMiddleware(req, res, next);
    };
};
const DynamoDbOptions = {
    region: 'eu-west-2',
};
const dynamoDb = new aws_sdk_1.DynamoDB(DynamoDbOptions);
const dynamoDownFactory = pv_dynamodb_leveldown_1.DynamoDbDown.factory(dynamoDb);
const leveldownAdapter = (location) => {
    const dynamoDown = dynamoDownFactory(location);
    return dynamoDown;
};
const pdb = PouchDB;
const expressPouchDB = ExpressPouchDB(pdb.defaults({
    // db: DynamoDBDownFunc,
    db: leveldownAdapter,
    dynamodb: {}
}), {
    inMemoryConfig: true,
    mode: 'minimumForPouchDB'
    // mode: 'fullCouchDB'
});
// const app = express()
// app.use(cors())
app.use(expressPouchDB);
const server = (0, aws_serverless_express_1.createServer)(app.callback());
const handler = (event, context) => {
    console.log(`got event ${JSON.stringify(event)}`);
    return (0, aws_serverless_express_1.proxy)(server, event, context);
};
exports.handler = handler;
