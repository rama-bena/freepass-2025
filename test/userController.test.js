import { expect, it, jest } from '@jest/globals';
import {
  registerUser,
  loginUser,
  logoutUser,
  getUsers,
  getUserProfile,
} from '../src/controllers/userController';
import User from '../src/models/userModel';
import { HttpStatusCode, ResponseError, Role } from '../src/utils/types';

jest.mock('../src/config/config.js', () => ({
  jwt: {
    secret: 'mockSecret',
    expiresIn: '1h',
  },
  cookie: {
    login: {},
    logout: {},
  },
}));

describe('registerUser', () => {
  let req, res;

  beforeEach(() => {
    req = {
      body: {
        username: 'testuser',
        email: 'test@example.com',
        password: 'password123',
        role: Role.USER,
      },
    };

    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should register a new user successfully', async () => {
    jest.spyOn(User, 'findOne').mockResolvedValue(null);
    jest.spyOn(User.prototype, 'save').mockResolvedValue();

    await registerUser(req, res);

    expect(User.findOne).toHaveBeenCalledWith({ email: req.body.email });
    expect(User.prototype.save).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(HttpStatusCode.CREATED);
    expect(res.json).toHaveBeenCalledWith({
      _id: expect.anything(),
      username: req.body.username,
      email: req.body.email,
      role: req.body.role,
    });
  });

  it('should return conflict if user already exists', async () => {
    jest.spyOn(User, 'findOne').mockResolvedValue({ email: req.body.email });

    await registerUser(req, res);

    expect(User.findOne).toHaveBeenCalledWith({ email: req.body.email });
    expect(res.status).toHaveBeenCalledWith(HttpStatusCode.CONFLICT);
    expect(res.json).toHaveBeenCalledWith({
      error: ResponseError.CONFLICT,
      message: expect.any(String),
    });
  });

  it('should handle errors during registration', async () => {
    jest.spyOn(User, 'findOne').mockRejectedValue(new Error('Database error'));

    await registerUser(req, res);

    expect(User.findOne).toHaveBeenCalledWith({ email: req.body.email });
    expect(res.status).toHaveBeenCalledWith(
      HttpStatusCode.INTERNAL_SERVER_ERROR
    );
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        error: ResponseError.INTERNAL_SERVER_ERROR,
        message: expect.any(String),
      })
    );
  });
});

describe('loginUser', () => {
  let req, res, user;

  beforeEach(() => {
    req = {
      body: {
        email: 'test@example.com',
        password: 'password123',
      },
    };

    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      cookie: jest.fn(),
    };

    user = {
      _id: 'testUserId',
      username: 'testUser',
      email: 'test@example.com',
      role: Role.USER,
      matchPassword: jest.fn(),
    };
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  // TODO: create testcase for role user
  it('should login a user when email and password correct', async () => {
    jest.spyOn(User, 'findOne').mockResolvedValue(user);
    user.matchPassword.mockResolvedValue(true);

    await loginUser(req, res);

    expect(User.findOne).toHaveBeenCalledWith({ email: req.body.email });
    expect(user.matchPassword).toHaveBeenCalledWith(req.body.password);
    expect(res.cookie).toHaveBeenCalledWith(
      'token',
      expect.any(String),
      expect.any(Object)
    );
    expect(res.json).toHaveBeenCalledWith({
      _id: user._id,
      username: user.username,
      email: user.email,
      role: user.role,
    });
  });

  it('should return bad request if email is wrong', async () => {
    jest.spyOn(User, 'findOne').mockResolvedValue(null);

    await loginUser(req, res);

    expect(User.findOne).toHaveBeenCalledWith({ email: req.body.email });
    expect(res.cookie).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(HttpStatusCode.BAD_REQUEST);
    expect(res.json).toHaveBeenCalledWith({
      error: ResponseError.BAD_REQUEST,
      message: expect.any(String),
    });
  });

  it('should return bad request if password is wrong', async () => {
    jest.spyOn(User, 'findOne').mockResolvedValue(user);
    user.matchPassword.mockResolvedValue(false);

    await loginUser(req, res);

    expect(User.findOne).toHaveBeenCalledWith({ email: req.body.email });
    expect(user.matchPassword).toHaveBeenCalledWith(req.body.password);
    expect(res.cookie).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(HttpStatusCode.BAD_REQUEST);
    expect(res.json).toHaveBeenCalledWith({
      error: ResponseError.BAD_REQUEST,
      message: expect.any(String),
    });
  });

  it('should handle errors during login', async () => {
    jest.spyOn(User, 'findOne').mockRejectedValue(new Error('Database error'));

    await loginUser(req, res);

    expect(User.findOne).toHaveBeenCalledWith({ email: req.body.email });
    expect(res.cookie).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(
      HttpStatusCode.INTERNAL_SERVER_ERROR
    );
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        error: ResponseError.INTERNAL_SERVER_ERROR,
        message: expect.any(String),
      })
    );
  });
});

describe('logoutUser', () => {
  let req, res;

  beforeEach(() => {
    req = {
      user: {
        _id: 'testUserId',
      },
    };

    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      cookie: jest.fn(),
    };
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should logout a user successfully', async () => {
    await logoutUser(req, res);

    expect(res.cookie).toHaveBeenCalledWith('token', '', expect.any(Object));
    expect(res.json).toHaveBeenCalledWith({
      message: expect.any(String),
    });
  });
});

describe('getUsers', () => {
  let req, res, users;

  beforeEach(() => {
    req = {
      cookies: {
        token: 'mockToken',
      },
    };

    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    users = [
      {
        _id: 'user1',
        username: 'user1',
        email: 'user1@example.com',
        role: Role.USER,
      },
      {
        _id: 'user2',
        username: 'user2',
        email: 'user2@example.com',
        role: Role.USER,
      },
    ];
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should return a list of users', async () => {
    const UserMock = {
      select: jest.fn().mockResolvedValue(users),
    };
    jest.spyOn(User, 'find').mockReturnValue(UserMock);
    await getUsers(req, res);

    expect(User.find).toHaveBeenCalledWith({});
    expect(UserMock.select).toHaveBeenCalledWith('-password');
    expect(res.json).toHaveBeenCalledWith(users);
  });

  it('should handle errors during fetching users', async () => {
    jest.spyOn(User, 'find').mockImplementation(() => {
      throw new Error('Database error');
    });

    await getUsers(req, res);

    expect(User.find).toHaveBeenCalledWith({});
    expect(res.status).toHaveBeenCalledWith(
      HttpStatusCode.INTERNAL_SERVER_ERROR
    );
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        error: ResponseError.INTERNAL_SERVER_ERROR,
        message: expect.any(String),
      })
    );
  });
});

describe('getUserProfile', () => {
  let req, res, user;

  beforeEach(() => {
    req = {
      params: {
        username: 'testUser',
      },
    };

    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    user = {
      _id: 'testUserId',
      username: 'testUser',
      email: 'test@example.com',
    };
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should return user profile', async () => {
    const UserMock = {
      select: jest.fn().mockResolvedValue(user),
    };
    jest.spyOn(User, 'findOne').mockReturnValue(UserMock);

    await getUserProfile(req, res);

    expect(User.findOne).toHaveBeenCalledWith({
      username: req.params.username,
    });
    expect(UserMock.select).toHaveBeenCalledWith('-password');
    expect(res.json).toHaveBeenCalledWith(user);
  });

  it('should return not found if user does not exist', async () => {
    const UserMock = {
      select: jest.fn().mockResolvedValue(null),
    };
    jest.spyOn(User, 'findOne').mockReturnValue(UserMock);

    await getUserProfile(req, res);

    expect(User.findOne).toHaveBeenCalledWith({
      username: req.params.username,
    });
    expect(UserMock.select).toHaveBeenCalledWith('-password');
    expect(res.status).toHaveBeenCalledWith(HttpStatusCode.NOT_FOUND);
    expect(res.json).toHaveBeenCalledWith({
      error: ResponseError.NOT_FOUND,
      message: expect.any(String),
    });
  });

  it('should handle errors during fetching user profile', async () => {
    jest.spyOn(User, 'findOne').mockImplementation(() => {
      throw new Error('Database error');
    });

    await getUserProfile(req, res);

    expect(User.findOne).toHaveBeenCalledWith({
      username: req.params.username,
    });
    expect(res.status).toHaveBeenCalledWith(
      HttpStatusCode.INTERNAL_SERVER_ERROR
    );
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        error: ResponseError.INTERNAL_SERVER_ERROR,
        message: expect.any(String),
      })
    );
  });
});
