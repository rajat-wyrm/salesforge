const { prisma } = require("../config/postgres");
const { sendPushNotification } = require("../services/pushService");

exports.subscribe = async (req, res, next) => {
  try {
    const { token } = req.body;
    if (!token) {
      return res.status(400).json({ success: false, message: "Token is required" });
    }

    const userId = req.user.id;

    // Use upsert to create or update the token tied to the user
    // This overwrites old tokens for the same user or if the token was assigned to someone else
    await prisma.fcmToken.upsert({
      where: { token },
      update: { userId },
      create: { token, userId },
    });

    res.status(200).json({ success: true, message: "Token saved successfully" });
  } catch (error) {
    next(error);
  }
};

exports.notify = async (req, res, next) => {
  try {
    const { title, body, icon, targetUserId } = req.body;
    
    // Allow sending to self for testing, or specifying a target user
    const userId = targetUserId ? parseInt(targetUserId, 10) : req.user.id; 

    const result = await sendPushNotification(userId, { title, body, icon });

    if (!result.success) {
      // 404 if no tokens, 500 otherwise
      const statusCode = result.message === "No FCM tokens found for user" ? 404 : 500;
      return res.status(statusCode).json(result);
    }

    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};
