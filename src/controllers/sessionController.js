import Session from '../models/sessionModel.js';
import logger from '../utils/logger.js';
import {
  SessionStatus,
  HttpStatusCode,
  ResponseError,
  ProposalAction,
  Role,
} from '../utils/types.js';

const findOverlappingSession = async (
  userId,
  time_start,
  time_end,
  excludeSessionId = null
) => {
  const query = {
    participants: userId,
    $or: [
      { time_start: { $gte: time_start, $lte: time_end } },
      { time_end: { $gte: time_start, $lte: time_end } },
      { time_start: { $lte: time_start }, time_end: { $gte: time_end } },
    ],
  };
  if (excludeSessionId) {
    query._id = { $ne: excludeSessionId };
  }
  return await Session.findOne(query);
};

const isSessionExists = (session, sessionId, res) => {
  if (!session) {
    logger.warn(`Session with ID ${sessionId} not found`);
    res.status(HttpStatusCode.NOT_FOUND).json({
      error: ResponseError.NOT_FOUND,
      message: 'Session not found',
    });
    return false;
  }
  return true;
};

const isUserSessionOwner = (session, userId, res) => {
  if (session.created_by.toString() !== userId.toString()) {
    logger.warn(`User ${userId} is not authorized to perform this action`);
    res.status(HttpStatusCode.FORBIDDEN).json({
      error: ResponseError.FORBIDDEN,
      message: 'You can only perform this action on your own sessions',
    });
    return false;
  }
  return true;
};

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

    if (!isSessionExists(session, sessionId, res)) return;

    if (session.status !== SessionStatus.UPCOMING) {
      logger.warn(
        `Session with ID ${sessionId} not available for registration`
      );
      return res.status(HttpStatusCode.BAD_REQUEST).json({
        error: ResponseError.INVALID,
        message: 'Session not available for registration',
      });
    }

    if (session.participants.includes(userId)) {
      logger.warn(`User ${userId} already registered for session ${sessionId}`);
      return res.status(HttpStatusCode.CONFLICT).json({
        error: ResponseError.SESSION_OVERLAP,
        message: 'You are already registered for this session',
      });
    }

    const overlappingSession = await findOverlappingSession(
      userId,
      session.time_start,
      session.time_end
    );
    if (overlappingSession) {
      logger.warn(`Session conflict with session ${overlappingSession.title}`);
      return res.status(HttpStatusCode.CONFLICT).json({
        error: ResponseError.SESSION_OVERLAP,
        message: `Session conflict with session ${overlappingSession.title}`,
      });
    }

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

export const editSession = async (req, res) => {
  logger.debug(`request editSession for session ${req.user.username}`);
  const { sessionId } = req.params;
  let { title, description, time_start, time_end, maximum_participants } =
    req.body;
  const userId = req.user._id;

  try {
    const session = await Session.findById(sessionId);
    if (!isSessionExists(session, sessionId, res)) return;
    if (!isUserSessionOwner(session, userId, res)) return;

    title = title || session.title;
    description = description || session.description;
    time_start = time_start || session.time_start;
    time_end = time_end || session.time_end;
    if (maximum_participants && maximum_participants < session.participants.length) {
      return res.status(HttpStatusCode.BAD_REQUEST).json({
        error: ResponseError.BAD_REQUEST,
        message: 'Maximum participants cannot be less than current participants count'
      });
    }
    maximum_participants = maximum_participants || session.maximum_participants;

    if (time_end <= time_start) {
      logger.warn(
        `User ${req.user.username} attempted to create a proposal with invalid time range`
      );
      return res.status(HttpStatusCode.BAD_REQUEST).json({
        error: ResponseError.BAD_REQUEST,
        message: 'End time must be after start time',
      });
    }

    const overlappingSession = await findOverlappingSession(
      userId,
      time_start,
      time_end,
      sessionId
    );
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
    if (!isSessionExists(session, sessionId, res)) return;

    if (
      req.user.role !== 'event-coordinator' &&
      !isUserSessionOwner(session, userId, res)
    )
      return;

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

export async function createProposal(req, res) {
  logger.debug(`Request to create proposal from user: ${req.user.username}`);
  const { title, description, time_start, time_end, maximum_participants } =
    req.body;
  const userId = req.user._id;

  try {
    if (time_end <= time_start) {
      logger.warn(
        `User ${req.user.username} attempted to create a proposal with invalid time range`
      );
      return res.status(HttpStatusCode.BAD_REQUEST).json({
        error: ResponseError.BAD_REQUEST,
        message: 'End time must be after start time',
      });
    }

    const overlappingSession = await findOverlappingSession(
      userId,
      time_start,
      time_end
    );
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

    const newProposal = new Session({
      title,
      description,
      time_start,
      time_end,
      maximum_participants,
      created_by: userId,
    });

    await newProposal.save();
    logger.info(`Proposal created successfully by user: ${req.user.username}`);
    return res.status(HttpStatusCode.CREATED).json(newProposal);
  } catch (err) {
    logger.error(
      `Error creating proposal for user ${req.user.username}: ${err.message}`,
      {
        error: err.stack,
      }
    );
    return res.status(HttpStatusCode.INTERNAL_SERVER_ERROR).json({
      error: ResponseError.INTERNAL_SERVER_ERROR,
      message: `Error creating session proposal: ${err.message}`,
    });
  }
}

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

export const handleSessionProposal = async (req, res) => {
  const { sessionId } = req.params;
  const { action } = req.body;

  if (!Object.values(ProposalAction).includes(action)) {
    return res.status(HttpStatusCode.BAD_REQUEST).json({
      error: ResponseError.INVALID,
      message: 'Invalid action. It should be either "accept" or "reject".',
    });
  }

  try {
    const session = await Session.findById(sessionId);
    if (!isSessionExists(session, sessionId, res)) return;

    if (session.status !== SessionStatus.PROPOSAL) {
      logger.warn(`Session ${sessionId} is not in proposal status`);
      return res.status(HttpStatusCode.BAD_REQUEST).json({
        error: ResponseError.SESSION_NOT_PROPOSAL,
        message: 'Only session proposals can be updated',
      });
    }

    session.status =
      action === ProposalAction.ACCEPT
        ? SessionStatus.UPCOMING
        : SessionStatus.REJECTED;
    logger.info(`Session ${sessionId} ${action}ed`);
    await session.save();

    return res.json({ message: `Session ${action}ed successfully` });
  } catch (err) {
    logger.error(`Error handling session proposal: ${err.message}`, {
      error: err.stack,
    });
    return res.status(HttpStatusCode.INTERNAL_SERVER_ERROR).json({
      error: ResponseError.INTERNAL_SERVER_ERROR,
      message: `Failed to handle session proposal: ${err.message}`,
    });
  }
};

export const addFeedback = async (req, res) => {
  const { sessionId } = req.params;
  const { comment } = req.body;
  const userId = req.user._id;

  try {
    const session = await Session.findById(sessionId);
    if (!isSessionExists(session, sessionId, res)) return;

    if (
      session.status === SessionStatus.PROPOSAL ||
      session.status === SessionStatus.REJECTED
    ) {
      logger.warn(`Session ${sessionId} is not available for feedback`);
      return res.status(HttpStatusCode.BAD_REQUEST).json({
        error: ResponseError.SESSION_NOT_ACCEPTED,
        message: 'Session not available for feedback',
      });
    }

    const feedback = { user_id: userId, comment };
    logger.debug(
      `request addFeedback from ${req.user.username}, to ${session.title}, feedback: ${feedback}`
    );
    session.feedbacks.push(feedback);
    await session.save();
    logger.debug(`Feedback added successfully: ${feedback}`);
    return res.json({ message: 'Feedback added successfully' });
  } catch (err) {
    logger.error(`Error leaving feedback: ${err.message}`, {
      error: err.stack,
    });
    return res.status(HttpStatusCode.INTERNAL_SERVER_ERROR).json({
      error: ResponseError.INTERNAL_SERVER_ERROR,
      message: `Failed to leave feedback: ${err.message}`,
    });
  }
};

export const removeFeedback = async (req, res) => {
  const { sessionId, feedbackId } = req.params;

  try {
    const session = await Session.findById(sessionId);
    if (!isSessionExists(session, sessionId, res)) return;

    const feedbackIndex = session.feedbacks.findIndex(
      (feedback) => feedback._id.toString() === feedbackId
    );
    if (feedbackIndex === -1) {
      logger.warn(`Feedback with ID ${feedbackId} not found`);
      return res.status(HttpStatusCode.NOT_FOUND).json({
        error: ResponseError.NOT_FOUND,
        message: 'Feedback not found',
      });
    }

    if (req.user.role !== Role.EVENT_COORDINATOR) {
      return res.status(HttpStatusCode.FORBIDDEN).json({
        error: ResponseError.FORBIDDEN,
        message: 'You do not have permission to remove feedback',
      });
    }

    session.feedbacks.splice(feedbackIndex, 1);
    await session.save();

    logger.debug(`Feedback removed successfully: ${feedbackId}`);
    return res.json({ message: 'Feedback removed successfully' });
  } catch (err) {
    logger.error(`Error removing feedback: ${err.message}`, {
      error: err.stack,
    });
    return res.status(HttpStatusCode.INTERNAL_SERVER_ERROR).json({
      error: ResponseError.INTERNAL_SERVER_ERROR,
      message: `Failed to remove feedback: ${err.message}`,
    });
  }
};
