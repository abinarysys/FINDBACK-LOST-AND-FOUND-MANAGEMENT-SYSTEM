
(() => {
    if (typeof window.io !== 'function') {
        console.error('Socket.IO client was not loaded.');
        return;
    }

    const socket = window.io();

    socket.on('notification', (notification) => {
        // Update the notification count if the page displays one.
        const count = document.querySelector('.notification-count');

        if (count) {
            const currentText = count.textContent.trim();
            const currentCount = parseInt(currentText, 10) || 0;
            const newCount = currentCount + 1;

            count.textContent =
                `${newCount} ${newCount === 1 ? 'notification' : 'notifications'}`;
        }

        // Reload to retrieve the saved notification and its joined item details.
        if (document.querySelector('.notifications-content')) {
            window.location.reload();
            return;
        }

        // On other pages, show a simple notice.
        if (notification && notification.title) {
            console.info('New notification:', notification.title);
        }
    });
})();
