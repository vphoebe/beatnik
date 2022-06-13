import "dotenv/config";
import { DataTypes, Model, Sequelize } from "sequelize";

const sequelize = new Sequelize({
  dialect: "sqlite",
  storage: process.env.DATABASE_PATH,
});

export async function connectToDb() {
  try {
    await sequelize.authenticate();
    await sequelize.sync();
    console.log("Database connection has been established successfully.");
    console.log("All models were synchronized successfully.");
  } catch (error) {
    console.error("Unable to connect to the database:", error);
  }
}

interface SavedUrlType extends Model {
  guildId: string;
  name: string;
  url: string;
}

export const SavedUrl = sequelize.define<SavedUrlType>("SavedUrl", {
  guildId: DataTypes.STRING,
  name: DataTypes.STRING,
  url: DataTypes.STRING,
});
