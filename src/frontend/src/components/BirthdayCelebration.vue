<template>
  <div class="birthday-celebration">
    <div class="confetti-container">
      <div v-for="n in 20" :key="n" :class="['floating-item', n % 2 === 0 ? 'heart' : 'star']" :style="getStyle(n)">
        {{ n % 2 === 0 ? '💖' : '⭐' }}
      </div>
    </div>
    <div class="content">
      <h1 class="animated-title">🎉 Happy Birthday, {{ name }}! 🎂</h1>
      <div class="paragraph-section">
        <p style="color:black">
          Another year has passed, with its good and bad days, with its laughs and tears, with its challenges, it passed...
          
          
        </p>
        <p style="color:black">
          You are one step closer to your dream. I know we are no communicating as mush as we agreed to, but I know that you wake up everyday and you do what needs to be done despite the atmosphere around you that tries to put you down and stop you. You smile everyday even when the smile itself is a challenge. 
        </p>
        <p style="color:black">
          Fot that I hope that you are from those that the Prophet Mohammed talked about: 
          يَقولُ الرَّسولُ صلَّى اللهُ عليه وسلَّم
          أَلَا أُخْبِرُكم بمَن يَحْرُمُ على النَّارِ، وبمَن تَحْرُمُ عليه النَّارُ؟ على كلِّ قريبٍ هيِّنٍ سهْلٍ.

        </p>
        <p style="color:black">
          Wishing you the happiest of birthdays! 
        </p>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'BirthdayCelebration',
  props: {
    name: {
      type: String,
      default: 'Lujain'
    }
  },
  methods: {
    getStyle(n) {
      const left = Math.random() * 100;
      const delay = Math.random() * 5;
      const duration = 5 + Math.random() * 5;
      return {
        left: `${left}%`,
        animationDelay: `${delay}s`,
        animationDuration: `${duration}s`
      };
    }
  }
}
</script>

<style scoped>
.birthday-celebration {
  position: relative;
  overflow: hidden;
  background: linear-gradient(135deg, #ff9a9e 0%, #fecfef 99%, #fecfef 100%);
  border-radius: 12px;
  padding: 40px 20px;
  text-align: center;
  color: #000000;
  margin-bottom: 20px;
  box-shadow: 0 10px 20px rgba(0, 0, 0, 0.1);
  font-family: 'Inter', sans-serif;
}

.confetti-container {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  overflow: hidden;
}

.floating-item {
  position: absolute;
  bottom: -10%;
  font-size: 24px;
  opacity: 0.8;
  animation: float-up linear infinite;
}

@keyframes float-up {
  0% {
    transform: translateY(0) rotate(0deg) scale(0.8);
    opacity: 1;
  }
  100% {
    transform: translateY(-1000px) rotate(360deg) scale(1.2);
    opacity: 0;
  }
}

.content {
  position: relative;
  z-index: 1;
}

.animated-title {
  font-size: 2.5rem;
  font-weight: 800;
  margin-bottom: 20px;
  background: linear-gradient(to right, #ff758c 0%, #ff7eb3 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  animation: pulse 2s infinite;
  text-shadow: 2px 2px 4px rgba(0,0,0,0.1);
}

@keyframes pulse {
  0% { transform: scale(1); }
  50% { transform: scale(1.05); }
  100% { transform: scale(1); }
}

.paragraph-section {
  background: rgba(255, 255, 255, 0.2);
  backdrop-filter: blur(10px);
  border-radius: 8px;
  padding: 20px;
  margin: 0 auto;
  max-width: 600px;
  font-size: 1.2rem;
  line-height: 1.6;
  color: #333;
  box-shadow: 0 4px 6px rgba(0,0,0,0.05);
}

.paragraph-section p {
  margin: 0;
  font-weight: 500;
}
</style>
