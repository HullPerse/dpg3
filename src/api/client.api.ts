import PocketBase from "pocketbase";

const URL = "http://26.15.36.191:8090/";
const client = new PocketBase(URL);

const itemImage = `${URL}api/files/pbc_710432678/`;
const gameImage = `${URL}api/files/pbc_879072730/`;

export { URL, client, itemImage, gameImage };
