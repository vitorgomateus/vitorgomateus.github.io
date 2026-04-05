// Alert system

let alertTimeout = null;

// Show an alert
export function showAlert(message, type = 'info', options = {}) {
  const container = document.getElementById('alerts-content') || document.getElementById('alerts-container');
  if (!container) return;

  const alert = document.createElement('div');
  alert.className = `alert alert--${type}`;
  alert.setAttribute('role', 'alert');

  // Icon
  const iconMap = { info: 'info', success: 'check-circle', error: 'x-circle', primary: 'cpu' };
  const icon = document.createElement('span');
  icon.className = 'alert__icon';
  icon.innerHTML = `<i data-feather="${iconMap[type] || 'info'}"></i>`;
  alert.appendChild(icon);

  // Text (support HTML if options.html is true)
  const text = document.createElement('span');
  text.className = 'alert__text';
  if (options.html) {
    text.innerHTML = message;
  } else {
    text.textContent = message;
  }
  alert.appendChild(text);

  // Click handler if provided
  if (options.onClick) {
    alert.style.cursor = 'pointer';
    alert.addEventListener('click', (e) => {
      if (!e.target.closest('.alert__dismiss')) {
        options.onClick();
        alert.remove();
      }
    });
  }

  // Dismiss button
  const dismiss = document.createElement('button');
  dismiss.className = 'alert__dismiss';
  dismiss.setAttribute('aria-label', 'Dismiss alert');
  dismiss.innerHTML = '<i data-feather="x"></i>';
  dismiss.addEventListener('click', () => {
    alert.remove();
  });
  alert.appendChild(dismiss);

  container.appendChild(alert);

  // Render feather icons
  if (window.feather) window.feather.replace();

  // Auto-dismiss after configurable time (default 5s)
  const autoDismissTime = options.autoDismiss !== undefined ? options.autoDismiss : 5000;
  if (autoDismissTime > 0) {
    setTimeout(() => {
      if (alert.parentNode) alert.remove();
    }, autoDismissTime);
  }

  return alert;
}
