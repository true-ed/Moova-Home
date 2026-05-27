import { createStore } from "vuex";

export enum ESection {
  Home,
  Feature,
  Contacts,
}

export default createStore({
  state: {
    watchingSection: ESection.Home,
  },
  getters: {},
  mutations: {},
  actions: {},
  modules: {},
});
