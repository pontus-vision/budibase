// need to load environment first
// import { ExtendableContext } from "koa"
// import * as lambda from 'aws-lambda';

const serverless = require( 'aws-serverless-koa');
const  awsServerlessKoaMiddleware = require( 'aws-serverless-koa/middleware');
const CouchDB = require("@budibase/server/dist/db")
const api = require("@budibase/server/dist/api")
const eventEmitter = require("@budibase/server/dist/events")
const automations = require("@budibase/server/dist/automations/index")
const fileSystem = require("@budibase/server/dist/utilities/fileSystem")
const bullboard = require("@budibase/server/dist/automations/bullboard")
const redis = require("@budibase/server/dist/utilities/redis")
// const {api,CouchDB,eventEmitter,automations,fileSystem, bullboard,redis} = require ('@budibase/server');

// import {api,CouchDB,eventEmitter,automations,fileSystem, bullboard,redis} from '@budibase/server'

// import {init as couchdbInit} from '@budibase/auth';
require("@budibase/auth").init(CouchDB)
import Koa from "koa";
// import destroyable from "server-destroy";
import koaBody from "koa-body";
import koaSession from "koa-session";

// const pino = require ("koa-pino-logger");
// import http from "http";
// import api from "../../server/src/api";
const { passport } = require("@budibase/auth").auth

// const { workerApi, workerRedis } = require("@budibase/worker")

// const workerRedis = require("@budibase/worker/src/utilities/redis")
// const workerApi = require("@budibase/worker/src/api")

// const { workerApi,workerRedis } = require("@budibase/worker");
// import eventEmitter from "../../server/src/events";
// import * as automations from "../../server/src/automations/index";
// import Sentry from "@sentry/node";
// import {init as initfs} from "../../server/src/utilities/fileSystem";
// import * as bullboard from "../../server/src/automations/bullboard";
// import * as redis from "../../server/src/utilities/redis";
// import { AddressInfo } from "net";

const app = new Koa()

  app.use(awsServerlessKoaMiddleware());


// set up top level koa middleware
app.use(
  koaBody({
    multipart: true,
    formLimit: "10mb",
    jsonLimit: "10mb",
    textLimit: "10mb",
    json: true,
    text: true,

    
    // enableTypes: ["json", "form", "text"],
    parsedMethods: ["POST", "PUT", "PATCH", "DELETE", "GET"],
  })
)


// app.keys = ["secret", "key"]

// set up top level koa middleware
// app.use(koaBody({ multipart: true }))
// app.use(koaSession(app))

// // authentication
// app.use(passport.initialize())
// app.use(passport.session())
const plugin = bullboard.init()
app.use(plugin)

app.context.eventEmitter = eventEmitter
app.context.auth = {}

// api routes
console.log ('setting up server routes')
try{
  app.use(api.routes())
}
catch (e){
  console.log (`got this error setting up workerAPI routes: ${e}`)
}

console.log ('setting up worker routes')

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
console.log ('init filesystem')
fileSystem.init()

console.log ('init redis')
redis.init()

// console.log ('init workerRedis')
// workerRedis.init()

console.log ('init automations')
automations.init()

// export const handler =  serverless(app)
  

// const PouchDB = require ('pouchdb')

// const { call } = require('pouchdb-adapter-leveldb-core');
// import { DynamoDB } from 'aws-sdk';

// const CoreLevelPouch = require('pouchdb-adapter-leveldb-core')

// const ExpressPouchDB = require('express-pouchdb');

// const { create, simpleRequestHeaders } = require( 'corser');

import { createServer, proxy } from 'aws-serverless-express'

import * as lambda from 'aws-lambda';

// import {DynamoDbDown} from 'pv-dynamodb-leveldown'

// export interface DynamoDBDownFactory {
//   (location:string):DynamoDbDown

// }


// const cors = () => {
//   const corsMiddleware = create({
//     methods: ['GET', 'HEAD', 'POST', 'PUT', 'DELETE', 'COPY'],
//     supportsCredentials: true,
//     requestHeaders: simpleRequestHeaders.concat(['Authorization', 'Origin', 'Referer'])
//   })

//   return  (req: any, res: any, next: any) => {
//     corsMiddleware(req, res, next)
//   };
// }


// const DynamoDbOptions: DynamoDB.ClientConfiguration = {
//   region: 'eu-west-2',
// };

// const dynamoDb = new DynamoDB(DynamoDbOptions);
// const dynamoDownFactory = DynamoDbDown.factory(dynamoDb);

// const leveldownAdapter = (location: string) => {
//   const dynamoDown = dynamoDownFactory(location);
//   return dynamoDown;
// };

// const pdb = PouchDB 

// const expressPouchDB = ExpressPouchDB(pdb.defaults({
//   // db: DynamoDBDownFunc,
//   db: leveldownAdapter,
//   dynamodb: { }

// }), {
//   inMemoryConfig: true,
//   mode: 'minimumForPouchDB'
//   // mode: 'fullCouchDB'
// })

// const app = express()

// app.use(cors())
// app.use(expressPouchDB)

const server = createServer(app.callback())

export const  handler = async (event: lambda.APIGatewayProxyEvent, context: lambda.Context) => { 
  console.log (`got request ${JSON.stringify(event)}`)

  event.path = event.path.replace('/app/','/')
  console.log (`event path after cleanup: ${event.path}`)

  const headers: Record<string,any>  = {... event.headers}

  event.headers['accept-encoding'] = 'identity'
  event.multiValueHeaders['accept-encoding'] = ['identity']

  const resp = await proxy(server, event, context, 'PROMISE').promise


  const logResp = {
    headers: resp.headers, 
    statusCode: resp.statusCode, 
    body: Buffer.from(resp.body).toString('base64'),
    isBase64Encoded: true
  };

  console.log (`got reply ${resp.statusCode} ${JSON.stringify(logResp.headers)}`)

  return logResp

}





