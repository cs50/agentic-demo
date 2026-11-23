<!--
  global-bottom.vue — Slidev renders this once over every slide, in every
  mode. It carries what a viewer following along needs wherever they are in
  the deck: the Follow pill, and the "room decides" vote when one is open.
  Both hide themselves unless this deck is an audience member connected to
  the hub.
-->
<script setup lang="ts">
import AudienceChoice from './components/AudienceChoice.vue'
import FollowControl from './components/FollowControl.vue'
</script>

<template>
  <AudienceChoice />
  <FollowControl />
</template>
