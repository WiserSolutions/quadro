module.exports = class {
  constructor(mongo, model) {
    this.client = mongo
  }

  get(collection, id) {
    return this.client.collection(collection).findOne({ _id: id })
  }

  async create(collection, manyInsert) {
    await this.client.collection(collection).insertMany(manyInsert)
    let ids = []
    for (var attrs of manyInsert) ids.push({ id: attrs._id })
    return ids
  }

  update(collection, query, attrs) {
    return this.client.collection(collection).updateOne({ _id: query }, {
      $set: attrs
    })
  }

  find(collection, query) {
    return this.client.collection(collection).find(query).toArray()
  }

  count(collection, query) {
    return this.client.collection(collection).find(query).count()
  }

  delete(collection, id) {
    return this.client.collection(collection).deleteOne({ _id: id })
  }

  deleteAll(collection, query) {
    return this.client.collection(collection).deleteMany(query)
  }
}
