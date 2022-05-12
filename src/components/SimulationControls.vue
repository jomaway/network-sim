<script setup>
import { ref } from "vue";
import { useNetworkStore } from "../stores/network";
import slider from "vue3-slider";
import { computed } from "@vue/reactivity";

const tm = useNetworkStore().manager.tm;
const pause = ref(tm.isPause());
const pauseBtnRef = ref();

const next = () => {
  console.log("next step");
  tm.next();
};

const onPausePlay = () => {
  pause.value = !pause.value;
  if (pause.value) {
    tm.pause();
  } else {
    tm.play();
  }
};

const sliderModel = computed({
  get: () => tm.simulationTimeout,
  set: (value) => tm.setSimulationTimeout(value),
});
</script>

<template>
  <div class="flex flex-col gap-2 items-center">
    <h3>Traffic controls:</h3>
    <slider
      v-model="sliderModel"
      :min="250"
      :max="2000"
      :step="250"
      :height="7"
      :tooltip="true"
      :tooltipText="'%v s'"
    />
    <div class="flex gap-1">
      <button
        ref="pauseBtnRef"
        class="p-2 rounded font-bold text-white text-xl focus:outline-none"
        @click="onPausePlay"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          xmlns:xlink="http://www.w3.org/1999/xlink"
          viewBox="0 0 512 512"
          width="2.5em"
          height="2.5em"
          class="hover:bg-white rounded-full"
        >
          <path
            v-if="pause"
            d="M256,0C114.617,0,0,114.615,0,256s114.617,256,256,256s256-114.615,256-256S397.383,0,256,0z M344.48,269.57l-128,80
	          c-2.59,1.617-5.535,2.43-8.48,2.43c-2.668,0-5.34-0.664-7.758-2.008C195.156,347.172,192,341.82,192,336V176
	          c0-5.82,3.156-11.172,8.242-13.992c5.086-2.836,11.305-2.664,16.238,0.422l128,80c4.676,2.93,7.52,8.055,7.52,13.57
	          S349.156,266.641,344.48,269.57z"
            fill="#3498db"
          />
          <path
            v-else
            d="M256,0C114.617,0,0,114.615,0,256s114.617,256,256,256s256-114.615,256-256S397.383,0,256,0z M224,320
            c0,8.836-7.164,16-16,16h-32c-8.836,0-16-7.164-16-16V192c0-8.836,7.164-16,16-16h32c8.836,0,16,7.164,16,16V320z M352,320
            c0,8.836-7.164,16-16,16h-32c-8.836,0-16-7.164-16-16V192c0-8.836,7.164-16,16-16h32c8.836,0,16,7.164,16,16V320z"
            fill="#3498db"
          />
        </svg>
        {{ pause ? "Play" : "Pause" }}
      </button>
      <button
        v-if="pause"
        class="p-2 rounded font-bold text-white text-xl focus:outline-none"
        @click="next"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          xmlns:xlink="http://www.w3.org/1999/xlink"
          viewBox="0 0 512 512"
          width="2.5em"
          height="2.5em"
          class="hover:bg-white rounded-full"
        >
          <path
            d="M256,0C114.615,0,0,114.615,0,256s114.615,256,256,256s256-114.615,256-256S397.385,0,256,0z M280.875,269.313l-96,64
	C182.199,335.094,179.102,336,176,336c-2.59,0-5.184-0.625-7.551-1.891C163.246,331.32,160,325.898,160,320V192
	c0-5.898,3.246-11.32,8.449-14.109c5.203-2.773,11.516-2.484,16.426,0.797l96,64C285.328,245.656,288,250.648,288,256
	S285.328,266.344,280.875,269.313z M368,320c0,8.836-7.164,16-16,16h-16c-8.836,0-16-7.164-16-16V192c0-8.836,7.164-16,16-16h16
	c8.836,0,16,7.164,16,16V320z"
            fill="#e74c3c"
          />
        </svg>
        Next
      </button>
    </div>
  </div>
</template>
