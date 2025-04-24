// Voice recognition variables
let recognition;
let isVoiceControlActive = false;
const voiceIndicator = document.getElementById('voice-indicator');
const voiceText = document.getElementById('voice-text');
let lastVoiceCommand = '';
let commandCooldown = false;

// Initialize voice recognition
function initVoiceRecognition() {
  // Check if browser supports speech recognition
  if (!('SpeechRecognition' in window) && !('webkitSpeechRecognition' in window)) {
    alert("Sorry, your browser doesn't support speech recognition. Try Chrome or Edge.");
    return false;
  }
  
  // Create speech recognition instance
  recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
  
  // Configure recognition
  recognition.continuous = true;
  recognition.interimResults = false;
  recognition.lang = 'en-US';
  
  // Set up handlers
  recognition.onstart = function() {
    isVoiceControlActive = true;
    updateVoiceStatus(true);
    console.log("Voice recognition started");
  };
  
  recognition.onend = function() {
    if (isVoiceControlActive) {
      // If still active but ended, restart
      try {
        recognition.start();
      } catch (error) {
        console.error("Error restarting recognition:", error);
        isVoiceControlActive = false;
        updateVoiceStatus(false);
      }
    }
  };
  
  recognition.onerror = function(event) {
    console.error("Voice recognition error:", event.error);
    if (event.error === 'not-allowed') {
      alert("Microphone access denied. Please allow microphone access to use voice controls.");
      isVoiceControlActive = false;
      updateVoiceStatus(false);
    }
  };
  
  // Handle recognition results
  recognition.onresult = function(event) {
    const lastResult = event.results[event.results.length - 1];
    if (lastResult.isFinal) {
      const transcript = lastResult[0].transcript.trim().toLowerCase();
      console.log("Voice command:", transcript);
      
      // Prevent command spam by implementing cooldown
      if (commandCooldown) return;
      
      // Process voice commands
      if (transcript.includes("forward") || transcript.includes("up")) {
        movePlayer('up');
        showVoiceCommand("Forward");
        applyCooldown();
      } else if (transcript.includes("left")) {
        movePlayer('left');
        showVoiceCommand("Left");
        applyCooldown();
      } else if (transcript.includes("right")) {
        movePlayer('right');
        showVoiceCommand("Right");
        applyCooldown();
      } else if (transcript.includes("back") || transcript.includes("down")) {
        movePlayer('down');
        showVoiceCommand("Back");
        applyCooldown();
      } else if (transcript.includes("restart") || transcript.includes("reset")) {
        restartGame();
        showVoiceCommand("Restart");
        applyCooldown();
      }
    }
  };
  
  return true;
}

// Apply a cooldown to commands to prevent accidental multiple executions
function applyCooldown() {
  commandCooldown = true;
  setTimeout(() => {
    commandCooldown = false;
  }, 800); // 800ms cooldown
}

// Start/stop voice recognition
function toggleVoiceRecognition() {
  if (!recognition && !initVoiceRecognition()) {
    return;
  }
  
  if (isVoiceControlActive) {
    // Stop recognition
    recognition.stop();
    isVoiceControlActive = false;
    updateVoiceStatus(false);
  } else {
    // Start recognition
    try {
      recognition.start();
    } catch (error) {
      console.error("Error starting recognition:", error);
      alert("Could not start voice recognition. Please try again.");
    }
  }
}

// Update voice control status display
function updateVoiceStatus(active) {
  if (active) {
    voiceIndicator.classList.remove('inactive');
    voiceIndicator.classList.add('active');
    voiceText.textContent = 'Active';
    document.getElementById('start-voice').textContent = 'Stop Voice Control';
  } else {
    voiceIndicator.classList.remove('active');
    voiceIndicator.classList.add('inactive');
    voiceText.textContent = 'Inactive';
    document.getElementById('start-voice').textContent = 'Start Voice Control';
  }
}

// Display recognized voice command
function showVoiceCommand(command) {
  lastVoiceCommand = command;
  voiceText.textContent = `Active - Command: ${command}`;
  
  // Reset to normal status after 2 seconds
  setTimeout(() => {
    if (isVoiceControlActive && voiceText.textContent.includes(command)) {
      voiceText.textContent = 'Active';
    }
  }, 2000);
}

// Add button event listener
document.getElementById('start-voice').addEventListener('click', toggleVoiceRecognition);