import { getDatabasePath } from "./environment";
import { DataTypes, Model, Sequelize } from "sequelize";

const sequelize = new Sequelize("database", "user", "password", {
  host: "localhost",
  dialect: "sqlite",
  logging: false,
  storage: getDatabasePath(),
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

export interface SavedUrlType extends Model {
  guildId: string;
  name: string;
  url: string;
}

export const SavedUrl = sequelize.define<SavedUrlType>("SavedUrl", {
  guildId: DataTypes.STRING,
  name: DataTypes.STRING,
  url: DataTypes.STRING,
});

export async function getSavedUrl(guildId: string, name: string) {
  return await SavedUrl.findOne({
    where: { name, guildId },
  });
}

export async function getAllSavedUrls(guildId: string) {
  return await SavedUrl.findAll({
    where: { guildId },
  });
}

export async function setSavedUrl(guildId: string, name: string, url: string) {
  const existing = await SavedUrl.findOne({ where: { guildId, name } });
  let operation = "Saved";
  if (existing) {
    existing.set({ url });
    await existing.save();
    operation = "Updated";
  } else {
    await SavedUrl.create({ guildId, name, url });
  }
  return operation;
}

export async function removeSavedUrl(guildId: string, name: string) {
  const existing = await SavedUrl.findOne({ where: { guildId, name } });
  if (existing) {
    await existing.destroy();
    return true;
  } else {
    return false;
  }
}
