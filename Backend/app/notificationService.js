/* eslint-disable no-undef */
/* eslint-disable @typescript-eslint/no-require-imports */
// utils/notification.js
const Notification = require('../notification/models/notification'); 

async function createNotification({ id, me, route, transaction }) {
  try {
    const options = {};
    if (transaction) {
      // Only attach transaction if explicitly passed
      options.transaction = transaction;
    }

    await Notification.create(
      {
        userId: id,
        message: me,
        isRead: false,
        route,
      },
      options
    );
  } catch (error) {
    console.error("Error creating notification:", error);
    throw error;
  }
}


// const id = userIds[0];
// const me = `Important Announcement - ${message}`;
// const route = `/login/announcements`;

// createNotification({ id, me, route });
module.exports = { createNotification };
