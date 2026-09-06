"use strict";

import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';

dotenv.config();

const dialect = process.env.DB_DIALECT || 'sqlite';

let sequelize;

if (dialect === 'sqlite') {
  const storagePath = process.env.DB_STORAGE || 'db';

  sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: storagePath,
    logging: process.env.NODE_ENV === 'development' ? console.log : false,
  });
} else {
  sequelize = new Sequelize(
    process.env.DB_NAME,
    process.env.DB_USER,
    process.env.DB_PASSWORD,
    {
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || (dialect === 'postgres' ? 5432 : 3306),
      dialect: dialect,
      logging: process.env.NODE_ENV === 'development' ? console.log : false,
    }
  );
}

export default sequelize;
export { sequelize as db };
