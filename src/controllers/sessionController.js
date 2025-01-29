import Session from '../models/sessionModel.js';
import logger from '../utils/logger.js';
import {
  SessionStatus,
  HttpStatusCode,
  ResponseError,
} from '../utils/types.js';

export const getAllSessions = async (req, res) => {
  logger.debug('request getAllSession');
  try {
    const sessions = await Session.find({
      status: { $nin: [SessionStatus.PROPOSAL, SessionStatus.REJECTED] },
    })
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

export const registerForSession = async (req, res) => {
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

    // TODO: refactor this to a separate function
    // Ensure user is not registering for multiple sessions at the same time
    const overlappingSession = await Session.findOne({
      participants: userId,
      $or: [
        {
          time_start: { $gte: session.time_start, $lte: session.time_end },
        },
        {
          time_end: { $gte: session.time_start, $lte: session.time_end },
        },
        {
          time_start: { $lte: session.time_start },
          time_end: { $gte: session.time_end },
        },
      ],
    });

    if (overlappingSession) {
      logger.warn(`Session conflict with session ${overlappingSession.title}`);
      return res.status(HttpStatusCode.CONFLICT).json({
        error: ResponseError.SESSION_OVERLAP,
        message: `Session conflict with session ${overlappingSession.title}`,
      });
    }

    // Ensure session is not full
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

// TODO: handle if max_participant edited to be less than current participants
export const editSession = async (req, res) => {
  logger.debug(`request editSession for session ${req.user.username}`);
  const { sessionId } = req.params;
  let { title, description, time_start, time_end, maximum_participants } =
    req.body;
  const userId = req.user._id;

  try {
    const session = await Session.findById(sessionId);
    if (!session) {
      logger.warn(`Session with ID ${sessionId} not found`);
      return res.status(HttpStatusCode.NOT_FOUND).json({
        error: ResponseError.NOT_FOUND,
        message: 'Session not found',
      });
    }

    // Ensure the user is the creator of the session
    if (session.created_by.toString() !== userId.toString()) {
      logger.warn(`User ${userId} is not authorized to edit this session`);
      return res.status(HttpStatusCode.FORBIDDEN).json({
        error: ResponseError.FORBIDDEN,
        message: 'You can only edit your own sessions',
      });
    }

    title = title || session.title;
    description = description || session.description;
    time_start = time_start || session.time_start;
    time_end = time_end || session.time_end;
    maximum_participants = maximum_participants || session.maximum_participants;

    // ensure time end is after time start
    if (time_end <= time_start) {
      logger.warn(
        `User ${req.user.username} attempted to create a proposal with invalid time range`
      );
      return res.status(HttpStatusCode.BAD_REQUEST).json({
        error: ResponseError.BAD_REQUEST,
        message: 'End time must be after start time',
      });
    }

    // TODO: refactor this to a separate function
    // ensure that the session proposal does not overlap with an existing session
    const overlappingSession = await Session.findOne({
      _id: { $ne: sessionId },
      created_by: userId,
      $or: [
        {
          time_start: { $gte: time_start, $lte: time_end },
        },
        {
          time_end: { $gte: time_start, $lte: time_end },
        },
        {
          time_start: { $lte: time_start },
          time_end: { $gte: time_end },
        },
      ],
    });

    if (overlappingSession) {
      logger.warn(
        `User ${req.user.username} attempted to create a proposal within same time period as existing session`
      );
      return res.status(HttpStatusCode.CONFLICT).json({
        error: ResponseError.SESSION_OVERLAP,
        message:
          'A session already exists within the specified time period. Please choose a different time.',
      });
    }

    session.title = title;
    session.description = description;
    session.time_start = time_start;
    session.time_end = time_end;
    session.maximum_participants = maximum_participants;

    await session.save();
    logger.debug(`Session updated successfully: ${session}`);
    return res.json({ message: 'Session updated successfully', session });
  } catch (err) {
    logger.error(`Error editing session: ${err.message}`, {
      error: err.stack,
    });
    return res.status(HttpStatusCode.INTERNAL_SERVER_ERROR).json({
      error: ResponseError.INTERNAL_SERVER_ERROR,
      message: `Failed to update session: ${err.message}`,
    });
  }
};

export const deleteSession = async (req, res) => {
  logger.debug(
    `request deleteSession for session ${req.params.sessionId} by ${req.user.username}`
  );
  const { sessionId } = req.params;
  const userId = req.user._id;

  try {
    const session = await Session.findById(sessionId);
    if (!session) {
      logger.warn(`Session with ID ${sessionId} not found`);
      return res.status(HttpStatusCode.NOT_FOUND).json({
        error: ResponseError.NOT_FOUND,
        message: 'Session not found',
      });
    }

    // TODO: refactor: build function to check this session created by current user
    // Ensure the user is the creator of the session or user is event-coordinator
    if (req.user.role !== 'event-coordinator')
      if (session.created_by.toString() !== userId.toString()) {
        logger.warn(`User ${userId} is not authorized to delete this session`);
        return res.status(HttpStatusCode.FORBIDDEN).json({
          error: ResponseError.FORBIDDEN,
          message: 'You can only delete your own sessions',
        });
      }

    await session.deleteOne();
    logger.debug('Session deleted successfully');
    return res.json({ message: 'Session deleted successfully' });
  } catch (err) {
    logger.error(`Error deleting session: ${err.message}`, {
      error: err.stack,
    });
    return res.status(HttpStatusCode.INTERNAL_SERVER_ERROR).json({
      error: ResponseError.INTERNAL_SERVER_ERROR,
      message: `Failed to delete session: ${err.message}`,
    });
  }
};

export const getSessionProposals = async (req, res) => {
  logger.debug(`request getSessionProposals from ${req.user.username}`);
  try {
    const sessions = await Session.find({
      status: SessionStatus.PROPOSAL,
    })
      .populate('created_by', 'username')
      .populate('participants', 'username');

    return res.json(sessions);
  } catch (err) {
    logger.error(`Error getSessionProposals: ${err.message}`, {
      error: err.stack,
    });
    return res.status(HttpStatusCode.INTERNAL_SERVER_ERROR).json({
      error: ResponseError.INTERNAL_SERVER_ERROR,
      message: `Failed to fetch sessions: ${err.message}`,
    });
  }
};
