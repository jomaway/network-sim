<script setup>

defineProps({
  data: {
    type: Map,
    required: true,
  },
});
</script>

<template>
  <div class="overflow-hidden">
    <table class="text-center border-collapse">
      <thead class="">
        <tr class="">
          <th class="border px-4 py-1 rounded-tl">Port</th>
          <th class="border px-4 py-1 rounded-tr">MAC</th>
        </tr>
      </thead>
      <tbody class="p-2">
        <tr v-for="([key, value], index) in data" :key="key" class="border last:rounded-b">
          <td>{{index}}</td>
          <td class="px-4">{{value}}</td>
        </tr>
      </tbody>
    </table>
  </div>
</template>
