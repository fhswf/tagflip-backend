import { createNamespace } from "cls-hooked";
import * as path from "path";
import config from '../Config'


export const TRANSACTION_NAMESPACE = "tagflip-transactions";
const namespace = createNamespace(TRANSACTION_NAMESPACE);

import { Sequelize as OriginSequelize } from 'sequelize';
import { Sequelize } from 'sequelize-typescript';
OriginSequelize.useCLS(namespace);

console.log("Adding models from path: " + path.join(__dirname, 'model'))
const sequelize = new Sequelize({
        database: config.db.name,
        dialect: config.db.dialect,
        host: config.db.host,
        models: [path.join(__dirname, 'model')],
        password: config.db.password,
        port: config.db.port, repositoryMode: true,
        username: config.db.user
});


sequelize.transaction((t1): any => {
        console.log("Transaction-mapping check...")
        if (namespace.get('transaction') !== t1)
                throw new Error("CLS is not mapped to Sequelize!");
        console.log("Transaction-mapping checked.")
});


export { sequelize, namespace };

