// public/js/notify.js  - include on user pages AFTER /socket.io/socket.io.js
// Shows a small toast when the server pushes a notification (e.g. claim verified).
(function () {
    if (!window.io) return;
    var socket = io();
    socket.on('notification', function (n) {
        var box = document.createElement('div');
        box.style.cssText = 'position:fixed;right:16px;bottom:16px;max-width:340px;z-index:9999;background:#fff;' +
            'border:1px solid #ddd;border-left:4px solid ' + (n.type === 'claim_verified' ? '#16a34a' : '#dc2626') +
            ';border-radius:8px;padding:12px 14px;box-shadow:0 6px 20px rgba(0,0,0,.15);font-family:inherit;font-size:14px';
        var title = document.createElement('strong'); title.textContent = n.title;
        var msg = document.createElement('p'); msg.textContent = n.message; msg.style.margin = '6px 0 0';
        box.appendChild(title); box.appendChild(msg);
        if (n.link) { box.style.cursor = 'pointer'; box.onclick = function () { location.href = n.link; }; }
        document.body.appendChild(box);
        setTimeout(function () { box.remove(); }, 10000);
    });
})();
