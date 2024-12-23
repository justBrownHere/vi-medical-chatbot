export const setStorage = (key, value) => {
  const stringValue = JSON.stringify(value);
  localStorage.setItem(key, stringValue);
};

export const getStorage = (key) => {
  const stringItem = localStorage.getItem(key);
  try {
    return stringItem ? JSON.parse(stringItem) : stringItem;
  } catch (error) {
    return stringItem;
  }
};

export const removeStorage = (key) => {
  localStorage.removeItem(key)
}
