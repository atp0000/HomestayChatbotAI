/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_986407980")

  // add field
  collection.fields.addAt(1, new Field({
    "autogeneratePattern": "",
    "hidden": false,
    "id": "text1997877400",
    "max": 0,
    "min": 0,
    "name": "code",
    "pattern": "",
    "presentable": false,
    "primaryKey": false,
    "required": false,
    "system": false,
    "type": "text"
  }))

  // add field
  collection.fields.addAt(2, new Field({
    "cascadeDelete": false,
    "collectionId": "pbc_2862526969",
    "hidden": false,
    "id": "relation2168032777",
    "maxSelect": 1,
    "minSelect": 0,
    "name": "customer",
    "presentable": false,
    "required": false,
    "system": false,
    "type": "relation"
  }))

  // add field
  collection.fields.addAt(3, new Field({
    "autogeneratePattern": "",
    "hidden": false,
    "id": "text2563390273",
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
    "id": "text3565470165",
    "max": 0,
    "min": 0,
    "name": "rommTypeName",
    "pattern": "",
    "presentable": false,
    "primaryKey": false,
    "required": false,
    "system": false,
    "type": "text"
  }))

  // add field
  collection.fields.addAt(5, new Field({
    "autogeneratePattern": "",
    "hidden": false,
    "id": "text3179557681",
    "max": 0,
    "min": 0,
    "name": "guestName",
    "pattern": "",
    "presentable": false,
    "primaryKey": false,
    "required": false,
    "system": false,
    "type": "text"
  }))

  // add field
  collection.fields.addAt(6, new Field({
    "autogeneratePattern": "",
    "hidden": false,
    "id": "text4229010847",
    "max": 0,
    "min": 0,
    "name": "guestPhone",
    "pattern": "",
    "presentable": false,
    "primaryKey": false,
    "required": false,
    "system": false,
    "type": "text"
  }))

  // add field
  collection.fields.addAt(7, new Field({
    "autogeneratePattern": "",
    "hidden": false,
    "id": "text1607237174",
    "max": 0,
    "min": 0,
    "name": "guestEmail",
    "pattern": "",
    "presentable": false,
    "primaryKey": false,
    "required": false,
    "system": false,
    "type": "text"
  }))

  // add field
  collection.fields.addAt(8, new Field({
    "autogeneratePattern": "",
    "hidden": false,
    "id": "text554670964",
    "max": 0,
    "min": 0,
    "name": "guestAddress",
    "pattern": "",
    "presentable": false,
    "primaryKey": false,
    "required": false,
    "system": false,
    "type": "text"
  }))

  // add field
  collection.fields.addAt(9, new Field({
    "autogeneratePattern": "",
    "hidden": false,
    "id": "text3485334036",
    "max": 0,
    "min": 0,
    "name": "note",
    "pattern": "",
    "presentable": false,
    "primaryKey": false,
    "required": false,
    "system": false,
    "type": "text"
  }))

  // add field
  collection.fields.addAt(10, new Field({
    "hidden": false,
    "id": "number1293008050",
    "max": null,
    "min": null,
    "name": "guests",
    "onlyInt": false,
    "presentable": false,
    "required": false,
    "system": false,
    "type": "number"
  }))

  // add field
  collection.fields.addAt(11, new Field({
    "autogeneratePattern": "",
    "hidden": false,
    "id": "text1961310259",
    "max": 0,
    "min": 0,
    "name": "checkIn",
    "pattern": "",
    "presentable": false,
    "primaryKey": false,
    "required": false,
    "system": false,
    "type": "text"
  }))

  // add field
  collection.fields.addAt(12, new Field({
    "autogeneratePattern": "",
    "hidden": false,
    "id": "text2541054894",
    "max": 0,
    "min": 0,
    "name": "checkOut",
    "pattern": "",
    "presentable": false,
    "primaryKey": false,
    "required": false,
    "system": false,
    "type": "text"
  }))

  // add field
  collection.fields.addAt(13, new Field({
    "hidden": false,
    "id": "number1970541539",
    "max": null,
    "min": null,
    "name": "nights",
    "onlyInt": false,
    "presentable": false,
    "required": false,
    "system": false,
    "type": "number"
  }))

  // add field
  collection.fields.addAt(14, new Field({
    "hidden": false,
    "id": "number891852706",
    "max": null,
    "min": null,
    "name": "roomPrice",
    "onlyInt": false,
    "presentable": false,
    "required": false,
    "system": false,
    "type": "number"
  }))

  // add field
  collection.fields.addAt(15, new Field({
    "hidden": false,
    "id": "number3673351920",
    "max": null,
    "min": null,
    "name": "servicesTotal",
    "onlyInt": false,
    "presentable": false,
    "required": false,
    "system": false,
    "type": "number"
  }))

  // add field
  collection.fields.addAt(16, new Field({
    "hidden": false,
    "id": "json527445115",
    "maxSize": 0,
    "name": "servicesDetail",
    "presentable": false,
    "required": false,
    "system": false,
    "type": "json"
  }))

  // add field
  collection.fields.addAt(17, new Field({
    "hidden": false,
    "id": "number3257917790",
    "max": null,
    "min": null,
    "name": "total",
    "onlyInt": false,
    "presentable": false,
    "required": false,
    "system": false,
    "type": "number"
  }))

  // add field
  collection.fields.addAt(18, new Field({
    "hidden": false,
    "id": "select2603383891",
    "maxSelect": 1,
    "name": "payMethod",
    "presentable": false,
    "required": false,
    "system": false,
    "type": "select",
    "values": [
      "cash"
    ]
  }))

  // add field
  collection.fields.addAt(19, new Field({
    "hidden": false,
    "id": "select3195347759",
    "maxSelect": 1,
    "name": "payStatus",
    "presentable": false,
    "required": false,
    "system": false,
    "type": "select",
    "values": [
      "unpaid",
      "deposit",
      "paid"
    ]
  }))

  // add field
  collection.fields.addAt(20, new Field({
    "hidden": false,
    "id": "select2063623452",
    "maxSelect": 1,
    "name": "status",
    "presentable": false,
    "required": false,
    "system": false,
    "type": "select",
    "values": [
      "pending",
      "checkedout",
      "checkedin",
      "cancelled",
      "confirmed"
    ]
  }))

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_986407980")

  // remove field
  collection.fields.removeById("text1997877400")

  // remove field
  collection.fields.removeById("relation2168032777")

  // remove field
  collection.fields.removeById("text2563390273")

  // remove field
  collection.fields.removeById("text3565470165")

  // remove field
  collection.fields.removeById("text3179557681")

  // remove field
  collection.fields.removeById("text4229010847")

  // remove field
  collection.fields.removeById("text1607237174")

  // remove field
  collection.fields.removeById("text554670964")

  // remove field
  collection.fields.removeById("text3485334036")

  // remove field
  collection.fields.removeById("number1293008050")

  // remove field
  collection.fields.removeById("text1961310259")

  // remove field
  collection.fields.removeById("text2541054894")

  // remove field
  collection.fields.removeById("number1970541539")

  // remove field
  collection.fields.removeById("number891852706")

  // remove field
  collection.fields.removeById("number3673351920")

  // remove field
  collection.fields.removeById("json527445115")

  // remove field
  collection.fields.removeById("number3257917790")

  // remove field
  collection.fields.removeById("select2603383891")

  // remove field
  collection.fields.removeById("select3195347759")

  // remove field
  collection.fields.removeById("select2063623452")

  return app.save(collection)
})
