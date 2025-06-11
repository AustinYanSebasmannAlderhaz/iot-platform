module.exports = (sequelize, DataTypes) => {
  return sequelize.define('alert_records', {
    message: {
      type: DataTypes.STRING,
      allowNull: false,
    },
  }, {
    tableName: 'alert_records',
    timestamps: true 
  });
};

