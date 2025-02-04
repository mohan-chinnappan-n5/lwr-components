import { LightningElement, track } from 'lwc';

// refer: https://salesforce.stackexchange.com/questions/154290/bell-notifications-lightning-components
// for aura version

export default class BellAlert extends LightningElement {
    @track notifications = [
        { id: 1, message: "New comment on your post", read: false },
        { id: 2, message: "Your order has been shipped", read: false },
        { id: 3, message: "Upcoming event reminder", read: false }
    ];
    
    @track showDropdown = false;

    // Getter to compute unread count
    get unreadCount() {
        return this.notifications.filter(n => !n.read).length;
    }

    // Toggle dropdown visibility
    toggleDropdown() {
        this.showDropdown = !this.showDropdown;
    }

    // Mark a single notification as read
    markAsRead(event) {
        const notificationId = parseInt(event.target.dataset.id);
        this.notifications = this.notifications.map(notification =>
            notification.id === notificationId ? { ...notification, read: true } : notification
        );
    }

    // Mark all notifications as read
    markAllAsRead() {
        this.notifications = this.notifications.map(notification => ({ ...notification, read: true }));
    }
}