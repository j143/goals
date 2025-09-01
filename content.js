// LinkedIn Career Questions Content Script
class LinkedInCareerQuestions {
  constructor() {
    this.userGoal = '';
    this.overlay = null;
    this.overlayTimeout = null;
    this.lastProcessedPosts = new Set();
    this.isOverlayVisible = false;
    
    this.init();
  }
  
  async init() {
    // Load user goal from storage
    await this.loadUserGoal();
    
    // Only proceed if user has set a goal
    if (!this.userGoal) {
      console.log('LinkedIn Career Questions: No goal set. Open extension popup to set your career goal.');
      return;
    }
    
    // Create overlay element
    this.createOverlay();
    
    // Start observing LinkedIn content
    this.startContentObserver();
    
    // Listen for messages from popup
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      if (message.action === 'goalUpdated') {
        this.userGoal = message.goal;
        console.log('LinkedIn Career Questions: Goal updated to:', this.userGoal);
      } else if (message.action === 'goalCleared') {
        this.userGoal = '';
        this.hideOverlay();
        console.log('LinkedIn Career Questions: Goal cleared');
      }
    });
  }
  
  async loadUserGoal() {
    return new Promise((resolve) => {
      chrome.storage.local.get('careerGoal', (result) => {
        this.userGoal = result.careerGoal || '';
        resolve();
      });
    });
  }
  
  createOverlay() {
    this.overlay = document.createElement('div');
    this.overlay.id = 'linkedin-career-overlay';
    this.overlay.innerHTML = `
      <div class="question-content">
        <div class="question-text"></div>
        <div class="button-group">
          <button class="btn-relevant">Yes/Relevant</button>
          <button class="btn-skip">No/Skip</button>
        </div>
      </div>
    `;
    
    // Add event listeners
    this.overlay.querySelector('.btn-relevant').addEventListener('click', () => {
      this.trackResponse('relevant');
      this.hideOverlay();
    });
    
    this.overlay.querySelector('.btn-skip').addEventListener('click', () => {
      this.trackResponse('skip');
      this.hideOverlay();
    });
    
    document.body.appendChild(this.overlay);
  }
  
  startContentObserver() {
    // Initial scan
    this.scanVisibleContent();
    
    // Create intersection observer for new posts
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          this.analyzePost(entry.target);
        }
      });
    }, {
      threshold: 0.5,
      rootMargin: '0px 0px -10% 0px'
    });
    
    // Observe LinkedIn feed posts
    const feedContainer = document.querySelector('.scaffold-layout__detail, .feed-container, .core-rail');
    if (feedContainer) {
      const observerCallback = () => {
        const posts = feedContainer.querySelectorAll('div[data-id^="urn:li:activity"], .feed-shared-update-v2, .occludable-update');
        posts.forEach(post => {
          if (!post.hasAttribute('data-career-observed')) {
            post.setAttribute('data-career-observed', 'true');
            observer.observe(post);
          }
        });
      };
      
      // Initial observation
      observerCallback();
      
      // Watch for new posts
      const mutationObserver = new MutationObserver(observerCallback);
      mutationObserver.observe(feedContainer, {
        childList: true,
        subtree: true
      });
    }
  }
  
  scanVisibleContent() {
    const posts = document.querySelectorAll('div[data-id^="urn:li:activity"], .feed-shared-update-v2, .occludable-update');
    posts.forEach(post => this.analyzePost(post));
  }
  
  analyzePost(postElement) {
    if (!this.userGoal || this.isOverlayVisible) return;
    
    const postId = this.getPostId(postElement);
    if (this.lastProcessedPosts.has(postId)) return;
    
    this.lastProcessedPosts.add(postId);
    
    const postText = this.extractPostText(postElement);
    if (!postText) return;
    
    const contentType = this.detectContentType(postText, postElement);
    const question = this.generateQuestion(contentType, postText);
    
    if (question) {
      this.showOverlay(question);
    }
  }
  
  getPostId(postElement) {
    return postElement.getAttribute('data-id') || 
           postElement.querySelector('[data-id]')?.getAttribute('data-id') ||
           postElement.innerHTML.substring(0, 50);
  }
  
  extractPostText(postElement) {
    const textSelectors = [
      '.feed-shared-text',
      '.update-components-text',
      '.feed-shared-update-v2__description',
      '[data-id*="text"]',
      '.feed-shared-inline-show-more-text'
    ];
    
    for (const selector of textSelectors) {
      const textElement = postElement.querySelector(selector);
      if (textElement) {
        return textElement.textContent.trim().toLowerCase();
      }
    }
    
    return postElement.textContent.trim().toLowerCase();
  }
  
  detectContentType(postText, postElement) {
    // Check for job posting indicators
    const jobKeywords = ['hiring', 'job opening', 'we\'re looking for', 'join our team', 'position available', 'apply now', 'job opportunity'];
    if (jobKeywords.some(keyword => postText.includes(keyword)) || 
        postElement.querySelector('.job-flavored-entity, .jobs-search-result')) {
      return 'job';
    }
    
    // Check for company news/updates
    const companyKeywords = ['announced', 'launching', 'proud to share', 'excited to announce', 'company update'];
    if (companyKeywords.some(keyword => postText.includes(keyword))) {
      return 'company';
    }
    
    // Check for skill mentions
    const skillKeywords = ['skills', 'learning', 'certification', 'course', 'training', 'development', 'technology'];
    const goalRelatedWords = this.userGoal.toLowerCase().split(' ');
    if (skillKeywords.some(keyword => postText.includes(keyword)) ||
        goalRelatedWords.some(word => word.length > 2 && postText.includes(word))) {
      return 'skill';
    }
    
    // Default to network post
    return 'network';
  }
  
  generateQuestion(contentType, postText) {
    const questions = {
      job: "Is this role aligned with your career direction?",
      company: "Should you research this company further?",
      skill: "Do you need to develop this skill?",
      network: "Worth engaging with this person?"
    };
    
    // Only show questions occasionally to avoid overwhelming (70% chance)
    if (Math.random() > 0.7) return null;
    
    return questions[contentType] || questions.network;
  }
  
  showOverlay(question) {
    if (this.isOverlayVisible) return;
    
    this.overlay.querySelector('.question-text').textContent = question;
    this.overlay.classList.add('visible');
    this.isOverlayVisible = true;
    
    // Auto-hide after 5 seconds
    this.overlayTimeout = setTimeout(() => {
      this.hideOverlay();
    }, 5000);
  }
  
  hideOverlay() {
    if (this.overlayTimeout) {
      clearTimeout(this.overlayTimeout);
      this.overlayTimeout = null;
    }
    
    this.overlay.classList.remove('visible');
    this.isOverlayVisible = false;
  }
  
  trackResponse(response) {
    // Simple tracking - could be expanded later
    console.log('LinkedIn Career Questions: Response -', response);
    
    // Store response in local storage for potential analytics
    chrome.storage.local.get('responseStats', (result) => {
      const stats = result.responseStats || { relevant: 0, skip: 0 };
      stats[response]++;
      stats.total = stats.relevant + stats.skip;
      
      chrome.storage.local.set({ responseStats: stats });
    });
  }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    new LinkedInCareerQuestions();
  });
} else {
  new LinkedInCareerQuestions();
}