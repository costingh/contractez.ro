import { formNum, formStr } from "./action";

/** Câmpurile formularului de servicii, aceleași la adăugare și la editare (validate de `serviceSchema`). */
export function parseServiceForm(fd: FormData) {
  return {
    categoryId: formNum(fd, "categoryId"),
    title: formStr(fd, "title"),
    description: formStr(fd, "description"),
    priceFrom: formNum(fd, "priceFrom"),
    // Fără unitate aleasă nu presupunem „oră” (un landing page ar apărea „de la 1.500 lei / oră”).
    priceUnit: formStr(fd, "priceUnit") || "project",
  };
}
