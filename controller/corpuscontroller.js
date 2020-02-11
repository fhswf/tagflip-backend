let {corpus} = require('../persitence/sql/corpus');
let baseController = require('./basecontroller');

function listAll() {
    return baseController.listAll()(corpus);
}

function get(id) {
    return baseController.get(id)(corpus);
}

function create(item) {
    let findOrCreateOptions = {
        where: {
            description: item.description,
            name: item.name
        }
    };
    return baseController.create(item)(corpus, findOrCreateOptions);
}

function del(id) {
    return baseController.del(id)(corpus, 'c_id');
}

function update(id, item) {
    return baseController.update(id, item)(corpus, 'c_id');
}


module.exports = {
    listAll: listAll,
    getOne: get,
    updateOne: update,
    deleteOne: del,
    createOne: create
};
