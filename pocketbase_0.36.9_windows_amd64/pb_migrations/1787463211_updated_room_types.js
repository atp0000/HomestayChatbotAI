/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_3980138507")

  // add field
  collection.fields.addAt(7, new Field({
    "hidden": false,
    "id": "json3950007415",
    "maxSize": 0,
    "name": "amenities",
    "presentable": false,
    "required": false,
    "system": false,
    "type": "json"
  }))

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_3980138507")

  // remove field
  collection.fields.removeById("json3950007415")

  return app.save(collection)
})
