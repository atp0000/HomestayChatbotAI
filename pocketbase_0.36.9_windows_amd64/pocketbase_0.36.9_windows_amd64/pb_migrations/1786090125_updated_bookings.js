/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_986407980")

  // remove field
  collection.fields.removeById("text_roomCode")

  // remove field
  collection.fields.removeById("text_roomTypeName")

  // add field
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

  // add field
  collection.fields.addAt(21, new Field({
    "cascadeDelete": false,
    "collectionId": "pbc_3980138507",
    "hidden": false,
    "id": "relation3497071080",
    "maxSelect": 1,
    "minSelect": 0,
    "name": "roomTypeName",
    "presentable": false,
    "required": false,
    "system": false,
    "type": "relation"
  }))

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_986407980")

  // add field
  collection.fields.addAt(3, new Field({
    "autogeneratePattern": "",
    "hidden": false,
    "id": "text_roomCode",
    "max": 0,
    "min": 0,
    "name": "roomCode",
    "pattern": "",
    "presentable": false,
    "primaryKey": false,
    "required": false,
    "system": false,
    "type": "text"
  }))

  // add field
  collection.fields.addAt(4, new Field({
    "autogeneratePattern": "",
    "hidden": false,
    "id": "text_roomTypeName",
    "max": 0,
    "min": 0,
    "name": "roomTypeName",
    "pattern": "",
    "presentable": false,
    "primaryKey": false,
    "required": false,
    "system": false,
    "type": "text"
  }))

  // remove field
  collection.fields.removeById("relation2563390273")

  // remove field
  collection.fields.removeById("relation3497071080")

  return app.save(collection)
})
