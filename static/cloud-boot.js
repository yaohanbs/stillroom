// Choose a separate cache for each account before the app reads any study data.
window.stillroomScope = localStorage.getItem('stillroom-account') || 'guest';
window.stillroomStorageKey = () => window.stillroomScope === 'guest' ? 'stillroom' : 'stillroom-user-' + window.stillroomScope;
if (window.STILLROOM_CLOUD) document.documentElement.classList.add('auth-loading');
