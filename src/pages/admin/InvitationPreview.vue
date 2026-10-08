<script setup lang="ts">
import { useRoute } from 'vue-router'
import PublicInvitation from '@/pages/invitation/PublicInvitation.vue'

const route = useRoute()
</script>

<template>
  <PublicInvitation :preview-id="String(route.params.id)" />
</template>
