import User from '../models/userModel.js';
import { Role, HttpStatusCode, ResponseError } from '../utils/types.js';
import logger from '../utils/logger.js';

const addEventCoordinator = async (req, res) => {
  const { userId } = req.params;
  logger.debug(`Request add event Coordinator from ${req.user.username}`);
  try {
    const user = await User.findById(userId);

    if (!user) {
      logger.warn(`User with ID ${userId} not found`);
      return res.status(HttpStatusCode.NOT_FOUND).json({
        error: ResponseError.NOT_FOUND,
        message: 'User not found',
      });
    }

    if (user.role === Role.EVENT_COORDINATOR) {
      logger.warn(`User with ID ${userId} is already an event coordinator`);
      return res.status(HttpStatusCode.BAD_REQUEST).json({
        error: ResponseError.INVALID,
        message: 'User is already an event coordinator',
      });
    }

    user.role = Role.EVENT_COORDINATOR;
    await user.save();
    logger.debug(`User with ID ${userId} promoted to Event Coordinator`);
    return res.json({
      message: 'User successfully promoted to Event Coordinator',
    });
  } catch (err) {
    logger.error(`Error adding Event Coordinator: ${err.message}`, {
      error: err.stack,
    });
    return res.status(HttpStatusCode.INTERNAL_SERVER_ERROR).json({
      error: ResponseError.INTERNAL_SERVER_ERROR,
      message: `Failed to promote user to Event Coordinator: ${err.message}`,
    });
  }
};

const removeUser = async (req, res) => {
  logger.debug(`Request remove user from ${req.user.username}`);
  const { userId } = req.params;

  try {
    const user = await User.findById(userId);
    if (!user) {
      logger.warn(`User with ID ${userId} not found`);
      return res.status(HttpStatusCode.NOT_FOUND).json({
        error: ResponseError.NOT_FOUND,
        message: 'User not found',
      });
    }

    await user.remove();
    logger.debug(`User ${user.username} removed`);
    return res.json({ message: 'User removed successfully' });
  } catch (err) {
    logger.error(`Error removing user: ${err.message}`, { error: err.stack });
    return res.status(HttpStatusCode.INTERNAL_SERVER_ERROR).json({
      error: ResponseError.INTERNAL_SERVER_ERROR,
      message: `Failed to remove user: ${err.message}`,
    });
  }
};

export { addEventCoordinator, removeUser };
