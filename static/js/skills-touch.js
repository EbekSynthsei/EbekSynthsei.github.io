// Adds touch support for .skill-item hover effect on mobile devices

document.addEventListener('DOMContentLoaded', function () {
  // Only activate on touch devices
  if ('ontouchstart' in window) {
    const skillItems = document.querySelectorAll('.skill-item');
    skillItems.forEach(function (item) {
      item.addEventListener('touchstart', function () {
        // Remove .touched from all others
        skillItems.forEach(i => i.classList.remove('touched'));
        // Add .touched to this one
        item.classList.add('touched');
      });
      item.addEventListener('touchend', function () {
        // Optionally remove after a delay
        setTimeout(() => {
          item.classList.remove('touched');
        }, 400);
      });
    });
    // Remove .touched if user scrolls or taps elsewhere
    document.body.addEventListener('touchstart', function (e) {
      if (!e.target.closest('.skill-item')) {
        skillItems.forEach(i => i.classList.remove('touched'));
      }
    });
  }
});
