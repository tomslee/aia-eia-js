<template>
  <button
    type="button"
    value="Start Over"
    class="btn btn-default"
    v-on:click="$emit('startAgain')"
  >{{ $t("startAgain") }}</button>
</template>

<script>
export default {};
</script>

<style>
</style>
