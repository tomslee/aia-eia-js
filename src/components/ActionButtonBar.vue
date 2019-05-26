<template>
  <div>
    <div v-if="$store.getters.inProgress">
      <ul class="list-inline lst-spaced">
        <li>
          <SaveFile/>
        </li>
        <li>
          <LoadFile/>
        </li>
      </ul>
      <StartAgain v-on:startAgain="$emit('startAgain')"/>
    </div>
    <div v-else>
      <LoadFile/>
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Vue } from "vue-property-decorator";
import SurveyFile from "@/interfaces/SurveyFile";
import StartAgain from "@/components/buttons/Startover.vue";
import SaveFile from "@/components/buttons/SaveFile.vue";
import LoadFile from "@/components/buttons/LoadFile.vue";

@Component({
  components: {
    StartAgain,
    SaveFile,
    LoadFile
  }
})
export default class ActionButtonBar extends Vue {}
</script>
