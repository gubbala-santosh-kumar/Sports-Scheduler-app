'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Sessions extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }

    static select(){
      return this.findAll();
    }

    static deleteSessionFromDatabase(sessionId){
      return this.destroy({
        where:{
          id: sessionId
        }
      });
    }
    
  }
  Sessions.init({
    sport: DataTypes.STRING,
    teamA: DataTypes.STRING,
    teamB: DataTypes.STRING,
    teamAsize: DataTypes.INTEGER,
    teamBsize: DataTypes.INTEGER,
    actualTeamSize: DataTypes.INTEGER,
    place: DataTypes.STRING,
    date: DataTypes.DATE,
    time: DataTypes.TIME
  }, {
    sequelize,
    modelName: 'Sessions',
  });
  return Sessions;
};