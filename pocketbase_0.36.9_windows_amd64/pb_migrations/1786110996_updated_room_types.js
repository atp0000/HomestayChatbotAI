/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_3980138507")

  // remove field
  collection.fields.removeById("number3051925876")

  // remove field
  collection.fields.removeById("number2683508278")

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_3980138507")

  // add field
  collection.fields.addAt(3, new Field({
    "hidden": false,
    "id": "number3051925876",
    "max": null,
    "min": null,
    "name": "capacity",
    "onlyInt": false,
    "presentable": false,
    "required": false,
    "system": false,
    "type": "number"
  }))

  // add field
  collection.fields.addAt(4, new Field({
    "hidden": false,
    "id": "number2683508278",
    "max": null,
    "min": null,
    "name": "quantity",
    "onlyInt": false,
    "presentable": false,
    "required": false,
    "system": false,
    "type": "number"
  }))

  return app.save(collection)
})
