<template>
  <div>
    <div v-if="$store.getters.inProgress">
      <ul class="list-inline lst-spaced">
        <li>
          <SaveFile />
        </li>
        <li>
          <input type="file" class="btn btn-default" value="Load" @change="onFileChanged($event)">
        </li>
      </ul>
      <StartAgain v-on:startAgain="$emit('startAgain')"/>
    </div>
    <div v-else>
      <input type="file" class="btn btn-default" value="Load" @change="onFileChanged($event)">
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Vue } from "vue-property-decorator";
import showdown from "showdown";
import i18n from "@/plugins/i18n";
import SurveyFile from "@/interfaces/SurveyFile";
import StartAgain from "@/components/buttons/Startover.vue";
import SaveFile from "@/components/buttons/SaveFile.vue"

@Component({
  components: {
    StartAgain,
    SaveFile
  }
})
export default class ActionButtonBar extends Vue {

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
}
</script>
