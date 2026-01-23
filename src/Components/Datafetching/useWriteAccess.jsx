import { useMemo, useContext } from "react";
import { DataContext } from "./DataProvider";

/**
 * Custom hook to check write access for a given path
 * @param {string} path - The GUI apps path to check write access for
 * @returns {boolean} - Returns true if user has write access, false otherwise
 */
export const useWriteAccess = (path) => {
  const { menuItemsFromAPI } = useContext(DataContext);

  const hasWriteAccess = useMemo(() => {
    const menuItem = menuItemsFromAPI.find((item) => item.guiappspath === path);
    return menuItem ? menuItem.appswriteaccess === 1 : false;
  }, [menuItemsFromAPI, path]);

  return hasWriteAccess;
};
