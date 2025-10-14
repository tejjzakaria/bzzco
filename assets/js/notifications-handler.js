// Notifications Handler - Loads and displays user notifications
(async function initNotifications() {
    // Wait for DOM to be ready
    await new Promise(resolve => {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', resolve);
        } else {
            resolve();
        }
    });

    // Wait for tokenManager to be ready
    await new Promise(resolve => setTimeout(resolve, 300));

    if (!window.tokenManager || !window.tokenManager.hasToken()) {
        return; // User not authenticated
    }

    let notifications = [];
    let unreadCount = 0;

    // Load notifications
    async function loadNotifications() {
        try {
            console.log('[Notifications] Loading notifications...');
            const response = await window.tokenManager.makeAuthenticatedRequest('/api/user/notifications');

            console.log('[Notifications] Response received:', response?.status);

            if (response && response.ok) {
                const data = await response.json();
                console.log('[Notifications] Data received:', data);

                if (data.success) {
                    notifications = data.notifications || [];
                    unreadCount = data.unreadCount || 0;
                    console.log('[Notifications] Loaded:', notifications.length, 'notifications, unread:', unreadCount);
                    updateNotificationUI();
                } else {
                    console.error('[Notifications] API returned success:false', data);
                }
            } else {
                console.error('[Notifications] Response not OK:', response?.status, response?.statusText);
                if (response) {
                    const text = await response.text();
                    console.error('[Notifications] Response body:', text);
                }
            }
        } catch (error) {
            console.error('[Notifications] Error loading notifications:', error);
        }
    }

    // Update notification UI
    function updateNotificationUI() {
        console.log('[Notifications] Updating UI with', notifications.length, 'notifications');
        const countBadge = document.getElementById('notificationCount');
        const notificationBadge = document.getElementById('notificationBadge');
        const notificationsList = document.getElementById('notificationsList');

        console.log('[Notifications] Elements found:', {
            countBadge: !!countBadge,
            notificationBadge: !!notificationBadge,
            notificationsList: !!notificationsList
        });

        // Update count badge
        if (countBadge) {
            if (unreadCount > 0) {
                countBadge.textContent = unreadCount > 9 ? '9+' : unreadCount;
                countBadge.style.display = 'flex';
                countBadge.style.visibility = 'visible';

                // Get badge position and visibility info for debugging
                const rect = countBadge.getBoundingClientRect();
                const computedStyle = window.getComputedStyle(countBadge);

                console.log('[Notifications] Badge updated to:', countBadge.textContent);
                console.log('[Notifications] Badge position:', {
                    top: rect.top,
                    left: rect.left,
                    width: rect.width,
                    height: rect.height,
                    visible: rect.width > 0 && rect.height > 0
                });
                console.log('[Notifications] Badge styles:', {
                    display: computedStyle.display,
                    visibility: computedStyle.visibility,
                    opacity: computedStyle.opacity,
                    position: computedStyle.position,
                    zIndex: computedStyle.zIndex,
                    transform: computedStyle.transform
                });
            } else {
                countBadge.style.display = 'none';
                console.log('[Notifications] Badge hidden (no unread)');
            }
        } else {
            console.error('[Notifications] Badge element not found! Looking for #notificationCount');
        }

        // Update notification badge in dropdown
        if (notificationBadge) {
            notificationBadge.textContent = unreadCount > 0 ? `${unreadCount} New` : '0 New';
        }

        // Update notifications list
        if (notificationsList) {
            if (notifications.length === 0) {
                notificationsList.innerHTML = `
                    <div class="text-center py-4">
                        <i class="icon-base ri ri-notification-off-line icon-48px text-muted mb-2"></i>
                        <p class="text-muted mb-0">No notifications</p>
                    </div>
                `;
            } else {
                console.log('[Notifications] Rendering', notifications.length, 'notifications');
                console.log('[Notifications] Raw notifications data:', notifications);
                const renderedHTML = notifications.map(notif => renderNotification(notif)).join('');
                console.log('[Notifications] Rendered HTML length:', renderedHTML.length);
                console.log('[Notifications] Rendered HTML preview:', renderedHTML.substring(0, 200));
                notificationsList.innerHTML = renderedHTML;
                console.log('[Notifications] notificationsList innerHTML set, current length:', notificationsList.innerHTML.length);

                // Force the rendered HTML to stay - protect against clearing
                Object.defineProperty(notificationsList, 'innerHTML', {
                    get() {
                        return this.getAttribute('data-rendered-html') || '';
                    },
                    set(value) {
                        // Only allow setting if it's our rendered content or longer
                        if (value.length >= renderedHTML.length || value.includes('list-group-item-action')) {
                            this.setAttribute('data-rendered-html', value);
                            HTMLDivElement.prototype.__lookupSetter__('innerHTML').call(this, value);
                        } else {
                            console.warn('[Notifications] Blocked attempt to clear notifications! Attempted value length:', value.length);
                        }
                    },
                    configurable: true
                });

                // Store the rendered HTML
                notificationsList.setAttribute('data-rendered-html', renderedHTML);

                // Check if innerHTML persists after a brief delay
                setTimeout(() => {
                    console.log('[Notifications] After 100ms, innerHTML length:', notificationsList.innerHTML.length);
                    console.log('[Notifications] After 100ms, first 100 chars:', notificationsList.innerHTML.substring(0, 100));
                }, 100);
            }
        }
    }

    // Render single notification
    function renderNotification(notif) {
        const isUnread = !notif.readBy || !notif.readBy.some(r => r.userId === window.tokenManager.getUserId());
        const typeColors = {
            'info': 'bg-label-info',
            'success': 'bg-label-success',
            'warning': 'bg-label-warning',
            'error': 'bg-label-danger',
            'announcement': 'bg-label-primary'
        };
        const iconClass = notif.icon || 'ri-notification-line';
        const typeColor = typeColors[notif.type] || 'bg-label-info';

        return `
            <div class="list-group-item list-group-item-action ${isUnread ? 'bg-label-primary' : ''}"
                 data-notification-id="${notif._id}"
                 style="cursor: pointer;">
                <div class="d-flex">
                    <div class="flex-shrink-0 me-3">
                        <div class="avatar">
                            <span class="avatar-initial rounded ${typeColor}">
                                <i class="icon-base ri ${iconClass}"></i>
                            </span>
                        </div>
                    </div>
                    <div class="flex-grow-1">
                        <div class="d-flex justify-content-between align-items-start">
                            <h6 class="mb-1">${notif.title}</h6>
                            ${isUnread ? '<span class="badge bg-primary badge-sm">New</span>' : ''}
                        </div>
                        <p class="mb-1 text-muted small">${notif.message}</p>
                        <small class="text-muted">${formatRelativeTime(notif.createdAt)}</small>
                    </div>
                </div>
            </div>
        `;
    }

    // Format relative time
    function formatRelativeTime(dateString) {
        const date = new Date(dateString);
        const now = new Date();
        const diffInSeconds = Math.floor((now - date) / 1000);

        if (diffInSeconds < 60) return 'Just now';
        if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
        if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
        if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;
        return date.toLocaleDateString();
    }

    // Handle notification click
    document.addEventListener('click', async function(e) {
        const notifItem = e.target.closest('[data-notification-id]');
        if (!notifItem) return;

        const notifId = notifItem.dataset.notificationId;
        const notif = notifications.find(n => n._id === notifId);
        if (!notif) return;

        // Mark as read
        try {
            await window.tokenManager.makeAuthenticatedRequest(
                `/api/notifications/${notifId}/read`,
                { method: 'POST' }
            );

            // Track click if has action URL
            if (notif.actionUrl) {
                await window.tokenManager.makeAuthenticatedRequest(
                    `/api/notifications/${notifId}/click`,
                    { method: 'POST' }
                );
            }

            // Reload notifications
            await loadNotifications();

            // Navigate to action URL if present
            if (notif.actionUrl) {
                window.location.href = notif.actionUrl;
            }
        } catch (error) {
            // Silent fail
        }
    });

    // Listen for dropdown show event and re-render if needed
    const dropdownElement = document.querySelector('[data-bs-toggle="dropdown"]#notificationBell');
    if (dropdownElement) {
        // Listen for Bootstrap dropdown events
        dropdownElement.addEventListener('show.bs.dropdown', () => {
            console.log('[Notifications] Dropdown about to show, re-rendering notifications...');
            updateNotificationUI();
        });

        dropdownElement.addEventListener('shown.bs.dropdown', () => {
            console.log('[Notifications] Dropdown shown');
            const notificationsList = document.getElementById('notificationsList');
            if (notificationsList) {
                console.log('[Notifications] After dropdown shown, innerHTML length:', notificationsList.innerHTML.length);
                console.log('[Notifications] After dropdown shown, FULL innerHTML:', notificationsList.innerHTML);
                console.log('[Notifications] After dropdown shown, children count:', notificationsList.children.length);
                console.log('[Notifications] After dropdown shown, children:', notificationsList.children);
            }
        });
    }

    // Add a global function you can call from console to check current state
    window.checkNotifications = function() {
        const notificationsList = document.getElementById('notificationsList');
        console.log('=== NOTIFICATION CHECK ===');
        console.log('Element:', notificationsList);
        console.log('innerHTML length:', notificationsList?.innerHTML.length);
        console.log('innerHTML:', notificationsList?.innerHTML);
        console.log('children:', notificationsList?.children);
        console.log('data attribute:', notificationsList?.getAttribute('data-rendered-html')?.length);
        console.log('Notifications array:', notifications);
        console.log('=========================');
    };

    // Log viewport info
    console.log('[Notifications] Viewport width:', window.innerWidth);
    console.log('[Notifications] User agent:', navigator.userAgent);

    // Initial load
    await loadNotifications();

    // Poll for new notifications every 30 seconds
    setInterval(loadNotifications, 30000);

})();
