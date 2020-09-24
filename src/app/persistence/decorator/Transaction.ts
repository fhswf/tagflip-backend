import {sequelize, namespace} from "../index";

export const BeginTransaction = <T>(
    target: any,
    propertyKey: string,
    descriptor: TypedPropertyDescriptor<any>
) => {
    let method = descriptor.value;
    descriptor.value = function () {
        return sequelize.transaction(async (t) => {
            console.log("New transaction.")
            if (namespace.get('transaction') !== t) {
                throw Error("Transaction in namespace and current Transaction do not match!")
            }

            return method.apply(this, arguments);
        }).then(res => {
            console.log("Transaction committed.")
            return res;
        }).catch((err) => {
            console.log("Transaction rolled back!", err)
            throw err;
        });
    }
}

export const RequireTransaction = <T>(
    target: any,
    propertyKey: string,
    descriptor: TypedPropertyDescriptor<any>
) => {
    let method = descriptor.value;
    descriptor.value = function () {
        if (!namespace.get('transaction')) {
            throw Error("Transaction required!")
        }
        return method.apply(this, arguments);
    }
}
