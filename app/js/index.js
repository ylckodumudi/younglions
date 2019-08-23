function _toConsumableArray(arr) {if (Array.isArray(arr)) {for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) {arr2[i] = arr[i];}return arr2;} else {return Array.from(arr);}}var SpeechRecognition = SpeechRecognition || window.webkitSpeechRecognition || undefined;
var numbers = Array.apply(null, Array(101)).map(function (_, i) {return i;});

if (SpeechRecognition) {
  var SpeechGrammarList = SpeechGrammarList || window.webkitSpeechGrammarList || undefined;
  var SpeechRecognitionEvent = SpeechRecognitionEvent || window.webkitSpeechRecognitionEvent || undefined;

  var commands = ['reset', 'timer'].concat(_toConsumableArray(numbers));
  var grammar = '#JSGF V1.0; grammar colors; public <color> = ' + commands.join(' | ') + ' ;';

  var speechRecognitionList = new SpeechGrammarList();
  speechRecognitionList.addFromString(grammar, 1);

  var recognition = new SpeechRecognition();
  recognition.grammars = speechRecognitionList;
  //recognition.continuous = false;
  recognition.lang = 'en-US';
  recognition.interimResults = true;
  recognition.maxAlternatives = 1;
}

var speechSynth = new SpeechSynthesisUtterance();

var padDigits = function padDigits(number, digits) {
  return Array(Math.max(digits - String(number).length + 1, 0)).join(0) + number;
};

var calculatePercentsLeft = function calculatePercentsLeft(value, from) {
  return Math.floor(Math.ceil(value / 1000) / (from * 60) * 100);
};

var calculateScaleFactor = function calculateScaleFactor(percent) {
  return 1 - (100 - percent) / 100;
};

function guid() {
  function s4() {
    return Math.floor((1 + Math.random()) * 0x10000).
    toString(16).
    substring(1);
  }
  return s4() + s4() + '-' + s4() + '-' + s4() + '-' +
  s4() + '-' + s4() + s4() + s4();
}

var settings = {
  water: {
    warningMsg: 'Remember to drink',
    timeIsUpMsg: 'Time\'s up. You really need to drink now',
    buttonTxt: 'Drink',
    waveFrontColor: '#32BAFA',
    waveBackColor: '#2C7FBE',
    stageBg: '#1E384C',
    durationInMinutes: 1 },

  coffee: {
    warningMsg: 'It\'s almost coffee time.',
    timeIsUpMsg: 'Time\'s up. Let\'s take a coffee break!',
    buttonTxt: 'Drink coffee',
    waveFrontColor: '#b39374',
    waveBackColor: '#7a6057',
    stageBg: '#392a2c',
    durationInMinutes: 1 },

  break: {
    warningMsg: 'It is time to rest your eyes soon!',
    timeIsUpMsg: 'Time\'s up. Now, it\'s really time to rest your eyes!',
    buttonTxt: 'Take a break',
    waveFrontColor: '#02C39A',
    waveBackColor: '#028090',
    stageBg: '#012F35',
    durationInMinutes: 1 },

  beer: {
    warningMsg: 'I know this sounds scary, but it\'s almost time for another beer',
    timeIsUpMsg: 'It\'s been while since the last beer!',
    buttonTxt: 'Have a beer',
    waveFrontColor: '#F1B10F',
    waveBackColor: '#FFFFFF',
    stageBg: '#5A3900',
    durationInMinutes: 60 } };



new Vue({
  el: '#stage',
  data: function data() {
    return {
      color: '',
      percents: [100],
      percentsLeft: 100,
      secondsLeft: 0,
      waveStyles: '',
      duration: 1,
      timer: [],
      voicesOpen: false,
      voices: [],
      selectedVoice: {},
      countdownObj: {},
      activeReminder: settings.water,
      menuOpen: false,
      isListening: false,
      tooltipText: 'Say eg. "reset"',
      stageBg: settings.water.stageBg };

  },
  mounted: function mounted() {var _this = this;
    this.resetTimer();
    this.voices = speechSynthesis.getVoices();

    if (this.voices.length === 0) {
      speechSynthesis.onvoiceschanged = function () {
        _this.voices = speechSynthesis.getVoices();
      };
    }
  },
  computed: {
    supportSpeechSynth: function supportSpeechSynth() {
      return 'speechSynthesis' in window;
    },
    supportSpeechRecognition: function supportSpeechRecognition() {
      return SpeechRecognition;
    } },

  watch: {
    percentsLeft: function percentsLeft(val, oldVal) {
      if (val === oldVal) {
        return;
      }
      this.percents.splice(0, 1);
      this.percents.push(val);
    } },

  methods: {
    setActiveReminder: function setActiveReminder(reminder) {
      this.activeReminder = settings[reminder];
      this.stageBg = this.activeReminder.stageBg;
    },
    toggleMenu: function toggleMenu() {
      this.menuOpen = !this.menuOpen;
      if (this.menuOpen) {
        this.pauseTimer();
        this.waveStyles = 'transform: translate3d(0,100%,0); transition-delay: .25s;';
      } else {
        this.continueTimer();
      }
    },
    toggleVoicesMenu: function toggleVoicesMenu() {
      this.voicesOpen = !this.voicesOpen;
    },
    voiceSelected: function voiceSelected(voice) {
      this.selectedVoice = voice;
      speechSynth.voice = voice;
    },
    start: function start(reminder) {
      this.setActiveReminder(reminder);
      this.percents = [100];
      this.timer = [];
      this.menuOpen = false;
      this.resetTimer();
    },
    resetTimer: function resetTimer() {
      var durationInSeconds = 60 * this.activeReminder.durationInMinutes;
      this.startTimer(durationInSeconds);
    },
    startTimer: function startTimer(secondsLeft) {var _this2 = this;
      var now = new Date();

      // later on, this timer may be stopped
      if (this.countdown) {
        window.clearInterval(this.countdown);
      }

      this.countdown = countdown(function (ts) {
        _this2.secondsLeft = Math.ceil(ts.value / 1000);
        _this2.percentsLeft = calculatePercentsLeft(ts.value, _this2.activeReminder.durationInMinutes);
        _this2.waveStyles = 'transform: scale(1,' + calculateScaleFactor(_this2.percentsLeft) + ')';
        _this2.updateCountdown(ts);
        if (_this2.percentsLeft == 10) {
          _this2.giveWarning();
        }
        if (_this2.percentsLeft <= 0) {
          _this2.timeIsUpMessage();
          _this2.pauseTimer();
          _this2.timer = [];
          setTimeout(function () {
            _this2.startListenVoiceCommands();
          }, 1500);

        }
      }, now.getTime() + secondsLeft * 1000);
    },
    updateCountdown: function updateCountdown(ts) {
      if (this.timer.length > 2) {
        this.timer.splice(2);
      }

      var newTime = {
        id: guid(),
        value: padDigits(ts.minutes, 2) + ':' + padDigits(ts.seconds, 2) };


      this.timer.unshift(newTime);
    },
    pauseTimer: function pauseTimer() {
      window.clearInterval(this.countdown);
    },
    continueTimer: function continueTimer() {
      if (this.secondsLeft > 0) {
        this.startTimer(this.secondsLeft - 1);
      }
    },
    giveWarning: function giveWarning() {
      speechSynth.text = this.activeReminder.warningMsg;
      window.speechSynthesis.speak(speechSynth);
    },
    timeIsUpMessage: function timeIsUpMessage() {
      speechSynth.text = this.activeReminder.timeIsUpMsg;
      window.speechSynthesis.speak(speechSynth);
    },
    timerResetMessage: function timerResetMessage() {
      speechSynth.text = 'Timer reset. Time left ' + this.activeReminder.durationInMinutes + ' ' + (this.activeReminder.durationInMinutes > 1 ? 'minutes' : 'minute');
      window.speechSynthesis.speak(speechSynth);
    },
    reset: function reset() {
      this.resetTimer();
      this.timerResetMessage();
    },
    startListenVoiceCommands: function startListenVoiceCommands() {var _this3 = this;
      if (this.isListening || !this.supportSpeechRecognition) return;

      this.isListening = true;
      recognition.start();
      recognition.onresult = function (event) {
        var last = event.results.length - 1;
        var transcript = event.results[last][0].transcript;
        var splittedTranscript = transcript.split(' ');
        var isFinal = event.results[last].isFinal;

        _this3.tooltipText = transcript;

        if (transcript == "reset") {
          _this3.resetTimer();
          _this3.timerResetMessage();
        }
        if (
        splittedTranscript.length >= 3 &&
        splittedTranscript[0] == 'timer' &&
        isFinal &&
        numbers.includes(Number(splittedTranscript[1])) && (
        splittedTranscript[2] == 'minute' || splittedTranscript[2] == 'minutes'))
        {
          _this3.activeReminder.durationInMinutes = numbers[splittedTranscript[1]];
          _this3.resetTimer();
          _this3.timerResetMessage();
        }


      };
      recognition.onend = function () {
        _this3.isListening = false;
        _this3.tooltipText == '';
        recognition.stop();
      };
      recognition.onsoundend = function () {
        _this3.isListening = false;
        recognition.stop();
      };
    },
    mouseOver: function mouseOver(type) {
      this.stageBg = settings[type].stageBg;
    },
    mouseOut: function mouseOut() {
      this.stageBg = this.activeReminder.stageBg;
    } } });