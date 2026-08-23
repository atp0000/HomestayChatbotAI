/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_3980138507")

  // add field
  collection.fields.addAt(8, new Field({
    "hidden": false,
    "id": "json2308610364",
    "maxSize": 0,
    "name": "rules",
    "presentable": false,
    "required": false,
    "system": false,
    "type": "json"
  }))

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_3980138507")

  // remove field
  collection.fields.removeById("json2308610364")

  return app.save(collection)
})
