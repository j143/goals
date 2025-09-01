document.addEventListener('DOMContentLoaded', function() {
  const careerGoalInput = document.getElementById('careerGoal');
  const saveBtn = document.getElementById('saveBtn');
  const clearBtn = document.getElementById('clearBtn');
  const currentGoalDiv = document.getElementById('currentGoal');
  const goalTextSpan = document.getElementById('goalText');
  const statusDiv = document.getElementById('status');
  
  // Load existing goal when popup opens
  loadCurrentGoal();
  
  // Save goal button handler
  saveBtn.addEventListener('click', function() {
    const goal = careerGoalInput.value.trim();
    
    if (goal.length === 0) {
      showStatus('Please enter a career goal', false);
      return;
    }
    
    if (goal.length > 100) {
      showStatus('Goal too long. Please keep it under 100 characters', false);
      return;
    }
    
    // Save to Chrome storage
    chrome.storage.local.set({ 'careerGoal': goal }, function() {
      if (chrome.runtime.lastError) {
        showStatus('Error saving goal. Please try again.', false);
        return;
      }
      
      showStatus('Goal saved successfully!', true);
      loadCurrentGoal();
      careerGoalInput.value = '';
      
      // Notify content script about the goal update
      chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
        if (tabs[0] && tabs[0].url && tabs[0].url.includes('linkedin.com')) {
          chrome.tabs.sendMessage(tabs[0].id, {
            action: 'goalUpdated',
            goal: goal
          }).catch(() => {
            // Ignore errors if content script is not loaded
          });
        }
      });
    });
  });
  
  // Clear goal button handler
  clearBtn.addEventListener('click', function() {
    chrome.storage.local.remove('careerGoal', function() {
      if (chrome.runtime.lastError) {
        showStatus('Error clearing goal. Please try again.', false);
        return;
      }
      
      showStatus('Goal cleared', true);
      currentGoalDiv.style.display = 'none';
      clearBtn.style.display = 'none';
      careerGoalInput.value = '';
      
      // Notify content script about the goal removal
      chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
        if (tabs[0] && tabs[0].url && tabs[0].url.includes('linkedin.com')) {
          chrome.tabs.sendMessage(tabs[0].id, {
            action: 'goalCleared'
          }).catch(() => {
            // Ignore errors if content script is not loaded
          });
        }
      });
    });
  });
  
  // Enter key handler for input
  careerGoalInput.addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
      saveBtn.click();
    }
  });
  
  function loadCurrentGoal() {
    chrome.storage.local.get('careerGoal', function(result) {
      if (result.careerGoal) {
        goalTextSpan.textContent = result.careerGoal;
        currentGoalDiv.style.display = 'block';
        clearBtn.style.display = 'inline-block';
      } else {
        currentGoalDiv.style.display = 'none';
        clearBtn.style.display = 'none';
      }
    });
  }
  
  function showStatus(message, isSuccess) {
    statusDiv.textContent = message;
    statusDiv.className = 'status ' + (isSuccess ? 'success' : 'error');
    statusDiv.style.display = 'block';
    
    // Hide status after 3 seconds
    setTimeout(function() {
      statusDiv.style.display = 'none';
    }, 3000);
  }
});