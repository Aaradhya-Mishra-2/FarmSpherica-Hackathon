/* ============================================================
   FARMSPHERICA — about.js
   Tab navigation switcher & form submission handlers
   ============================================================ */

(function () {
  'use strict';

  // 1. Tab switching logic
  const tabButtons = document.querySelectorAll('.about-tab-btn');
  const panels = document.querySelectorAll('.about-panel');
  const tabSection = document.querySelector('.about-tabs-container');

  if (tabButtons.length && panels.length) {
    tabButtons.forEach(button => {
      button.addEventListener('click', () => {
        const targetId = button.getAttribute('data-target');

        // Remove active state from all buttons & hide all panels
        tabButtons.forEach(btn => btn.classList.remove('active'));
        panels.forEach(panel => panel.classList.remove('active'));

        // Activate current button & show corresponding panel
        button.classList.add('active');
        const activePanel = document.getElementById(targetId);
        if (activePanel) {
          activePanel.classList.add('active');
        }

        // Smooth scroll to the top of the tab navigation area
        if (tabSection) {
          const offset = tabSection.getBoundingClientRect().top + window.scrollY - 80;
          window.scrollTo({ top: offset, behavior: 'smooth' });
        }
      });
    });
  }

  // 2. Enquiry form handler
  const form = document.getElementById('about-enquiry-form');
  const successAlert = document.getElementById('enquiry-form-success');

  if (form && successAlert) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();

      // Collect values
      const name = document.getElementById('form-name').value;
      const email = document.getElementById('form-email').value;
      const subject = document.getElementById('form-subject').value;
      const message = document.getElementById('form-message').value;

      if (name && email && subject && message) {
        // Hide the form fields
        form.style.display = 'none';

        // Show success alert
        successAlert.style.display = 'flex';

        // Reset form
        form.reset();
      }
    });
  }

})();
