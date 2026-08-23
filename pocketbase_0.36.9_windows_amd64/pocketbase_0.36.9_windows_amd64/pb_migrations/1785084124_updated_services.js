/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_863811952")

  // add field
  collection.fields.addAt(6, new Field({
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
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_863811952")

  // remove field
  collection.fields.removeById("number2683508278")

  return app.save(collection)
})
