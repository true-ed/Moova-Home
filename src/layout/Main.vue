<template>
  <main class="app">
    <div class="app__download">
      <section class="app__title">
        Your dictionary. <span> Now smart </span>
      </section>
      <section class="app__buttons">
        <div class="app__buttons-group">
          <a
            href="./moova-0.1.0-arm64-mac.zip"
            download="moova-0.1.0-arm64-mac.zip"
            class="button button_theme_primary app__button app__button--mac"
            style="
              text-decoration: none;
              text-align: center;
              display: inline-block;
            "
          >
            MacOS
          </a>

          <div class="app__button-wrapper">
            <button
              class="button button_theme_primary app__button app__button--windows"
            >
              <small>or</small> Windows
            </button>
            <ReleaseTooltip text="Working on publication..." />
          </div>
        </div>

        <div class="app__button-wrapper">
          <button class="button app__button app__button--github">
            <img src="../assets/github-mark-white.png" alt="" /> Git Hub
          </button>
          <ReleaseTooltip text="Working on publication..." />
        </div>
      </section>
    </div>

    <section class="app__video">
      <div class="app__video-img app__video-img--left">
        <img
          style="will-change: transform"
          data-parallax="some"
          src="../assets/compressed/batterfly-1.png"
          alt=""
        />
      </div>

      <div class="app__video-container">
        <img
          class="app__video-split app__video-split--left"
          style="will-change: transform"
          data-parallax="some"
          src="../assets/screenshot_2026-05-14_12.08.20.png"
          alt="First half"
        />
        <img
          class="app__video-split app__video-split--right"
          style="will-change: transform"
          data-parallax="some"
          src="../assets/screenshot_2026-05-14_12.08.47.png"
          alt="Second half"
        />
      </div>

      <div class="app__video-img app__video-img--right app__video-img--blur">
        <img
          style="will-change: transform"
          data-parallax="some"
          src="../assets/compressed/batterfly.png"
          alt=""
        />
      </div>
    </section>
  </main>
</template>

<script lang="ts" setup>
import { onMounted, onUnmounted } from "vue";
import ReleaseTooltip from "../components/ReleaseTooltip.vue";

let animationFrameId: number;

onMounted(() => {
  const images = Array.from(
    document.querySelectorAll("img[data-parallax]")
  ) as HTMLImageElement[];
  const biases = new Array(images.length).fill(0);

  const updateParallax = () => {
    const scrollTop = window.scrollY;
    images.forEach((img, i) => {
      const weight = -(img.offsetWidth / window.innerWidth);
      biases[i] += (scrollTop * weight - biases[i]) / 8;
      (img as HTMLElement).style.transform = `translateY(${biases[i]}px)`;
    });

    animationFrameId = requestAnimationFrame(updateParallax);
  };

  animationFrameId = requestAnimationFrame(updateParallax);
});

onUnmounted(() => {
  cancelAnimationFrame(animationFrameId);
});
</script>

<style scoped lang="scss">
@import "../scss/layout/main";
</style>
