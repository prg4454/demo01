"use strict";

import { DataTypes } from 'sequelize';

export default (sequelize) => sequelize.define('Cat', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: { notEmpty: true },
  },
  breed: DataTypes.STRING,
  owner: DataTypes.STRING,
  reason: DataTypes.STRING,
  checkIn: DataTypes.STRING,
  status: {
    type: DataTypes.STRING,
    defaultValue: 'Waiting',
    validate: { isIn: [['Waiting', 'Exam', 'Treatment', 'Ready']] },
  },
  vet: DataTypes.STRING,
  nextAppointment: DataTypes.STRING,
}, {
  tableName: 'cats',
  timestamps: false,
});
