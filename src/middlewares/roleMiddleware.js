import { HttpStatusCode, ResponseError } from '../utils/types.js';
import logger from '../utils/logger.js';

const checkUserRole = (allowedRoles) => {
  return (req, res, next) => {
    const userRole = req.user.role;

    if (!allowedRoles.includes(userRole)) {
      logger.warn(`Forbidden access attempt by user: ${req.user.username}`);
      return res.status(HttpStatusCode.FORBIDDEN).json({
        error: ResponseError.FORBIDDEN,
        message: 'You do not have permission to access this resource',
      });
    }

    logger.info(`User role validated: ${req.user.username} with role ${userRole}`);
    next();
  };
};

export default checkUserRole;
