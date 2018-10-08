const fs        = require('fs');
const path      = require('path');
const  Sequelize = require('sequelize');
const  dbConfig = require('../config/db.config');
module.exports = class Models extends Sequelize{
    constructor(){
        super(dbConfig['conf'].database,dbConfig['conf'].user,dbConfig['conf'].password,{
            host:dbConfig['conf'].host,
            dialect: 'mysql',
            timezone: 'Asia/Shanghai'
        });
        let files=fs
            .readdirSync(__dirname)
            .filter(file => {
                return (file.indexOf('.') !== 0) && (file !== path.basename(__filename)) && (file.slice(-3) === '.js');
            });
        let attrs=[];
        files.forEach(file => {
            let model = this['import'](path.join(__dirname, file));
            this[model.name]=model;
            attrs.push(model.name)
        });
        attrs.forEach(modelName => {
            if (this[modelName].associate) {
                this[modelName].associate(this);
            }
        });
    }
}