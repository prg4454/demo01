"use strict";

import sequelize from '../config/database.js';
import defineItem from './Item.js';
import defineCat from './Cat.js';

const db = {};

db.sequelize = sequelize;
db.Item = defineItem(sequelize);
db.Cat = defineCat(sequelize);

// Future model associations can be defined here:
// Object.keys(db).forEach((modelName) => {
//   if (db[modelName].associate) {
//     db[modelName].associate(db);
//   }
// });

export default db;
export { sequelize, sequelize as db };
export const { Item, Cat } = db;
