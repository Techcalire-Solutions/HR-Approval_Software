/* eslint-disable no-undef */
/* eslint-disable @typescript-eslint/no-require-imports */
// utils/notification.js
const Notification = require('../notification/models/notification'); 

async function createNotification({ id, me, route, transaction }) {
  try {
    await Notification.create(
      {
        userId: id, message: me, isRead: false, route,
      },
      { transaction }
    );
  } catch (error) {
    console.error('Error creating notification:', error);
    throw error;
  }
}

// const id = userIds[0];
// const me = `Important Announcement - ${message}`;
// const route = `/login/announcements`;

// createNotification({ id, me, route });
module.exports = { createNotification };
