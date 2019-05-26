<template>
  <button
    type="button"
    class="mrgn-bttm-sm btn btn-success"
    v-on:click="saveSurvey"
  >{{ $t("saveButton") }}</button>
</template>

<script lang="ts">
import {Component, Vue } from "vue-property-decorator";

@Component
export default class SaveFile extends Vue{

  buildSurveyFile(): string {
    return JSON.stringify({
      currentPage: this.$store.state.currentPageNo,
      data: this.$store.state.toolData
    });
  }
  
saveSurvey() {
    const a = document.createElement("a");
    a.download = "SurveyResults.json";

    const saveFile = this.buildSurveyFile();
    const blob = new Blob([saveFile], { type: "text/plain" });

    a.href = window.URL.createObjectURL(blob);

    a.dataset.downloadurl = ["text/json", a.download, a.href].join(":");

    const e = document.createEvent("MouseEvents");
    e.initEvent("click", true, false);
    a.dispatchEvent(e);
  }

};
</script>

<style>
</style>
