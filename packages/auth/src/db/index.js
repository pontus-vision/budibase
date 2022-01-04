let Pouch

export const setDB = pouch => {
  Pouch = pouch
}

export const getDB = dbName => {
  return new Pouch(dbName)
}

export const getCouch = () => {
  return Pouch
}
