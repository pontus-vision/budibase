// need to load environment first
// import { ExtendableContext } from "koa"
// import * as lambda from 'aws-lambda';
process.env['AWS_REGION']=process.env.PV_AWS_REGION||'eu-west-2'

const serverless = require( 'aws-serverless-koa');
const  awsServerlessKoaMiddleware = require( 'aws-serverless-koa/middleware');
const CouchDB = require("@budibase/worker/src/db")
const redis = require("@budibase/worker/src/utilities/redis")
const api = require("@budibase/worker/src/api")

require("@budibase/backend-core").init(CouchDB)
import Koa from "koa";
// import destroyable from "server-destroy";
import koaBody from "koa-body";
import koaSession from "koa-session";

// const pino = require ("koa-pino-logger");
// import http from "http";
// import api from "../../server/src/api";
const { passport } = require("@budibase/backend-core").auth

// const { workerApi, workerRedis } = require("@budibase/worker")

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
    parsedMethods: ["POST", "PUT", "PATCH", "DELETE" ],
  })
)


app.keys = ["secret", "key"]

// set up top level koa middleware
// app.use(koaBody({ multipart: true }))
app.use(koaSession(app))

// authentication
app.use(passport.initialize())
app.use(passport.session())


console.log ('setting up worker routes')

try {
  app.use(api.routes())
}
catch (e){
  console.log (`got this error setting up workerAPI routes: ${e}`)
}

// app.use(
//   pino({
//     prettyPrint: {
//       levelFirst: true,
//     },
//     level: env.LOG_LEVEL || "error",
//   })
// )



app.context.auth = {}

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


console.log ('init redis')
redis.init()

console.log ('after init redis')


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
console.log ('before createServer()')

const server = createServer(app.callback())

export const  handler = async (event: lambda.APIGatewayProxyEvent, context: lambda.Context) => { 
  console.log (`got request ${JSON.stringify(event)}`)

  event.path = event.path.replace('/worker', '');
  console.log (`event path after cleanup: ${event.path}`)

  // const headers: Record<string,any>  = {... event.headers}

  event.headers['accept-encoding'] = 'identity'
  event.multiValueHeaders['accept-encoding'] = ['identity']

  const resp = await proxy(server, event, context, 'PROMISE').promise


  const logResp = {
    headers: resp.headers, 
    statusCode: resp.statusCode, 
    body: Buffer.from(resp.body).toString('base64'),
    isBase64Encoded: true
  };

  console.log (`got reply ${resp.statusCode} ${event.path} ${JSON.stringify(logResp.headers)}`)

  return logResp

}





