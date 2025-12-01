import SGDB from "steamgriddb";

export const steamGridDB = new SGDB(process.env.STEAMGRIDDB_KEY!);
