/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_3085411453")

  // remove field
  collection.fields.removeById("json3760176746")

  // add field
  collection.fields.addAt(9, new Field({
    "hidden": false,
    "id": "file3760176746",
    "maxSelect": 1,
    "maxSize": 0,
    "mimeTypes": [],
    "name": "images",
    "presentable": false,
    "protected": false,
    "required": false,
    "system": false,
    "thumbs": [],
    "type": "file"
  }))

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_3085411453")

  // add field
  collection.fields.addAt(5, new Field({
    "hidden": false,
    "id": "json3760176746",
    "maxSize": 0,
    "name": "images",
    "presentable": false,
    "required": false,
    "system": false,
    "type": "json"
  }))

  // remove field
  collection.fields.removeById("file3760176746")

  return app.save(collection)
})
