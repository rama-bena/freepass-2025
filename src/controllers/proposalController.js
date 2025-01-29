import Session from '../models/sessionModel.js';
import logger from '../utils/logger.js';
import {
  HttpStatusCode,
  ResponseError,
} from '../utils/types.js';

export async function createProposal(req, res) {
  logger.debug(`Request to create proposal from user: ${req.user.username}`);
  const { title, description, time_start, time_end, maximum_participants } =
    req.body;
  const userId = req.user._id;

  try {

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
    // ensure that the session proposal does not overlap with an existing session
    const overlappingSession = await Session.findOne({
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
