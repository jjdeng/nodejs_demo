
module.exports = (sequelize, DataTypes) => {
    let sys_sessions = sequelize.define('sys_sessions', {
        sid: {
            type: DataTypes.STRING(99),
            primaryKey: true
        },
        userId: DataTypes.STRING,
        expires: DataTypes.DATE,
        data: DataTypes.STRING(5000)
    });
    return sys_sessions;
}

