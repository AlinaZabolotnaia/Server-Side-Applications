// Клиент WebSocket-уведомлений: слушает событие courseCreated и показывает сообщение без перезагрузки страницы

(function () {
    if (typeof io === 'undefined') {
        return;   // скрипт Socket.IO не загрузился: страница работает и без уведомлений
    }

    const HIDE_AFTER_MS = 10000;
    const panel = document.getElementById('notifications');
    const list = panel.querySelector('.notifications-list');
    const socket = io();

    function updatePanelVisibility() {
        panel.hidden = list.children.length === 0;
    }

    function removeNotification(item) {
        item.remove();
        updatePanelVisibility();
    }

    // Элементы создаются через textContent, а не innerHTML: название курса не может внедрить HTML/JS
    function addText(parent, tag, className, text) {
        const element = document.createElement(tag);
        element.className = className;
        element.textContent = text;
        parent.appendChild(element);
        return element;
    }

    socket.on('courseCreated', (data) => {
        const item = document.createElement('div');
        item.className = 'notification';

        const closeButton = addText(item, 'button', 'notification-close', '×');
        closeButton.type = 'button';
        closeButton.setAttribute('aria-label', 'Закрыть уведомление');
        closeButton.addEventListener('click', () => removeNotification(item));

        addText(item, 'p', 'notification-heading', `Добавлен новый курс: ${data.title}`);
        addText(item, 'p', 'notification-text', `Преподаватель: ${data.teacherName}`);
        addText(item, 'p', 'notification-time', new Date(data.createdAt).toLocaleString('ru-RU'));

        list.prepend(item);
        updatePanelVisibility();

        setTimeout(() => removeNotification(item), HIDE_AFTER_MS);
    });
})();
