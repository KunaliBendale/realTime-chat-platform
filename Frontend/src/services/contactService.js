import { api } from "../lib/api";

export const contactService = {
  async fetchContacts() {
    const response = await api.get("/contacts");
    return response.data;
  },

  async addContact(payload) {
    const response = await api.post("/contacts", payload);
    return response.data;
  },
};
