<template>
  <input 
    type="file" 
    class="btn btn-default" 
    value="Load" 
    @change="onFileChanged($event)">
</template>

<script lang="ts">
import { Component, Vue } from "vue-property-decorator";

@Component
export default class Loadfile extends Vue {
  loadSurvey(file: any) {
    const reader = new FileReader();
    reader.onload = (e: ProgressEvent) => {
      const result = reader.result as string;
      if (result === "undefined") {
        return;
      }

      const loadedFile: SurveyFile = JSON.parse(result);
      this.$emit("fileLoaded", loadedFile);
    };

    reader.readAsText(file);
  }
  
  onFileChanged($event: any) {
    if (
      $event === null ||
      $event.target === null ||
      $event.dataTransfer === null
    ) {
      return;
    }

    const target = $event.target as HTMLInputElement;
    const files = target.files || $event.dataTransfer.files;

    if (files.length === 0) {
      return;
    }

    this.loadSurvey(files[0]);
  }

}
</script>

<style>
</style>
