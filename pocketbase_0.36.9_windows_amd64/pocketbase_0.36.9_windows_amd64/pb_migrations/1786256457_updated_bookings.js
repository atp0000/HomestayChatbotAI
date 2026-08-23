/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_986407980")

  // update field
  collection.fields.addAt(20, new Field({
    "cascadeDelete": false,
    "collectionId": "pbc_3085411453",
    "hidden": false,
    "id": "relation2563390273",
    "maxSelect": 1,
    "minSelect": 0,
    "name": "roomCode",
    "presentable": true,
    "required": false,
    "system": false,
    "type": "relation"
  }))

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_986407980")

  // update field
  collection.fields.addAt(20, new Field({
    "cascadeDelete": false,
    "collectionId": "pbc_3085411453",
    "hidden": false,
    "id": "relation2563390273",
    "maxSelect": 1,
    "minSelect": 0,
    "name": "roomCode",
    "presentable": false,
    "required": false,
    "system": false,
    "type": "relation"
  }))

  return app.save(collection)
})
