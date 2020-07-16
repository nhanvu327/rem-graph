function getIsLocal() {
  return window.location.hostname === "localhost";
}

export default getIsLocal;
