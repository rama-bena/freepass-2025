import Session from '../models/sessionModel.js';
import logger from '../utils/logger.js';
import {
  SessionStatus,
  HttpStatusCode,
  ResponseError,
} from '../utils/types.js';

const getAllSessions = async (req, res) => {
  logger.debug(`request getAllSession from ${req.user.username}`);
  try {
    const sessions = await Session.find()
      .populate('created_by', 'username')
      .populate('participants', 'username');

    return res.json(sessions);
  } catch (err) {
    logger.error(`Error getAllSession: ${err.message}`, {
      error: err.stack,
    });
    return res.status(HttpStatusCode.INTERNAL_SERVER_ERROR).json({
      error: ResponseError.INTERNAL_SERVER_ERROR,
      message: 'Failed to fetch sessions: ' + err.message,
    });
  }
};

const registerForSession = async (req, res) => {
  logger.debug(`request registerForSession from ${req.user.username}`);
  const { sessionId } = req.params;
  const userId = req.user._id;

  try {
    const session = await Session.findById(sessionId);

    // Ensure session exists
    if (!session) {
      logger.warn(`Session with ID ${sessionId} not found`);
      return res.status(HttpStatusCode.NOT_FOUND).json({
        error: ResponseError.NOT_FOUND,
        message: 'Session not found',
      });
    }

    // Ensure session is upcoming
    if (session.status !== SessionStatus.UPCOMING) {
      logger.warn(
        `Session with ID ${sessionId} not available for registration`
      );
      return res.status(HttpStatusCode.BAD_REQUEST).json({
        error: ResponseError.INVALID,
        message: 'Session not available for registration',
      });
    }

    // Ensure user is not already registered for the session
    if (session.participants.includes(userId)) {
      logger.warn(`User ${userId} already registered for session ${sessionId}`);
      return res.status(HttpStatusCode.CONFLICT).json({
        error: ResponseError.SESSION_OVERLAP,
        message: 'You are already registered for this session',
      });
    }

    // Ensure user is not registering for multiple sessions at the same time
    const ONE_HOUR = 3600000;
    const overlappingSession = await Session.findOne({
      time: {
        $gte: new Date(session.time.getTime() - ONE_HOUR),
        $lte: new Date(session.time.getTime() + ONE_HOUR),
      },
      participants: userId,
    });

    if (overlappingSession) {
      logger.warn(`Session conflict with session ${overlappingSession.title}`);
      return res.status(HttpStatusCode.CONFLICT).json({
        error: ResponseError.SESSION_OVERLAP,
        message: `Session conflict with session ${overlappingSession.title}`,
      });
    }

    // ensure session is not full
    if (session.participants.length >= session.maximum_participants) {
      logger.warn(`Session ${sessionId} is full`);
      return res.status(HttpStatusCode.BAD_REQUEST).json({
        error: ResponseError.SESSION_FULL,
        message: 'Session is full',
      });
    }

    session.participants.push(userId);
    await session.save();

    return res.json({ message: 'Successfully registered for the session' });
  } catch (err) {
    logger.error(`Error registering for session: ${err.message}`, {
      error: err.stack,
    });
    res.status(HttpStatusCode.INTERNAL_SERVER_ERROR).json({
      error: ResponseError.INTERNAL_SERVER_ERROR,
      message: `Registration failed ${err.message}`,
    });
  }
};

export { getAllSessions, registerForSession };
