// import request from "../utils/request";
// import { apiKey, userId } from "../constants/common";
// import getIsLocal from "../utils/isLocal";

// const isLocal = getIsLocal();

const getRemByID = (remId) => {
  return window.RemNoteAPI.v0.get(remId);
};

export default getRemByID;
