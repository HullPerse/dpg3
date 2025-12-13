import PocketBase from "pocketbase";

//THIS URL IS SAVE TO KEEP THERE SINCE ITS BASICALLY 127.0.0.1 (change it to your pockerbase URL)
const URL = "http://26.15.36.191:8090/";
const client = new PocketBase(URL);

const itemImage = `${URL}api/files/pbc_710432678/`;
const gameImage = `${URL}api/files/pbc_879072730/`;

export { URL, client, itemImage, gameImage };
