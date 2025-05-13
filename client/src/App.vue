<!-- src/App.vue -->
<template>
  <div id="app">
    <FileUpload />
  </div>
</template>

<script>
import FileUpload from "./components/FileUpload";

export default {
  name: "App",
  components: {
    FileUpload,
  },
};
</script>

<style>
/* עיצוב כללי */
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  text-align: center;
  margin-top: 60px;
}
</style>
