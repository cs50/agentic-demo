<!--
  global-bottom.vue — Slidev renders this once over every slide, in every
  mode. It carries the viewer's Follow pill, which hides itself unless this
  deck is an audience member connected to the hub.
-->
<script setup lang="ts">
import FollowControl from './components/FollowControl.vue'
</script>

<template>
  <FollowControl />
</template>
