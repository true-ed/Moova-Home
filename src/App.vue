<template>
  <Header />
  <Main />
  <Bg />
</template>

<script lang="ts">
import { defineComponent } from "vue";
import Header from "./layout/Header.vue";
import Main from "./layout/Main.vue";
import Bg from "./components/Bg.vue";

export default defineComponent({
  name: "App",
  components: {
    Header,
    Main,
    Bg,
  },
});
</script>

<style lang="scss">
@import "./scss/main.scss";

#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
}
</style>
