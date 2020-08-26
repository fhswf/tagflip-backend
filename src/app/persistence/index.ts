import {createNamespace} from "cls-hooked";
import config from '../Config'
import * as path from "path";

export const TRANSACTION_NAMESPACE = "tagflip-transactions";
const namespace = createNamespace(TRANSACTION_NAMESPACE);

import { Sequelize as OriginSequelize } from 'sequelize';
import { Sequelize } from 'sequelize-typescript';
OriginSequelize.useCLS(namespace);

console.log("Adding models from path: " + path.join(__dirname, 'model'))
const sequelize = new Sequelize({
        repositoryMode: true,
        database: config.db.name,
        host: config.db.host,
        port: config.db.port,
        dialect: config.db.dialect,
        username: config.db.user,
        password: config.db.password,
        models: [path.join(__dirname, 'model')]
});


sequelize.transaction((t1): any => {
        console.log("Transaction-mapping check...")
        if(namespace.get('transaction') !== t1)
                throw new Error("CLS is not mapped to Sequelize!");
        console.log("Transaction-mapping checked.")
});


export {sequelize, namespace};

