<template>
  <div class="release-tooltip notranslate" translate="no">
    {{ text }}
  </div>
</template>

<script setup lang="ts">
import { defineProps } from "vue";

defineProps({
  text: {
    type: String,
    required: true,
  },
});
</script>

<style scoped lang="scss">
@import "../scss/components/tooltip";
</style>
